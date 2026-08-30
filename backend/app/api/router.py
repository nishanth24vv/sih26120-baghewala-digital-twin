"""
API v1 Central Router Assembly.
"""

from fastapi import APIRouter

from app.api.v1.wells import router as wells_router
from app.api.v1.css import router as css_router
from app.api.v1.srp import router as srp_router
from app.api.v1.optimize import router as optimize_router
from app.api.v1.simulate import router as simulate_router
from app.api.v1.predictions import router as predictions_router
from app.api.v1.risks import router as risks_router
from app.api.v1.approvals import router as approvals_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.models_meta import router as models_meta_router
from app.api.v1.telemetry import router as telemetry_router

api_router = APIRouter()

api_router.include_router(wells_router)
api_router.include_router(css_router)
api_router.include_router(srp_router)
api_router.include_router(optimize_router)
api_router.include_router(simulate_router)
api_router.include_router(predictions_router)
api_router.include_router(risks_router)
api_router.include_router(approvals_router)
api_router.include_router(alerts_router)
api_router.include_router(models_meta_router)
api_router.include_router(telemetry_router)
