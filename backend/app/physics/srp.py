"""
Sucker Rod Pumping (SRP) Mechanics and Heavy-Oil Kinematics Engine.
Calculates dynamic viscous drag forces, Peak & Minimum Polished Rod Loads (PPRL/MPRL),
Load Span, Scaled Load Ratio (SLR), Rod Floating Hazard, Rod Stress Ratio, and Volumetric Efficiency.

Reference Attributions:
- Harmonic kinematic modeling and fluid-height state relationships inspired by
  BYU-PRISM USTAR-Artificial-Lift (https://github.com/BYU-PRISM/USTAR-Artificial-Lift).
- Load span and API RP 11L correlations inspired by digitalmodel (https://github.com/vamseeachanta/digitalmodel).
- Scaled Load Ratio (SLR = Load_Span / W_rf) diagnostic inspired by published SPE / SRP Failure Research.
Note: All implementations herein are independent, physics-grounded reduced-order models tailored for Baghewala heavy crude.
"""

import numpy as np
from typing import Dict, Any, Tuple
from app.physics.reservoir import calculate_oil_viscosity

def calculate_srp_mechanics(
    stroke_length_in: float,
    spm: float,
    vfd_frequency_hz: float,
    wellbore_viscosity_cp: float,
    oil_rate_bopd: float,
    water_rate_bwpd: float,
    pump_depth_m: float = 1000.0,
    pump_bore_in: float = 2.25,
    rod_diameter_in: float = 1.0,
    tubing_id_in: float = 2.992,
    fluid_level_m: float = 750.0
) -> Dict[str, float]:
    """
    Calculate comprehensive SRP mechanical, kinematic, and dynamic loading state.
    """
    # Unit conversions
    stroke_m = stroke_length_in * 0.0254
    rod_radius_m = (rod_diameter_in * 0.0254) / 2.0
    tubing_radius_m = (tubing_id_in * 0.0254) / 2.0
    annular_gap_m = max(tubing_radius_m - rod_radius_m, 0.005)
    viscosity_pa_s = wellbore_viscosity_cp * 0.001  # 1 cP = 10^-3 Pa·s

    # Kinematics: Harmonic Angular Frequency & Velocities (USTAR / API RP 11L)
    # omega = 2 * pi * SPM / 60 (rad/s)
    omega_rad_s = (2.0 * np.pi * spm) / 60.0
    v_peak_m_s = np.pi * stroke_m * (spm / 60.0)
    v_avg_m_s = 2.0 * stroke_m * (spm / 60.0)
    a_peak_m_s2 = (stroke_m / 2.0) * (omega_rad_s ** 2)

    # Steel rod string mass (Grade D rod ~ 4.33 kg/m for 1.0 in rod)
    rod_linear_mass_kg_m = 4.33
    total_rod_mass_kg = rod_linear_mass_kg_m * pump_depth_m
    steel_density_kg_m3 = 7850.0
    fluid_density_kg_m3 = 960.0  # heavy crude emulsion
    
    # Buoyancy factor & Rod Weight (API RP 11L)
    buoyancy_factor = 1.0 - (fluid_density_kg_m3 / steel_density_kg_m3)
    w_rod_in_air_kn = (total_rod_mass_kg * 9.81) / 1000.0
    w_rod_buoyant_kn = w_rod_in_air_kn * buoyancy_factor

    # Hydrostatic fluid load on plunger on upstroke (Fo = A_plunger * rho_f * g * H_net)
    # Submerged fluid column height above pump
    submerged_head_m = max(pump_depth_m - fluid_level_m, 100.0)
    plunger_area_m2 = np.pi * ((pump_bore_in * 0.0254) / 2.0)**2
    fluid_load_kn = (plunger_area_m2 * fluid_density_kg_m3 * 9.81 * submerged_head_m) / 1000.0

    # Acceleration factor (Mills equation: alpha = S * SPM^2 / 70500 with S in inches)
    accel_factor = (stroke_length_in * (spm**2)) / 70500.0

    # Viscous shear drag force along rod string (Couette laminar shear + sucker rod coupling form drag in heavy crude)
    # F_drag = (2 * pi * r_rod * L * mu * (v_rod / gap)) * coupling_factor
    # Sucker rod string has couplings every 7.62m (25ft) and centralizers which amplify viscous drag in heavy oil (~12.5x)
    coupling_drag_factor = 12.5
    viscous_drag_peak_kn = (
        (2.0 * np.pi * rod_radius_m * pump_depth_m * viscosity_pa_s * (v_peak_m_s / annular_gap_m)) * coupling_drag_factor
    ) / 1000.0
    viscous_drag_avg_kn = (
        (2.0 * np.pi * rod_radius_m * pump_depth_m * viscosity_pa_s * (v_avg_m_s / annular_gap_m)) * coupling_drag_factor
    ) / 1000.0

    # Polished Rod Loads (API RP 11L Structural Formulation)
    # Upstroke Peak: Buoyant Rods + Acceleration + Fluid Load + Upward Drag
    pprl_kn = (w_rod_buoyant_kn * (1.0 + accel_factor)) + fluid_load_kn + (0.35 * viscous_drag_peak_kn)
    
    # Downstroke Minimum: Buoyant Rods * (1 - alpha) - Downward Drag
    # Note: Downward drag opposes gravity, reducing the tension at surface!
    mprl_kn = (w_rod_buoyant_kn * (1.0 - accel_factor)) - viscous_drag_peak_kn

    # Load Span & Scaled Load Ratio (SLR) (SPE Research & digitalmodel standard)
    # SLR = (PPRL - MPRL) / W_rf
    load_span_kn = max(pprl_kn - mprl_kn, 0.1)
    scaled_load_ratio = float(load_span_kn / max(w_rod_buoyant_kn, 1.0))
    
    # Downstroke Floating Margin (Margin > 0 is safe; Margin <= 0 indicates rod floating)
    floating_margin_kn = float((w_rod_buoyant_kn * (1.0 - accel_factor)) - viscous_drag_peak_kn)

    # Rod Stress Analysis (API Grade D Yield = 585 MPa, Allowable Fatigue = 0.85 * Yield)
    rod_area_m2 = np.pi * rod_radius_m**2
    peak_stress_mpa = (pprl_kn * 1000.0) / (rod_area_m2 * 1e6)
    allowable_stress_mpa = 585.0 * 0.85  # 497 MPa
    rod_stress_ratio = float(min(peak_stress_mpa / allowable_stress_mpa, 1.25))

    # Theoretical pump displacement (bpd)
    # Displacement = 0.1166 * D_p^2 * S * SPM
    theoretical_disp_bpd = 0.1166 * (pump_bore_in**2) * stroke_length_in * spm
    actual_fluid_bfpd = max(oil_rate_bopd + water_rate_bwpd, 1.0)
    pump_efficiency_pct = float(np.clip((actual_fluid_bfpd / max(theoretical_disp_bpd, 1.0)) * 100.0, 35.0, 95.0))

    # Polished Rod Power and Specific Lifting Energy
    # Card Work per stroke approx = Load_Span * Stroke_m * 0.78 (form factor)
    stroke_work_kj = load_span_kn * stroke_m * 0.78
    prhp_kw = (stroke_work_kj * (spm / 60.0))
    prhp_hp = prhp_kw * 1.34102  # kW to HP
    power_kw = prhp_kw * 1.45  # includes motor & gearbox transmission losses
    energy_kwh_per_bbl = float(np.clip((power_kw * 24.0) / max(oil_rate_bopd, 5.0), 45.0, 180.0))

    return {
        "pprl_kn": round(float(pprl_kn), 1),
        "mprl_kn": round(float(mprl_kn), 1),
        "load_span_kn": round(float(load_span_kn), 1),
        "scaled_load_ratio": round(float(scaled_load_ratio), 3),
        "floating_margin_kn": round(float(floating_margin_kn), 1),
        "rod_load_kn": round(float(0.5 * (pprl_kn + max(mprl_kn, 0.0))), 1),
        "pump_load_kn": round(float(fluid_load_kn), 1),
        "dynamic_viscous_drag_kn": round(float(viscous_drag_peak_kn), 1),
        "buoyant_rod_weight_kn": round(float(w_rod_buoyant_kn), 1),
        "rod_stress_ratio": round(float(rod_stress_ratio), 3),
        "pump_efficiency": round(float(pump_efficiency_pct), 1),
        "prhp_kw": round(float(prhp_kw), 2),
        "prhp_hp": round(float(prhp_hp), 2),
        "peak_velocity_m_s": round(float(v_peak_m_s), 3),
        "peak_acceleration_m_s2": round(float(a_peak_m_s2), 3),
        "energy_consumption": round(float(energy_kwh_per_bbl), 1),
        "energy_kwh_per_bbl": round(float(energy_kwh_per_bbl), 1)
    }
