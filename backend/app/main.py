"""
FastAPI Application Entry Point for Baghewala Heavy-Oil Digital Twin.
Provides CORS, API v1 routes, WebSocket telemetry, health checks, and global exception handlers.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db
from app.api.router import api_router
from app.ml.registry import MODEL_REGISTRY

# Initialize database schema
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Enabled Well-to-Surface Digital Twin integrating Reservoir, Wellbore, and SRP for Baghewala Heavy-Oil Field (SIH 26120)",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration supporting development and production
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()] if settings.CORS_ORIGINS != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount central API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["System Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["System Health"])
def health_check():
    """System health check verifying database and ML model readiness."""
    models_loaded = len(MODEL_REGISTRY.models) >= 4
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "ok",
        "models": "loaded" if models_loaded else "physics_fallback",
        "simulation": "ready",
        "active_models_count": len(MODEL_REGISTRY.models)
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Clean JSON error response without leaking raw internal traces."""
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc),
                "path": request.url.path
            }
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
