"""
Operational Alert Center Endpoints.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db_models import AlertRecord

router = APIRouter(prefix="/alerts", tags=["Alert Center"])

@router.get("", response_model=List[Dict[str, Any]])
def list_alerts(db: Session = Depends(get_db)):
    """
    Retrieve all operational alerts sorted by severity (CRITICAL > HIGH > MEDIUM > LOW) and timestamp.
    """
    alerts = db.query(AlertRecord).order_by(AlertRecord.timestamp.desc()).all()
    
    # Custom severity ranking
    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    sorted_alerts = sorted(alerts, key=lambda a: (severity_order.get(a.severity, 4), -a.timestamp.timestamp()))

    return [{
        "id": a.id,
        "alert_id": a.alert_id,
        "well_id": a.well_id,
        "timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "severity": a.severity,
        "parameter": a.parameter,
        "value": a.value,
        "threshold": a.threshold,
        "unit": a.unit,
        "title": a.title,
        "message": a.message,
        "recommended_action": a.recommended_action,
        "is_acknowledged": a.is_acknowledged
    } for a in sorted_alerts]

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db)):
    """Mark an operational alert as acknowledged."""
    alert = db.query(AlertRecord).filter(AlertRecord.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found.")
    alert.is_acknowledged = True
    db.commit()
    return {"status": "ACKNOWLEDGED", "alert_id": alert_id}
