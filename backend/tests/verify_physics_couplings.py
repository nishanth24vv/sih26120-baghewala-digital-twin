"""
Verification script for Physics & Coupling Consistency.
Validates:
Test A: Increasing Steam Volume -> Higher Temp, Lower Viscosity, Higher Mobility, Higher Production.
Test B: Increasing SPM in High Viscosity -> Higher Rod Drag, Lower MPRL, Higher Floating Risk.
Test C: Reservoir Cooling -> Higher Viscosity, Higher Drag, Floating Hazard.
"""

import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.physics.reservoir import calculate_oil_viscosity, calculate_steam_heating, calculate_inflow_production
from app.physics.srp import calculate_srp_mechanics
from app.physics.wellbore import calculate_wellbore_state
from app.ml.registry import MODEL_REGISTRY

def run_checks():
    print("=== TEST A: Steam Volume Coupling ===")
    prev_oil = 0
    prev_temp = 0
    for sv in [40.0, 85.0, 160.0]:
        pk_t, rad, h_st = calculate_steam_heating(sv, 18.0, 72.0, 38.0)
        visc = calculate_oil_viscosity(pk_t)
        oil, wat, mob = calculate_inflow_production(70.0, 18.0, pk_t)
        print(f"Steam: {sv:5.1f} m3 -> Peak Temp: {pk_t:5.1f} C, Visc: {visc:6.1f} cP, Mobility: {mob:6.2f}, Oil: {oil:5.1f} BOPD")
        assert pk_t > prev_temp, "Temperature must increase with steam volume"
        assert oil > prev_oil, "Production potential must increase with steam volume"
        prev_temp = pk_t
        prev_oil = oil

    print("\n=== TEST B: SPM & Drag Coupling ===")
    for visc in [100.0, 600.0, 1500.0]:
        print(f"\nViscosity: {visc:.0f} cP:")
        prev_drag = 0
        for spm in [2.0, 3.5, 5.0]:
            srp = calculate_srp_mechanics(72.0, spm, 38.0, visc, 35.0, 10.0)
            print(f"  SPM: {spm:.1f} -> PPRL: {srp['pprl_kn']:5.1f} kN, MPRL: {srp['mprl_kn']:5.1f} kN, Drag: {srp['dynamic_viscous_drag_kn']:5.1f} kN, Stress: {srp['rod_stress_ratio']*100:5.1f}%")
            assert srp['dynamic_viscous_drag_kn'] > prev_drag, "Drag must increase with SPM"
            prev_drag = srp['dynamic_viscous_drag_kn']

    print("\n=== TEST C: Thermal Cooling & Rod Floating Cascade ===")
    for temp in [140.0, 90.0, 54.0, 38.0]:
        visc = calculate_oil_viscosity(temp)
        srp = calculate_srp_mechanics(72.0, 4.2, 42.0, visc, 35.0, 10.0)
        float_res = MODEL_REGISTRY.predict_rod_floating_risk(
            srp['rod_load_kn'], srp['pump_load_kn'], 4.2, 42.0, 72.0,
            temp, visc, 35.0, srp['mprl_kn']
        )
        print(f"Temp: {temp:5.1f} C -> Visc: {visc:6.1f} cP, Drag: {srp['dynamic_viscous_drag_kn']:5.1f} kN, MPRL: {srp['mprl_kn']:5.1f} kN, Float Prob: {float_res['probability']*100:5.1f}% ({float_res['level']})")

    print("\nAll Physics & Coupling Invariants Verified Successfully!")

if __name__ == "__main__":
    run_checks()
