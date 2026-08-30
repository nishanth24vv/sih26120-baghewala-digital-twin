"""
Well Management and Digital Twin State Endpoints.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db_models import Well, ProductionRecord, CSSCycle, SRPOperation, FailureRecord
from app.models.digital_twin import DigitalTwinState
from app.simulation.twin_engine import build_digital_twin_state
from scripts.generate_synthetic_data import generate_field_dataset

router = APIRouter(prefix="/wells", tags=["Wells & Digital Twin"])

@router.get("", response_model=List[Dict[str, Any]])
def list_wells(db: Session = Depends(get_db)):
    """Retrieve summary of all wells in Baghewala field."""
    wells = db.query(Well).all()
    res = []
    for w in wells:
        res.append({
            "id": w.id,
            "well_id": w.well_id,
            "name": w.name,
            "field": w.field,
            "status": w.status,
            "scenario_type": w.scenario_type,
            "current_oil_rate": w.current_oil_rate,
            "current_water_rate": w.current_water_rate,
            "current_temperature": w.current_temperature,
            "current_pressure": w.current_pressure,
            "current_viscosity": w.current_viscosity,
            "current_sor": w.current_sor,
            "current_energy": w.current_energy,
            "current_stroke": w.current_stroke,
            "current_spm": w.current_spm,
            "current_vfd": w.current_vfd,
            "current_pump_eff": w.current_pump_eff,
            "current_rod_load": w.current_rod_load,
            "current_floating_risk": w.current_floating_risk,
            "current_failure_risk": w.current_failure_risk,
            "current_unsetting_risk": w.current_unsetting_risk
        })
    return res

@router.get("/{well_id}/state", response_model=DigitalTwinState)
def get_well_digital_twin_state(well_id: str, db: Session = Depends(get_db)):
    """Retrieve the central single-source-of-truth DigitalTwinState for a well."""
    well = db.query(Well).filter(Well.well_id == well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail=f"Well {well_id} not found.")
    return build_digital_twin_state(well)

@router.get("/{well_id}/history")
def get_well_production_history(
    well_id: str,
    days: int = Query(default=90, ge=7, le=365),
    db: Session = Depends(get_db)
):
    """Retrieve historical daily production and sensor time-series for charts."""
    records = db.query(ProductionRecord)\
        .filter(ProductionRecord.well_id == well_id)\
        .order_by(ProductionRecord.timestamp.desc())\
        .limit(days)\
        .all()
    
    records = list(reversed(records))
    return [{
        "timestamp": r.timestamp.strftime("%Y-%m-%d"),
        "oil_rate": r.oil_rate,
        "water_rate": r.water_rate,
        "fluid_rate": r.fluid_rate,
        "pressure": r.pressure,
        "temperature": r.temperature,
        "viscosity": r.viscosity,
        "sor": r.sor,
        "energy_kwh": r.energy_kwh
    } for r in records]

@router.get("/{well_id}/css-cycles")
def get_well_css_cycles(well_id: str, db: Session = Depends(get_db)):
    """Retrieve historical CSS cycle operational records."""
    cycles = db.query(CSSCycle)\
        .filter(CSSCycle.well_id == well_id)\
        .order_by(CSSCycle.cycle_number.asc())\
        .all()
    return [{
        "cycle_number": c.cycle_number,
        "start_date": c.start_date.strftime("%Y-%m-%d"),
        "steam_volume": c.steam_volume,
        "injection_pressure": c.injection_pressure,
        "soak_time": c.soak_time,
        "production_cutoff": c.production_cutoff,
        "oil_recovery": c.oil_recovery,
        "sor": c.sor,
        "energy_consumption": c.energy_consumption,
        "peak_temperature": c.peak_temperature
    } for c in cycles]

@router.get("/{well_id}/failures")
def get_well_failures(well_id: str, db: Session = Depends(get_db)):
    """Retrieve historical mechanical failure events."""
    failures = db.query(FailureRecord)\
        .filter(FailureRecord.well_id == well_id)\
        .order_by(FailureRecord.timestamp.desc())\
        .all()
    return [{
        "id": f.id,
        "timestamp": f.timestamp.strftime("%Y-%m-%d %H:%M"),
        "failure_type": f.failure_type,
        "severity": f.severity,
        "operating_hours": f.operating_hours,
        "description": f.description,
        "contributing_factors": f.contributing_factors
    } for f in failures]

@router.post("/demo/reset")
def reset_demo_database():
    """Deterministic One-Click Reset for SIH Judging Demonstration."""
    generate_field_dataset()
    return {
        "status": "RESET_COMPLETE",
        "message": "Field dataset and BGW-001 judging baseline restored successfully."
    }
