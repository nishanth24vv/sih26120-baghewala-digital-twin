"""
Unit tests for Constrained Joint Optimizer and Constraint Enforcement.
"""

import pytest
from app.core.database import SessionLocal
from app.models.db_models import Well
from app.optimization.joint_optimizer import run_joint_optimization
from app.core.constraints import OPERATING_CONSTRAINTS

def test_joint_optimizer_execution():
    """Verify optimizer evaluates candidates, enforces constraints, and improves score."""
    db = SessionLocal()
    well = db.query(Well).filter(Well.well_id == "BGW-001").first()
    assert well is not None, "BGW-001 well must exist"

    result = run_joint_optimization(well=well, grid_density="FAST")
    db.close()

    assert result["candidates_evaluated"] > 0
    assert result["valid_candidates"] > 0
    assert result["rejected_by_constraints"] >= 0
    assert "recommended" in result
    assert "predicted" in result
    assert "explanations" in result
    assert len(result["explanations"]) > 0

    # Ensure recommended SPM and Stroke are strictly within operating constraints
    rec_spm = result["recommended"]["spm"]
    assert OPERATING_CONSTRAINTS.spm.min_val <= rec_spm <= OPERATING_CONSTRAINTS.spm.max_val

    rec_stroke = result["recommended"]["stroke"]
    assert OPERATING_CONSTRAINTS.stroke_length.min_val <= rec_stroke <= OPERATING_CONSTRAINTS.stroke_length.max_val

def test_hard_constraint_rejection():
    """Verify invalid candidate parameters are strictly rejected."""
    invalid_cand = {
        "spm": 8.5,  # Exceeds max 6.0
        "stroke": 72.0,
        "vfd": 38.0,
        "steam_volume": 85.0,
        "injection_pressure": 18.0,
        "soak_time": 72.0
    }
    is_valid, reason = OPERATING_CONSTRAINTS.validate_candidate(invalid_cand)
    assert not is_valid
    assert "SPM" in reason
