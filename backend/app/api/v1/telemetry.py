"""
Real-Time Telemetry and WebSocket Streaming Router.
Streams live continuous sensor ticks with responsive dynacard points
and handles operational anomaly injection.
"""

import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.models.db_models import Well
from app.schemas.api_schemas import AnomalyRequest
from app.services.telemetry_generator import (
    generate_telemetry_tick, inject_anomaly_into_well, clear_anomalies
)

router = APIRouter(prefix="/telemetry", tags=["Real-Time Telemetry & WebSocket"])

@router.post("/{well_id}/inject-anomaly")
def inject_anomaly(well_id: str, req: AnomalyRequest):
    """Inject a simulated disturbance / operational anomaly into the live sensor stream."""
    return inject_anomaly_into_well(well_id, req.anomaly_type)

@router.post("/{well_id}/clear-anomaly")
def clear_anomaly(well_id: str):
    """Clear active disturbances, returning the live stream to nominal conditions."""
    return clear_anomalies(well_id)

@router.websocket("/ws/{well_id}")
async def websocket_telemetry_endpoint(websocket: WebSocket, well_id: str):
    """
    WebSocket endpoint streaming live sensor readings and dynacard packets every 1.5 seconds.
    """
    await websocket.accept()
    db = SessionLocal()
    try:
        well = db.query(Well).filter(Well.well_id == well_id).first()
        if not well:
            await websocket.send_json({"error": f"Well {well_id} not found."})
            await websocket.close()
            return

        while True:
            # Refresh well state from DB
            db.refresh(well)
            tick = generate_telemetry_tick(well)
            await websocket.send_json(tick)
            await asyncio.sleep(1.5)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass
    finally:
        db.close()
