"""
Joint Optimization API Endpoint.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.db_models import Well, OptimizationRun
from app.schemas.api_schemas import OptimizeRequest, OptimizeResponse
from app.optimization.joint_optimizer import run_joint_optimization

router = APIRouter(prefix="/optimize", tags=["Joint AI Optimizer"])

@router.post("", response_model=OptimizeResponse)
def execute_joint_optimization(req: OptimizeRequest, db: Session = Depends(get_db)):
    """
    Perform multi-objective constrained search over CSS and SRP parameters,
    enforce hard safety boundaries, calculate improvements %, and generate dynamic AI reasoning.
    """
    well = db.query(Well).filter(Well.well_id == req.well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail=f"Well {req.well_id} not found.")

    weights_dict = req.objective_weights.model_dump() if req.objective_weights else None
    
    # Run optimizer
    result = run_joint_optimization(
        well=well,
        objective_weights=weights_dict,
        grid_density=req.grid_density or "NORMAL"
    )

    # Persist optimization run for traceability
    opt_run = OptimizationRun(
        optimization_id=result["optimization_id"],
        well_id=well.well_id,
        timestamp=datetime.utcnow(),
        current_parameters=result["current"],
        recommended_parameters=result["recommended"],
        predicted_metrics=result["predicted"],
        improvements=result["improvements"],
        candidates_evaluated=result["candidates_evaluated"],
        valid_candidates=result["valid_candidates"],
        rejected_by_constraints=result["rejected_by_constraints"],
        objective_score=result["score"],
        objective_weights=result["objective_weights"],
        explanation=[item for item in result["explanations"]],
        status="GENERATED"
    )
    db.add(opt_run)
    db.commit()

    return OptimizeResponse(**result)
