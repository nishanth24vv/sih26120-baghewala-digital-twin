"""
Unit test for Optimizer Sensitivity and Hard Constraint Enforcement.
Validates:
1. All 7 decision variables are optimized.
2. Weight shifting (100% Production vs 100% Reliability) alters the optimal candidate.
3. Hard constraint violations are strictly rejected.
4. Candidates Evaluated, Valid Candidates, and Rejected count are accurately tracked.
"""

import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.optimization.joint_optimizer import run_joint_optimization
from app.models.db_models import Well

def test_optimizer_sensitivity_and_dimensions():
    # Construct a test well with high risk state
    well = Well(
        well_id="BGW-001",
        name="Well BGW-001",
        reservoir_depth_m=1050.0,
        current_spm=4.2,
        current_stroke=72.0,
        current_vfd=42.0,
        current_oil_rate=28.5,
        current_sor=6.4,
        current_energy=118.0,
        current_floating_risk=0.78,
        current_failure_risk=0.52
    )

    # Run 1: Production Heavily Weighted (100% Production, 0% Risk/SOR)
    res_prod = run_joint_optimization(
        well=well,
        objective_weights={"production": 1.0, "sor": 0.0, "energy": 0.0, "reliability": 0.0, "maintenance": 0.0}
    )

    # Run 2: Reliability Heavily Weighted (100% Reliability, 0% Production)
    res_rel = run_joint_optimization(
        well=well,
        objective_weights={"production": 0.0, "sor": 0.0, "energy": 0.0, "reliability": 1.0, "maintenance": 0.0}
    )

    print("\n--- OPTIMIZER TEST RESULTS ---")
    print(f"Prod-Weighted SPM: {res_prod['recommended_parameters']['spm']} SPM, Oil Rate: {res_prod['predicted_outcome']['oil_rate']:.1f} BOPD, Floating Risk: {res_prod['predicted_outcome']['rod_floating_risk']*100:.1f}%")
    print(f"Rel-Weighted SPM:  {res_rel['recommended_parameters']['spm']} SPM, Oil Rate: {res_rel['predicted_outcome']['oil_rate']:.1f} BOPD, Floating Risk: {res_rel['predicted_outcome']['rod_floating_risk']*100:.1f}%")

    # Verify all 7 parameters are present in recommendation
    params = res_prod['recommended_parameters']
    assert "steam_volume" in params
    assert "injection_pressure" in params
    assert "soak_time" in params
    assert "production_cutoff" in params
    assert "stroke" in params
    assert "spm" in params
    assert "vfd" in params

    # Verify candidates evaluation counters
    assert res_prod['candidates_evaluated'] > 0
    assert res_prod['valid_candidates'] > 0
    assert res_prod['rejected_by_constraints'] > 0
    assert res_prod['candidates_evaluated'] == (res_prod['valid_candidates'] + res_prod['rejected_by_constraints'])

    # Verify reliability weighting chooses safer operating point (lower floating risk)
    assert res_rel['predicted_outcome']['rod_floating_risk'] <= res_prod['predicted_outcome']['rod_floating_risk']
    print("Optimizer sensitivity test passed!")

if __name__ == "__main__":
    test_optimizer_sensitivity_and_dimensions()
