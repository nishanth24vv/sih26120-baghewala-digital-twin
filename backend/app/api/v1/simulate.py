"""
Interactive Digital Twin Sandbox Simulation Endpoints.
Calculates temporary what-if coupled state without mutating base database state.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db_models import Well
from app.models.digital_twin import DigitalTwinState
from app.schemas.api_schemas import SimulationRequest
from app.simulation.twin_engine import build_digital_twin_state

router = APIRouter(prefix="/simulate", tags=["Digital Twin Simulation"])

@router.post("", response_model=DigitalTwinState)
def simulate_twin_scenario(req: SimulationRequest, db: Session = Depends(get_db)):
    """
    Execute an interactive what-if multi-physics simulation of Reservoir -> Wellbore -> SRP.
    Returns the updated temporary DigitalTwinState.
    """
    well = db.query(Well).filter(Well.well_id == req.well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail=f"Well {req.well_id} not found.")

    override_params = {
        "steam_volume": req.steam_volume,
        "injection_pressure": req.injection_pressure,
        "soak_time": req.soak_time,
        "production_cutoff": req.production_cutoff,
        "stroke": req.stroke_length,
        "spm": req.spm,
        "vfd": req.vfd_frequency,
    }
    if req.temperature_override is not None:
        override_params["temperature"] = req.temperature_override

    # Compute coupled state without mutating the DB well record
    simulated_state = build_digital_twin_state(well, override_params=override_params)
    return simulated_state
