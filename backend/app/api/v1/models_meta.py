"""
Model Performance and Evaluation Metadata Endpoints.
"""

from fastapi import APIRouter
from app.ml.registry import MODEL_REGISTRY

router = APIRouter(prefix="/models", tags=["Model Performance"])

@router.get("/performance")
def get_models_performance():
    """
    Retrieve real evaluation metrics, feature importances,
    and training metadata computed from the temporal train/test split.
    """
    return MODEL_REGISTRY.metadata
