# Golden Test Fixtures for Baghewala Heavy-Oil Digital Twin
GOLDEN_SCENARIOS = {
    'NORMAL_WELL': {
        'well_id': 'GOLDEN-NORM',
        'inputs': {'temp_c': 75.0, 'pressure_bar': 65.0, 'spm': 3.5, 'stroke_in': 72.0, 'vfd_hz': 36.0},
        'expected': {'min_visc': 700.0, 'max_visc': 1500.0, 'min_pprl': 40.0, 'max_pprl': 65.0, 'max_float_risk': 0.45}
    },
    'HIGH_VISCOSITY_WELL': {
        'well_id': 'GOLDEN-VISC',
        'inputs': {'temp_c': 44.0, 'pressure_bar': 60.0, 'spm': 4.0, 'stroke_in': 72.0, 'vfd_hz': 40.0},
        'expected': {'min_visc': 4500.0, 'max_visc': 8000.0, 'min_drag': 18.0, 'min_float_risk': 0.40}
    },
    'COOLING_RESERVOIR': {
        'well_id': 'GOLDEN-COOL',
        'inputs': {'temp_c': 43.0, 'pressure_bar': 58.0, 'spm': 4.17, 'stroke_in': 72.0, 'vfd_hz': 42.0},
        'expected': {'min_visc': 5500.0, 'max_visc': 7500.0, 'min_float_risk': 0.60}
    },
    'HIGH_SPM_HAZARD': {
        'well_id': 'GOLDEN-FAST',
        'inputs': {'temp_c': 50.0, 'pressure_bar': 62.0, 'spm': 5.8, 'stroke_in': 84.0, 'vfd_hz': 58.0},
        'expected': {'min_drag': 20.0, 'max_mprl': 8.0, 'min_float_risk': 0.65}
    },
    'HIGH_ROD_LOAD': {
        'well_id': 'GOLDEN-STRESS',
        'inputs': {'temp_c': 65.0, 'pressure_bar': 65.0, 'spm': 4.2, 'stroke_in': 120.0, 'vfd_hz': 44.0},
        'expected': {'min_pprl': 60.0, 'max_stress_ratio': 0.85, 'min_slr': 0.50}
    },
    'ROD_FLOATING_INCIDENT': {
        'well_id': 'GOLDEN-FLOAT',
        'inputs': {'temp_c': 38.0, 'pressure_bar': 55.0, 'spm': 4.8, 'stroke_in': 72.0, 'vfd_hz': 48.0},
        'expected': {'min_visc': 8000.0, 'min_drag': 25.0, 'min_float_risk': 0.75}
    },
    'PUMP_UNSETTING_UNDERFILL': {
        'well_id': 'GOLDEN-UNSET',
        'inputs': {'temp_c': 60.0, 'pressure_bar': 45.0, 'spm': 5.0, 'stroke_in': 96.0, 'vfd_hz': 50.0},
        'expected': {'max_eff': 60.0}
    },
    'HIGH_SOR_THERMAL_LOSS': {
        'well_id': 'GOLDEN-SOR',
        'inputs': {'temp_c': 45.0, 'pressure_bar': 50.0, 'spm': 3.0, 'stroke_in': 64.0, 'vfd_hz': 30.0},
        'expected': {'min_energy': 70.0}
    }
}
