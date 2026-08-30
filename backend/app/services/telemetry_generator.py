"""
Simulated Telemetry Streamer and Anomaly Injection Engine for Real-Time Monitoring.
Emits live continuous sensor samples (every 1-2 sec) with dynacards,
dynamically propagates state updates to the Digital Twin, and triggers real-time alert cascades.
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
import numpy as np

from app.models.db_models import Well
from app.physics.reservoir import calculate_oil_viscosity
from app.physics.srp import calculate_srp_mechanics
from app.physics.dynacard import generate_dynacard_points
from app.ml.registry import MODEL_REGISTRY

# Active anomaly injection state per well
ACTIVE_ANOMALIES: Dict[str, Dict[str, Any]] = {}

def inject_anomaly_into_well(well_id: str, anomaly_type: str) -> Dict[str, Any]:
    """
    Inject an operational anomaly into the live telemetry stream.
    Anomaly types:
        - TEMPERATURE_DROP
        - HIGH_VISCOSITY
        - HIGH_ROD_LOAD
        - ROD_FLOATING
        - PUMP_UNSETTING
        - PRODUCTION_DROP
    """
    ACTIVE_ANOMALIES[well_id] = {
        "type": anomaly_type,
        "timestamp": datetime.utcnow().isoformat(),
        "step": 0
    }
    return {
        "status": "INJECTED",
        "well_id": well_id,
        "anomaly": anomaly_type,
        "message": f"Operational disturbance '{anomaly_type}' successfully injected into live sensor feed."
    }

def clear_anomalies(well_id: str) -> Dict[str, Any]:
    """Clear any active anomaly for the well, restoring nominal telemetry."""
    if well_id in ACTIVE_ANOMALIES:
        del ACTIVE_ANOMALIES[well_id]
    return {"status": "CLEARED", "well_id": well_id}

def generate_telemetry_tick(well: Well) -> Dict[str, Any]:
    """
    Generate a live sensor reading tick for a well, applying any active anomaly disturbance.
    """
    now = datetime.utcnow()
    anomaly = ACTIVE_ANOMALIES.get(well.well_id)

    # Base well values
    temp_c = float(well.current_temperature or 68.0)
    spm = float(well.current_spm or 3.8)
    stroke = float(well.current_stroke or 72.0)
    vfd = float(well.current_vfd or 38.0)
    oil_rate = float(well.current_oil_rate or 42.0)
    water_rate = float(well.current_water_rate or 14.0)

    # Apply Anomaly Perturbations
    anomaly_name = None
    if anomaly:
        anomaly_name = anomaly["type"]
        anomaly["step"] += 1
        step = anomaly["step"]

        if anomaly_name == "TEMPERATURE_DROP":
            # Acute reservoir cooling
            temp_c = max(38.0, temp_c - (step * 2.2))
        elif anomaly_name == "HIGH_VISCOSITY":
            temp_c = max(35.0, temp_c - (step * 3.0))
        elif anomaly_name == "HIGH_ROD_LOAD":
            spm = min(5.5, spm + 0.8)
            stroke = min(120.0, stroke + 24.0)
        elif anomaly_name == "ROD_FLOATING":
            temp_c = 48.0
            spm = 4.6
        elif anomaly_name == "PUMP_UNSETTING":
            spm = 4.8
        elif anomaly_name == "PRODUCTION_DROP":
            oil_rate = max(8.0, oil_rate * 0.45)

    # Add realistic sensor oscillation
    temp_c += np.random.normal(0, 0.15)
    viscosity_cp = calculate_oil_viscosity(temp_c)

    # Calculate real-time SRP mechanics & dynacard
    srp_mech = calculate_srp_mechanics(
        stroke_length_in=stroke,
        spm=spm + np.random.normal(0, 0.02),
        vfd_frequency_hz=vfd,
        wellbore_viscosity_cp=viscosity_cp,
        oil_rate_bopd=oil_rate,
        water_rate_bwpd=water_rate
    )

    # Risk models
    float_res = MODEL_REGISTRY.predict_rod_floating_risk(
        rod_load=srp_mech["rod_load_kn"],
        pump_load=srp_mech["pump_load_kn"],
        spm=spm,
        vfd=vfd,
        stroke=stroke,
        temperature=temp_c,
        viscosity=viscosity_cp,
        oil_rate=oil_rate,
        mprl=srp_mech["mprl_kn"]
    )

    fail_res = MODEL_REGISTRY.predict_rod_failure_risk(
        rod_load=srp_mech["rod_load_kn"],
        pprl=srp_mech["pprl_kn"],
        mprl=srp_mech["mprl_kn"],
        spm=spm,
        stroke=stroke,
        viscosity=viscosity_cp,
        floating_risk=float_res["probability"],
        energy=srp_mech["energy_consumption"]
    )

    unset_res = MODEL_REGISTRY.predict_pump_unsetting_risk(
        pump_load=srp_mech["pump_load_kn"],
        rod_load=srp_mech["rod_load_kn"],
        spm=spm,
        vfd=vfd,
        viscosity=viscosity_cp,
        temperature=temp_c,
        oil_rate=oil_rate
    )

    # Generate live dynacard
    dynacard = generate_dynacard_points(
        stroke_length_in=stroke,
        spm=spm,
        pprl_kn=srp_mech["pprl_kn"],
        mprl_kn=srp_mech["mprl_kn"],
        pump_load_kn=srp_mech["pump_load_kn"],
        pump_efficiency_pct=srp_mech["pump_efficiency"],
        viscous_drag_kn=srp_mech["dynamic_viscous_drag_kn"]
    )

    # Real-time alert trigger if thresholds breached
    alert = None
    if float_res["probability"] > 0.70:
        alert = {
            "severity": "CRITICAL" if float_res["probability"] > 0.85 else "HIGH",
            "title": "Severe Rod Floating Risk",
            "message": f"Live downstroke drag is {srp_mech['dynamic_viscous_drag_kn']} kN in {viscosity_cp:.0f} cP crude. Rod string deceleration is slower than carrier bar.",
            "recommended_action": f"Reduce SPM from {spm:.1f} to 3.6 or initiate CSS thermal cycle."
        }
    elif srp_mech["pprl_kn"] > 115.0:
        alert = {
            "severity": "HIGH",
            "title": "Peak Polished Rod Overload",
            "message": f"PPRL is {srp_mech['pprl_kn']} kN (Rod stress ratio {srp_mech['rod_stress_ratio']*100:.1f}%).",
            "recommended_action": "Reduce stroke length or lower VFD frequency."
        }

    return {
        "well_id": well.well_id,
        "timestamp": now.strftime("%H:%M:%S"),
        "timestamp_iso": now.isoformat(),
        "temperature": round(temp_c, 1),
        "pressure": round(float(well.current_pressure or 62.0) + np.random.normal(0, 0.1), 1),
        "viscosity": round(viscosity_cp, 1),
        "oil_rate": round(oil_rate + np.random.normal(0, 0.3), 1),
        "water_rate": round(water_rate, 1),
        "spm": round(spm, 2),
        "stroke": stroke,
        "vfd": vfd,
        "pprl": srp_mech["pprl_kn"],
        "mprl": srp_mech["mprl_kn"],
        "rod_load": srp_mech["rod_load_kn"],
        "pump_load": srp_mech["pump_load_kn"],
        "dynamic_viscous_drag": srp_mech["dynamic_viscous_drag_kn"],
        "pump_efficiency": srp_mech["pump_efficiency"],
        "energy_consumption": srp_mech["energy_consumption"],
        "floating_risk": float_res["probability"],
        "floating_risk_level": float_res["level"],
        "failure_risk": fail_res["probability"],
        "failure_risk_level": fail_res["level"],
        "unsetting_risk": unset_res["probability"],
        "unsetting_risk_level": unset_res["level"],
        "active_anomaly": anomaly_name,
        "dynacard": dynacard,
        "alert": alert
    }
