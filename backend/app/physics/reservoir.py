"""
Reservoir Physics Engine for Baghewala Heavy-Oil Field.
Models thermal steam injection, reservoir heat decay, temperature-viscosity coupling (Andrade equation),
crude mobility, and heavy-oil inflow performance (IPR).
"""

import numpy as np
from typing import Dict, Any, List, Tuple
from app.core.config import settings

# Andrade equation constants calibrated for Baghewala heavy crude (~17.5 API)
# ln(mu) = A + B / (T_c + 273.15)
ANDRADE_A = -10.42
ANDRADE_B = 6050.0

def calculate_oil_viscosity(temp_c: float) -> float:
    """
    Calculate dynamic viscosity of Baghewala heavy crude at given temperature (°C).
    At 38°C (virgin reservoir) -> ~8,800 cP
    At 65°C -> ~650 cP
    At 100°C -> ~125 cP
    At 180°C -> ~28 cP
    """
    temp_k = max(temp_c, 5.0) + 273.15
    ln_mu = ANDRADE_A + (ANDRADE_B / temp_k)
    viscosity = float(np.exp(ln_mu))
    return max(viscosity, 5.0)  # physical lower bound

def calculate_steam_heating(
    steam_volume_m3: float,
    injection_pressure_bar: float,
    soak_time_hr: float,
    initial_temp_c: float = 38.0
) -> Tuple[float, float, float]:
    """
    Calculate thermal response from CSS steam injection and soak phase.
    Returns:
        peak_temp_c: Maximum temperature reached around wellbore
        heated_radius_m: Estimated thermal chamber radius
        heating_state: Normalized saturation index [0.0 - 1.0]
    """
    # Enthalpy of saturated steam at injection pressure
    # Approximated: h_steam ≈ 2700 kJ/kg at 18-25 bar
    steam_mass_kg = steam_volume_m3 * 1000.0
    latent_heat_mj = steam_mass_kg * 2.75 / 1000.0  # MJ

    # Volumetric heat capacity of sandstone saturated with heavy oil (approx 2.4 MJ/m³·K)
    heat_capacity_rock_fluid = 2.4  # MJ/(m³·°C)
    net_thickness_m = 18.5  # formation net pay

    # Overburden/underburden thermal loss during injection (typically 20-35%)
    thermal_efficiency = 0.72 - (0.001 * soak_time_hr)
    thermal_efficiency = max(min(thermal_efficiency, 0.85), 0.45)
    effective_heat_mj = latent_heat_mj * thermal_efficiency

    # Heated volume and radius
    delta_t_target = min(220.0 - initial_temp_c, 160.0)
    heated_volume_m3 = effective_heat_mj / (heat_capacity_rock_fluid * delta_t_target)
    heated_radius_m = float(np.sqrt(max(heated_volume_m3 / (np.pi * net_thickness_m), 1.0)))

    # Soak diffusion: during soak, heat diffuses outward, slightly cooling the wellbore peak
    soak_diffusion_factor = np.exp(-0.0006 * soak_time_hr)
    peak_temp_c = initial_temp_c + (delta_t_target * soak_diffusion_factor * (steam_volume_m3 / 100.0)**0.4)
    peak_temp_c = float(min(peak_temp_c, 215.0))

    heating_state = float(min(peak_temp_c / 200.0, 1.0))
    return peak_temp_c, heated_radius_m, heating_state

def calculate_temperature_decay_curve(
    peak_temp_c: float,
    base_temp_c: float,
    days_produced: float,
    fluid_rate_bfpd: float,
    total_days: int = 60
) -> List[Dict[str, float]]:
    """
    Generate the thermal cooling curve across CSS production phase.
    Convective heat extraction with produced fluid + conductive loss to surrounding formation.
    """
    curve = []
    # Cooling coefficient lambda (day^-1)
    base_lambda = 0.018 + (fluid_rate_bfpd * 0.00012)
    
    for day in range(total_days + 1):
        t = float(day)
        temp_t = base_temp_c + (peak_temp_c - base_temp_c) * np.exp(-base_lambda * t)
        visc_t = calculate_oil_viscosity(temp_t)
        curve.append({
            "day": day,
            "temperature": round(float(temp_t), 1),
            "viscosity": round(float(visc_t), 1)
        })
    return curve

def calculate_inflow_production(
    reservoir_pressure_bar: float,
    flowing_bottomhole_pressure_bar: float,
    temp_c: float,
    permeability_md: float = 450.0,
    net_pay_m: float = 18.5,
    drainage_radius_m: float = 200.0,
    wellbore_radius_m: float = 0.108
) -> Tuple[float, float, float]:
    """
    Calculate heavy oil well inflow deliverability using Darcy/Vogel heavy oil mobility coupling.
    Returns:
        oil_rate_bopd: Inflow oil rate
        water_rate_bwpd: Water rate (assuming base 25% water cut + condensed steam)
        mobility: Relative oil mobility (k / mu)
    """
    viscosity = calculate_oil_viscosity(temp_c)
    mobility = float(permeability_md / viscosity)  # mD/cP

    # Drawdown (Pres - Pwf)
    drawdown_bar = max(reservoir_pressure_bar - flowing_bottomhole_pressure_bar, 1.0)
    
    # Semi-steady state productivity index J (BOPD/bar)
    # J = (0.00708 * k * h) / (mu * (ln(re/rw) - 0.75 + s))
    ln_re_rw = np.log(drainage_radius_m / wellbore_radius_m) - 0.75
    j_oil = (0.00708 * permeability_md * net_pay_m * 6.2898) / (viscosity * ln_re_rw)
    
    potential_oil_rate = j_oil * drawdown_bar
    oil_rate_bopd = float(np.clip(potential_oil_rate, 5.0, 350.0))
    
    # Water production (condensed steam water cut)
    water_cut_pct = min(0.20 + (0.15 * np.exp(-0.02 * temp_c)), 0.60)
    water_rate_bwpd = float(oil_rate_bopd * (water_cut_pct / (1.0 - water_cut_pct)))
    
    return oil_rate_bopd, water_rate_bwpd, mobility
