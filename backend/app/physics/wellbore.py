"""
Wellbore Hydraulics and Multiphase Flow Engine for Baghewala Field.
Calculates flowing bottom-hole pressure (Pwf), pump intake pressure (Ppip),
dynamic annular fluid level, and wellbore thermal dissipation.
"""

import numpy as np
from typing import Tuple
from app.physics.reservoir import calculate_oil_viscosity

def calculate_wellbore_state(
    reservoir_pressure_bar: float,
    reservoir_temp_c: float,
    oil_rate_bopd: float,
    water_rate_bwpd: float,
    pump_depth_m: float = 1000.0,
    total_depth_m: float = 1050.0,
    casing_id_in: float = 6.276,
    tubing_od_in: float = 3.5,
    crude_api: float = 17.5
) -> Tuple[float, float, float, float, float]:
    """
    Calculate wellbore thermodynamic & hydraulic equilibrium state.
    Returns:
        pwf_bar: Flowing bottom-hole pressure
        ppip_bar: Pump intake pressure
        fluid_level_m: Dynamic fluid level distance from surface (m)
        wellbore_temp_c: Fluid temperature at pump intake
        wellbore_viscosity_cP: Fluid viscosity at pump intake
    """
    # Fluid density calculation (heavy oil SG ~ 0.95, water SG ~ 1.0)
    oil_sg = 141.5 / (crude_api + 131.5)
    water_sg = 1.02
    total_fluid_bfpd = max(oil_rate_bopd + water_rate_bwpd, 1.0)
    water_cut = water_rate_bwpd / total_fluid_bfpd
    mixture_sg = (oil_sg * (1.0 - water_cut)) + (water_sg * water_cut)
    
    # Hydrostatic gradient (bar/m): 1 m head of water = 0.0981 bar
    grad_bar_per_m = mixture_sg * 0.0981
    
    # Bottomhole to pump intake thermal dissipation (approx 0.015 °C/m heat loss to formation)
    temp_loss_c = (total_depth_m - pump_depth_m) * 0.015
    wellbore_temp_c = float(max(reservoir_temp_c - temp_loss_c, 25.0))
    wellbore_viscosity_cP = calculate_oil_viscosity(wellbore_temp_c)

    # Dynamic drawdown & fluid level
    # Pwf is maintained by SRP pump drawdown
    # At nominal pumping, Ppip = 12-25 bar
    ppip_target_bar = max(10.0, 18.0 - (0.05 * oil_rate_bopd))
    pwf_bar = float(ppip_target_bar + ((total_depth_m - pump_depth_m) * grad_bar_per_m))
    
    # Annular fluid column height above pump (m)
    annular_head_m = max((ppip_target_bar - 2.0) / grad_bar_per_m, 0.0)
    fluid_level_m = float(np.clip(pump_depth_m - annular_head_m, 50.0, pump_depth_m + 20.0))
    
    return pwf_bar, ppip_target_bar, fluid_level_m, wellbore_temp_c, wellbore_viscosity_cP
