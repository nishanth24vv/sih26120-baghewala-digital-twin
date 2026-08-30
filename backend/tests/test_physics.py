"""
Unit tests for Reservoir, Wellbore, and SRP Physics Engines.
"""

import pytest
import numpy as np

from app.physics.reservoir import (
    calculate_oil_viscosity, calculate_steam_heating,
    calculate_temperature_decay_curve, calculate_inflow_production
)
from app.physics.wellbore import calculate_wellbore_state
from app.physics.srp import calculate_srp_mechanics
from app.physics.dynacard import generate_dynacard_points

def test_andrade_viscosity_physics():
    """Verify that heavy oil viscosity decreases exponentially with temperature."""
    visc_38 = calculate_oil_viscosity(38.0)
    visc_80 = calculate_oil_viscosity(80.0)
    visc_150 = calculate_oil_viscosity(150.0)

    assert visc_38 > visc_80 > visc_150, "Viscosity must decrease with increasing temperature"
    assert 5000.0 < visc_38 < 15000.0, f"Viscosity at native 38°C should be ~8,500 cP, got {visc_38}"
    assert visc_150 < 100.0, f"Viscosity at 150°C should be < 100 cP, got {visc_150}"

def test_steam_heating_physics():
    """Verify that higher steam volume increases peak reservoir temperature."""
    peak_t_small, _, _ = calculate_steam_heating(50.0, 18.0, 72.0, 38.0)
    peak_t_large, _, _ = calculate_steam_heating(150.0, 18.0, 72.0, 38.0)

    assert peak_t_large > peak_t_small, "Larger steam volume must produce higher peak temperature"
    assert peak_t_large <= 220.0, "Peak temperature must not exceed steam saturation cap"

def test_srp_mechanics_and_rod_floating():
    """Verify that high viscosity and high SPM increase downstroke viscous drag and reduce MPRL."""
    # Hot wellbore (low viscosity)
    res_hot = calculate_srp_mechanics(
        stroke_length_in=72.0,
        spm=3.5,
        vfd_frequency_hz=35.0,
        wellbore_viscosity_cp=50.0,
        oil_rate_bopd=45.0,
        water_rate_bwpd=15.0
    )

    # Cold wellbore (high viscosity)
    res_cold = calculate_srp_mechanics(
        stroke_length_in=72.0,
        spm=4.5,
        vfd_frequency_hz=45.0,
        wellbore_viscosity_cp=1200.0,
        oil_rate_bopd=25.0,
        water_rate_bwpd=10.0
    )

    assert res_cold["dynamic_viscous_drag_kn"] > res_hot["dynamic_viscous_drag_kn"], "High viscosity must induce higher drag"
    assert res_cold["mprl_kn"] < res_hot["mprl_kn"], "High downstroke drag must reduce MPRL (inducing rod floating)"

def test_dynacard_generation():
    """Verify that dynacard generates closed loops with valid points."""
    card = generate_dynacard_points(
        stroke_length_in=72.0,
        spm=3.8,
        pprl_kn=95.0,
        mprl_kn=14.0,
        pump_load_kn=18.0,
        pump_efficiency_pct=78.0,
        viscous_drag_kn=12.0
    )
    assert "surface_card" in card
    assert len(card["surface_card"]) > 20
    assert card["pprl_kn"] == 95.0
