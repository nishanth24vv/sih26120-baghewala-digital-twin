import pytest
import numpy as np
from app.physics.reservoir import calculate_oil_viscosity, calculate_steam_heating, calculate_inflow_production
from app.physics.srp import calculate_srp_mechanics
from app.physics.dynacard import generate_dynacard_points, calculate_polygon_area
from app.ml.registry import MODEL_REGISTRY
from tests.golden.golden_scenarios import GOLDEN_SCENARIOS

def test_golden_normal_well():
    sc = GOLDEN_SCENARIOS['NORMAL_WELL']
    inp = sc['inputs']
    exp = sc['expected']
    
    visc = calculate_oil_viscosity(inp['temp_c'])
    assert exp['min_visc'] <= visc <= exp['max_visc']
    
    srp = calculate_srp_mechanics(
        stroke_length_in=inp['stroke_in'],
        spm=inp['spm'],
        vfd_frequency_hz=inp['vfd_hz'],
        wellbore_viscosity_cp=visc,
        oil_rate_bopd=30.0,
        water_rate_bwpd=10.0
    )
    assert exp['min_pprl'] <= srp['pprl_kn'] <= exp['max_pprl']
    assert srp['mprl_kn'] > 10.0
    
    float_res = MODEL_REGISTRY.predict_rod_floating_risk(
        rod_load=srp['rod_load_kn'],
        pump_load=srp['pump_load_kn'],
        spm=inp['spm'],
        vfd=inp['vfd_hz'],
        stroke=inp['stroke_in'],
        temperature=inp['temp_c'],
        viscosity=visc,
        oil_rate=30.0,
        mprl=srp['mprl_kn']
    )
    assert float_res['probability'] <= exp['max_float_risk']

def test_golden_high_viscosity_and_floating():
    sc = GOLDEN_SCENARIOS['HIGH_VISCOSITY_WELL']
    inp = sc['inputs']
    exp = sc['expected']
    
    visc = calculate_oil_viscosity(inp['temp_c'])
    assert exp['min_visc'] <= visc <= exp['max_visc']
    
    srp = calculate_srp_mechanics(
        stroke_length_in=inp['stroke_in'],
        spm=inp['spm'],
        vfd_frequency_hz=inp['vfd_hz'],
        wellbore_viscosity_cp=visc,
        oil_rate_bopd=15.0,
        water_rate_bwpd=8.0
    )
    assert srp['dynamic_viscous_drag_kn'] >= exp['min_drag']
    
    float_res = MODEL_REGISTRY.predict_rod_floating_risk(
        rod_load=srp['rod_load_kn'],
        pump_load=srp['pump_load_kn'],
        spm=inp['spm'],
        vfd=inp['vfd_hz'],
        stroke=inp['stroke_in'],
        temperature=inp['temp_c'],
        viscosity=visc,
        oil_rate=15.0,
        mprl=srp['mprl_kn']
    )
    assert float_res['probability'] >= exp['min_float_risk']

def test_dynacard_polygon_area_and_power():
    card = generate_dynacard_points(
        stroke_length_in=72.0,
        spm=3.7,
        pprl_kn=52.0,
        mprl_kn=14.0,
        pump_load_kn=18.0,
        pump_efficiency_pct=82.0,
        viscous_drag_kn=6.5
    )
    
    assert card['card_area_kj'] > 0.5
    assert card['card_area_in_lbs'] > 10000.0
    assert card['prhp_kw'] > 0.05
    assert card['prhp_hp'] > 0.05
    assert card['card_type'] == 'NORMAL FULL PUMP'
    assert len(card['surface_card']) == 60
    assert len(card['downhole_card']) == 60

def test_scaled_load_ratio_sensitivity():
    srp_norm = calculate_srp_mechanics(
        stroke_length_in=72.0, spm=3.5, vfd_frequency_hz=36.0,
        wellbore_viscosity_cp=600.0, oil_rate_bopd=30.0, water_rate_bwpd=10.0
    )
    
    srp_heavy = calculate_srp_mechanics(
        stroke_length_in=100.0, spm=4.8, vfd_frequency_hz=48.0,
        wellbore_viscosity_cp=6500.0, oil_rate_bopd=10.0, water_rate_bwpd=5.0
    )
    
    assert 0.35 <= srp_norm['scaled_load_ratio'] <= 0.85
    assert srp_heavy['scaled_load_ratio'] > srp_norm['scaled_load_ratio']

def test_harmonic_kinematics_ustar_reference():
    srp_slow = calculate_srp_mechanics(72.0, 2.0, 20.0, 1000.0, 20.0, 5.0)
    srp_fast = calculate_srp_mechanics(72.0, 4.0, 40.0, 1000.0, 20.0, 5.0)
    
    assert np.isclose(srp_fast['peak_velocity_m_s'], 2.0 * srp_slow['peak_velocity_m_s'], rtol=1e-2)
    assert np.isclose(srp_fast['peak_acceleration_m_s2'], 4.0 * srp_slow['peak_acceleration_m_s2'], rtol=1e-2)
