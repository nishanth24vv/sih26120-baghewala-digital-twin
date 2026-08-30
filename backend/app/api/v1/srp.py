"""
Sucker Rod Pumping (SRP) Mechanics and Prediction Endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db_models import Well
from app.schemas.api_schemas import SRPPredictRequest, SRPPredictResponse
from app.physics.reservoir import calculate_oil_viscosity
from app.physics.srp import calculate_srp_mechanics
from app.physics.dynacard import generate_dynacard_points
from app.ml.registry import MODEL_REGISTRY

router = APIRouter(prefix="/srp", tags=["SRP Optimization & Prediction"])

@router.post("/predict", response_model=SRPPredictResponse)
def predict_srp_response(req: SRPPredictRequest, db: Session = Depends(get_db)):
    """
    Simulate rod kinematics, dynamic viscous drag, PPRL/MPRL, dynacard, and mechanical failure risks.
    """
    well = db.query(Well).filter(Well.well_id == req.well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail=f"Well {req.well_id} not found.")

    visc_cp = req.wellbore_viscosity_override or float(well.current_viscosity or 450.0)
    oil_rate = float(well.current_oil_rate or 38.0)
    water_rate = float(well.current_water_rate or 12.0)

    # 1. Physics Calculations
    srp_mech = calculate_srp_mechanics(
        stroke_length_in=req.stroke_length,
        spm=req.spm,
        vfd_frequency_hz=req.vfd_frequency,
        wellbore_viscosity_cp=visc_cp,
        oil_rate_bopd=oil_rate,
        water_rate_bwpd=water_rate,
        pump_depth_m=well.reservoir_depth_m - 50.0,
        pump_bore_in=well.pump_bore_in or 2.25,
        rod_diameter_in=well.rod_diameter_in or 1.0,
        tubing_id_in=well.tubing_id_in or 2.992
    )

    # 2. Risk Predictions
    float_res = MODEL_REGISTRY.predict_rod_floating_risk(
        rod_load=srp_mech["rod_load_kn"],
        pump_load=srp_mech["pump_load_kn"],
        spm=req.spm,
        vfd=req.vfd_frequency,
        stroke=req.stroke_length,
        temperature=well.current_temperature or 60.0,
        viscosity=visc_cp,
        oil_rate=oil_rate,
        mprl=srp_mech["mprl_kn"]
    )

    fail_res = MODEL_REGISTRY.predict_rod_failure_risk(
        rod_load=srp_mech["rod_load_kn"],
        pprl=srp_mech["pprl_kn"],
        mprl=srp_mech["mprl_kn"],
        spm=req.spm,
        stroke=req.stroke_length,
        viscosity=visc_cp,
        floating_risk=float_res["probability"],
        energy=srp_mech["energy_consumption"]
    )

    # 3. Dynacard Generation
    dynacard = generate_dynacard_points(
        stroke_length_in=req.stroke_length,
        spm=req.spm,
        pprl_kn=srp_mech["pprl_kn"],
        mprl_kn=srp_mech["mprl_kn"],
        pump_load_kn=srp_mech["pump_load_kn"],
        pump_efficiency_pct=srp_mech["pump_efficiency"],
        viscous_drag_kn=srp_mech["dynamic_viscous_drag_kn"]
    )

    return SRPPredictResponse(
        well_id=req.well_id,
        pprl=srp_mech["pprl_kn"],
        mprl=srp_mech["mprl_kn"],
        load_span=srp_mech.get("load_span_kn", round(srp_mech["pprl_kn"] - srp_mech["mprl_kn"], 1)),
        scaled_load_ratio=srp_mech.get("scaled_load_ratio", 0.55),
        rod_load=srp_mech["rod_load_kn"],
        pump_load=srp_mech["pump_load_kn"],
        dynamic_viscous_drag=srp_mech["dynamic_viscous_drag_kn"],
        pump_efficiency=srp_mech["pump_efficiency"],
        rod_stress_ratio=srp_mech["rod_stress_ratio"],
        prhp_kw=srp_mech.get("prhp_kw", dynacard.get("prhp_kw", 0.0)),
        prhp_hp=srp_mech.get("prhp_hp", dynacard.get("prhp_hp", 0.0)),
        pump_fillage_pct=dynacard.get("pump_fillage_pct", srp_mech["pump_efficiency"]),
        floating_probability=float_res["probability"],
        floating_risk_level=float_res["level"],
        failure_probability=fail_res["probability"],
        failure_risk_level=fail_res["level"],
        energy_consumption=srp_mech["energy_consumption"],
        dynacard=dynacard
    )
