"""
CSS Thermal Simulation and Prediction Endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import numpy as np

from app.core.database import get_db
from app.models.db_models import Well
from app.schemas.api_schemas import CSSPredictRequest, CSSPredictResponse
from app.physics.reservoir import (
    calculate_steam_heating, calculate_temperature_decay_curve,
    calculate_oil_viscosity, calculate_inflow_production
)
from app.ml.registry import MODEL_REGISTRY

router = APIRouter(prefix="/css", tags=["CSS Optimization & Prediction"])

@router.post("/predict", response_model=CSSPredictResponse)
def predict_css_response(req: CSSPredictRequest, db: Session = Depends(get_db)):
    """
    Simulate thermal diffusion, cooling curve, oil deliverability, and SOR for candidate CSS parameters.
    """
    well = db.query(Well).filter(Well.well_id == req.well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail=f"Well {req.well_id} not found.")

    # 1. Thermal Steam Heating & Soak Diffusion
    peak_temp_c, heated_radius_m, heating_state = calculate_steam_heating(
        steam_volume_m3=req.steam_volume,
        injection_pressure_bar=req.injection_pressure,
        soak_time_hr=req.soak_time,
        initial_temp_c=38.0
    )

    # 2. Daily Thermal Cooling Curve
    temp_curve = calculate_temperature_decay_curve(
        peak_temp_c=peak_temp_c,
        base_temp_c=38.0,
        days_produced=req.production_cutoff,
        fluid_rate_bfpd=60.0,
        total_days=int(req.production_cutoff)
    )

    # 3. Average cycle temperature & deliverability
    avg_cycle_temp = float(np.mean([pt["temperature"] for pt in temp_curve]))
    avg_cycle_visc = calculate_oil_viscosity(avg_cycle_temp)

    oil_rate_phys, water_rate_phys, _ = calculate_inflow_production(
        reservoir_pressure_bar=68.0,
        flowing_bottomhole_pressure_bar=18.0,
        temp_c=avg_cycle_temp,
        permeability_md=well.permeability_md or 450.0
    )

    # ML Blend
    pred_ml = MODEL_REGISTRY.predict_production(
        temperature=avg_cycle_temp,
        pressure=18.0,
        viscosity=avg_cycle_visc,
        spm=well.current_spm or 3.8,
        stroke=well.current_stroke or 72.0,
        vfd=well.current_vfd or 38.0,
        rod_load=well.current_rod_load or 80.0
    )
    blended_oil = round(0.4 * oil_rate_phys + 0.6 * pred_ml, 1)

    predicted_sor = round(req.steam_volume / max(blended_oil, 1.0), 2)
    cum_recovery = round(blended_oil * req.production_cutoff, 0)
    predicted_energy = round(80.0 + (predicted_sor * 2.2), 1)

    visc_curve = [{"day": pt["day"], "viscosity": pt["viscosity"]} for pt in temp_curve]

    return CSSPredictResponse(
        well_id=req.well_id,
        predicted_oil_rate=blended_oil,
        predicted_sor=predicted_sor,
        predicted_energy=predicted_energy,
        recovery=cum_recovery,
        peak_temperature=round(peak_temp_c, 1),
        temperature_forecast=temp_curve,
        viscosity_forecast=visc_curve,
        model_version="v1.2 (Thermal Diffusion + GradientBoosting)"
    )
