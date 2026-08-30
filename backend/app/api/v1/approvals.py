"""
Operator Approval Workflow and Audit Trail Endpoints.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.db_models import Well, AuditLog, OptimizationRun
from app.schemas.api_schemas import ApprovalRequest
from app.simulation.twin_engine import build_digital_twin_state

router = APIRouter(prefix="/approvals", tags=["Approvals & Audit Trail"])

@router.post("/approve")
def approve_recommendation(req: ApprovalRequest, db: Session = Depends(get_db)):
    """
    Operator approves (or modifies) an AI recommendation.
    Updates the Well's persistent state and records an entry in the Audit Log.
    """
    well = db.query(Well).filter(Well.well_id == req.well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail=f"Well {req.well_id} not found.")

    approved_params = req.final_approved_parameters

    # Update Well's current operational parameters
    if "spm" in approved_params:
        well.current_spm = round(float(approved_params["spm"]), 2)
    if "stroke" in approved_params or "stroke_length" in approved_params:
        well.current_stroke = round(float(approved_params.get("stroke", approved_params.get("stroke_length", 72.0))), 1)
    if "vfd" in approved_params or "vfd_frequency" in approved_params:
        well.current_vfd = round(float(approved_params.get("vfd", approved_params.get("vfd_frequency", 38.0))), 1)

    # Recompute updated state for the well
    updated_state = build_digital_twin_state(well, override_params=approved_params)

    # Persist updated twin state to Well table
    well.current_oil_rate = updated_state.production.oil_rate
    well.current_water_rate = updated_state.production.water_rate
    well.current_temperature = updated_state.reservoir.temperature
    well.current_pressure = updated_state.reservoir.pressure
    well.current_viscosity = updated_state.reservoir.viscosity
    well.current_sor = updated_state.production.sor
    well.current_energy = updated_state.production.energy_consumption
    well.current_pump_eff = updated_state.srp.pump_efficiency
    well.current_rod_load = updated_state.srp.rod_load
    well.current_floating_risk = updated_state.risks.rod_floating
    well.current_failure_risk = updated_state.risks.rod_failure
    well.current_unsetting_risk = updated_state.risks.pump_unsetting

    # Record in Audit Log
    audit_entry = AuditLog(
        timestamp=datetime.utcnow(),
        user=req.operator_name,
        well_id=req.well_id,
        action=req.action,
        previous_parameters=req.previous_parameters,
        recommended_parameters=req.recommended_parameters,
        final_approved_parameters=req.final_approved_parameters,
        reason=req.reason,
        approval_status="APPROVED" if req.action == "APPROVE" else "MODIFIED_APPROVED"
    )
    db.add(audit_entry)

    # Update OptimizationRun status if ID provided
    if req.optimization_id:
        opt_run = db.query(OptimizationRun).filter(OptimizationRun.optimization_id == req.optimization_id).first()
        if opt_run:
            opt_run.status = "APPROVED"
            opt_run.operator_modified_parameters = req.final_approved_parameters

    db.commit()

    return {
        "status": "APPROVED",
        "message": f"Parameters approved and applied to Digital Twin for {req.well_id}.",
        "updated_twin_state": updated_state
    }

@router.get("/audit-log", response_model=List[Dict[str, Any]])
def get_audit_log(db: Session = Depends(get_db)):
    """Retrieve full chronological audit trail of operator decisions."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
    return [{
        "id": log.id,
        "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "user": log.user,
        "well_id": log.well_id,
        "action": log.action,
        "previous_parameters": log.previous_parameters,
        "recommended_parameters": log.recommended_parameters,
        "final_approved_parameters": log.final_approved_parameters,
        "reason": log.reason,
        "approval_status": log.approval_status
    } for log in logs]
