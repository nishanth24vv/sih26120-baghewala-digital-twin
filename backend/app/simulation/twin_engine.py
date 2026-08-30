"""
Unified Digital Twin Engine for Baghewala Heavy-Oil Field.
Single Source of Truth for coupling Reservoir -> Wellbore -> SRP -> Production -> Risks.
Supports both live synchronized state retrieval and temporary sandbox simulation.
"""

from typing import Dict, Any, Optional
from datetime import datetime
import numpy as np

from app.models.digital_twin import (
    DigitalTwinState, ReservoirState, WellboreState, SRPState,
    ProductionState, RiskState, RiskFactor
)
from app.models.db_models import Well
from app.physics.reservoir import (
    calculate_oil_viscosity, calculate_steam_heating,
    calculate_inflow_production, calculate_temperature_decay_curve
)
from app.physics.wellbore import calculate_wellbore_state
from app.physics.srp import calculate_srp_mechanics
from app.ml.registry import MODEL_REGISTRY

def build_digital_twin_state(
    well: Well,
    override_params: Optional[Dict[str, Any]] = None
) -> DigitalTwinState:
    """
    Construct the fully coupled DigitalTwinState for a well.
    Allows optional parameter overrides for what-if simulation sandbox.
    """
    params = override_params or {}

    # Extract or override CSS and SRP controls
    spm = float(params.get("spm", well.current_spm))
    stroke = float(params.get("stroke_length", params.get("stroke", well.current_stroke)))
    vfd = float(params.get("vfd_frequency", params.get("vfd", well.current_vfd)))
    
    steam_vol = float(params.get("steam_volume", 85.0))
    inj_press = float(params.get("injection_pressure", 18.0))
    soak_time = float(params.get("soak_time", 72.0))
    prod_days = float(params.get("production_cutoff", 30.0))

    # 1. Thermal & Viscosity State
    if "temperature" in params:
        res_temp = float(params["temperature"])
    elif "steam_volume" in params or "injection_pressure" in params or "soak_time" in params:
        peak_t, h_rad, h_state = calculate_steam_heating(steam_vol, inj_press, soak_time, 38.0)
        # Assume halfway through production cycle
        decay_factor = np.exp(-0.022 * (prod_days * 0.5))
        res_temp = 38.0 + (peak_t - 38.0) * decay_factor
    else:
        res_temp = float(well.current_temperature)

    res_viscosity = calculate_oil_viscosity(res_temp)
    res_pressure = float(well.current_pressure if well.current_pressure else 65.0)
    permeability = float(well.permeability_md if well.permeability_md else 450.0)
    mobility = float(permeability / max(res_viscosity, 1.0))

    # 2. Wellbore & Inflow State
    oil_rate_calc, water_rate_calc, _ = calculate_inflow_production(
        reservoir_pressure_bar=res_pressure,
        flowing_bottomhole_pressure_bar=18.0,
        temp_c=res_temp,
        permeability_md=permeability
    )

    pwf, ppip, f_level, wb_temp, wb_visc = calculate_wellbore_state(
        reservoir_pressure_bar=res_pressure,
        reservoir_temp_c=res_temp,
        oil_rate_bopd=oil_rate_calc,
        water_rate_bwpd=water_rate_calc,
        pump_depth_m=well.reservoir_depth_m - 50.0,
        total_depth_m=well.reservoir_depth_m
    )

    # 3. SRP Kinematics & Mechanics
    srp_mech = calculate_srp_mechanics(
        stroke_length_in=stroke,
        spm=spm,
        vfd_frequency_hz=vfd,
        wellbore_viscosity_cp=wb_visc,
        oil_rate_bopd=oil_rate_calc,
        water_rate_bwpd=water_rate_calc,
        pump_depth_m=well.reservoir_depth_m - 50.0,
        pump_bore_in=well.pump_bore_in or 2.25,
        rod_diameter_in=well.rod_diameter_in or 1.0,
        tubing_id_in=well.tubing_id_in or 2.992
    )

    # ML Production Predictor
    pred_oil_rate = MODEL_REGISTRY.predict_production(
        temperature=res_temp,
        pressure=pwf,
        viscosity=res_viscosity,
        spm=spm,
        stroke=stroke,
        vfd=vfd,
        rod_load=srp_mech["rod_load_kn"]
    )
    # Blend physics & ML
    final_oil_rate = round(0.4 * oil_rate_calc + 0.6 * pred_oil_rate, 1)
    water_cut = 0.25
    final_water_rate = round(final_oil_rate * (water_cut / (1.0 - water_cut)), 1)
    final_fluid_rate = round(final_oil_rate + final_water_rate, 1)

    # 4. Risk Models
    float_risk_info = MODEL_REGISTRY.predict_rod_floating_risk(
        rod_load=srp_mech["rod_load_kn"],
        pump_load=srp_mech["pump_load_kn"],
        spm=spm,
        vfd=vfd,
        stroke=stroke,
        temperature=res_temp,
        viscosity=res_viscosity,
        oil_rate=final_oil_rate,
        mprl=srp_mech["mprl_kn"]
    )

    fail_risk_info = MODEL_REGISTRY.predict_rod_failure_risk(
        rod_load=srp_mech["rod_load_kn"],
        pprl=srp_mech["pprl_kn"],
        mprl=srp_mech["mprl_kn"],
        spm=spm,
        stroke=stroke,
        viscosity=res_viscosity,
        floating_risk=float_risk_info["probability"],
        energy=srp_mech["energy_consumption"]
    )

    unset_risk_info = MODEL_REGISTRY.predict_pump_unsetting_risk(
        pump_load=srp_mech["pump_load_kn"],
        rod_load=srp_mech["rod_load_kn"],
        spm=spm,
        vfd=vfd,
        viscosity=res_viscosity,
        temperature=res_temp,
        oil_rate=final_oil_rate
    )

    # Calculate Steam-to-Oil Ratio and Recovery
    sor_val = round(steam_vol / max(final_oil_rate, 1.0), 2)
    est_recovery_bbl = round(final_oil_rate * prod_days, 0)

    # Contributing factors for Explainability & Risk cards
    contributing_factors = {
        "rod_floating": [
            RiskFactor(name="Viscous Shear Drag", contribution=0.45, value=f"{srp_mech['dynamic_viscous_drag_kn']} kN", threshold="< 18.0 kN"),
            RiskFactor(name="Pumping Speed (SPM)", contribution=0.25, value=f"{spm:.1f} SPM", threshold="<= 3.8 SPM"),
            RiskFactor(name="Oil Viscosity", contribution=0.20, value=f"{res_viscosity:.0f} cP", threshold="< 450 cP"),
            RiskFactor(name="Minimum Load (MPRL)", contribution=0.10, value=f"{srp_mech['mprl_kn']:.1f} kN", threshold="> 12.0 kN")
        ],
        "rod_failure": [
            RiskFactor(name="Floating Impact Shocks", contribution=0.50, value=f"{float_risk_info['probability']*100:.0f}%", threshold="< 30%"),
            RiskFactor(name="Rod Stress Ratio", contribution=0.30, value=f"{srp_mech['rod_stress_ratio']*100:.1f}%", threshold="<= 85%"),
            RiskFactor(name="Peak Rod Load (PPRL)", contribution=0.20, value=f"{srp_mech['pprl_kn']:.1f} kN", threshold="< 110 kN")
        ],
        "pump_unsetting": [
            RiskFactor(name="Downhole Plunger Thrust", contribution=0.55, value=f"{srp_mech['pump_load_kn']:.1f} kN", threshold="< 25 kN"),
            RiskFactor(name="Dynamic Fluid Level", contribution=0.30, value=f"{f_level:.1f} m", threshold="< 850 m"),
            RiskFactor(name="Pumping Frequency", contribution=0.15, value=f"{spm:.1f} SPM", threshold="<= 4.5 SPM")
        ]
    }

    return DigitalTwinState(
        well_id=well.well_id,
        well_name=well.name,
        status=well.status,
        scenario_type=well.scenario_type,
        timestamp=datetime.utcnow(),
        reservoir=ReservoirState(
            temperature=round(res_temp, 1),
            pressure=round(res_pressure, 1),
            viscosity=round(res_viscosity, 1),
            mobility=round(mobility, 3),
            heating_state=round(min(res_temp / 200.0, 1.0), 2),
            cooling_rate=round(0.022 * 100, 2),
            permeability_md=permeability,
            steam_chamber_radius_m=14.5
        ),
        wellbore=WellboreState(
            temperature=round(wb_temp, 1),
            pressure=round(pwf, 2),
            fluid_level=round(f_level, 1),
            pump_intake_pressure=round(ppip, 2),
            viscosity=round(wb_visc, 1),
            flow_rate=final_fluid_rate,
            gas_oil_ratio=12.0
        ),
        srp=SRPState(
            stroke_length=stroke,
            spm=spm,
            vfd_frequency=vfd,
            pprl=srp_mech["pprl_kn"],
            mprl=srp_mech["mprl_kn"],
            load_span=srp_mech.get("load_span_kn", round(srp_mech["pprl_kn"] - srp_mech["mprl_kn"], 1)),
            scaled_load_ratio=srp_mech.get("scaled_load_ratio", 0.55),
            pump_load=srp_mech["pump_load_kn"],
            rod_load=srp_mech["rod_load_kn"],
            rod_stress_ratio=srp_mech["rod_stress_ratio"],
            pump_efficiency=srp_mech["pump_efficiency"],
            prhp_kw=srp_mech.get("prhp_kw", 0.0),
            prhp_hp=srp_mech.get("prhp_hp", 0.0),
            dynamic_viscous_drag=srp_mech["dynamic_viscous_drag_kn"],
            buoyant_rod_weight=srp_mech["buoyant_rod_weight_kn"]
        ),
        production=ProductionState(
            oil_rate=final_oil_rate,
            water_rate=final_water_rate,
            fluid_rate=final_fluid_rate,
            sor=sor_val,
            recovery=est_recovery_bbl,
            energy_consumption=srp_mech["energy_consumption"],
            water_cut_pct=round(water_cut * 100, 1)
        ),
        risks=RiskState(
            rod_floating=float_risk_info["probability"],
            rod_floating_level=float_risk_info["level"],
            rod_failure=fail_risk_info["probability"],
            rod_failure_level=fail_risk_info["level"],
            pump_unsetting=unset_risk_info["probability"],
            pump_unsetting_level=unset_risk_info["level"],
            impact_loading=round(max(0.0, (1.0 - (srp_mech["mprl_kn"] / 15.0))), 2),
            contributing_factors=contributing_factors
        ),
        current_css_cycle=4,
        days_on_production=prod_days,
        cumulative_steam_injected_m3=320.0
    )
