"""
Integration tests for FastAPI REST endpoints using TestClient.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "ok"

def test_list_wells_endpoint():
    response = client.get("/api/v1/wells")
    assert response.status_code == 200
    wells = response.json()
    assert len(wells) >= 10
    assert any(w["well_id"] == "BGW-001" for w in wells)

def test_get_well_digital_twin_state():
    response = client.get("/api/v1/wells/BGW-001/state")
    assert response.status_code == 200
    state = response.json()
    assert "reservoir" in state
    assert "wellbore" in state
    assert "srp" in state
    assert "production" in state
    assert "risks" in state
    assert state["well_id"] == "BGW-001"

def test_css_predict_endpoint():
    payload = {
        "well_id": "BGW-001",
        "steam_volume": 85.0,
        "injection_pressure": 18.0,
        "soak_time": 72.0,
        "production_cutoff": 30.0
    }
    response = client.post("/api/v1/css/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_oil_rate" in data
    assert "predicted_sor" in data
    assert len(data["temperature_forecast"]) > 0

def test_srp_predict_endpoint():
    payload = {
        "well_id": "BGW-001",
        "stroke_length": 72.0,
        "spm": 3.7,
        "vfd_frequency": 38.0
    }
    response = client.post("/api/v1/srp/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "pprl" in data
    assert "mprl" in data
    assert "floating_probability" in data
    assert "dynacard" in data

def test_joint_optimization_endpoint():
    payload = {
        "well_id": "BGW-001",
        "grid_density": "FAST"
    }
    response = client.post("/api/v1/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "recommended" in data
    assert "improvements" in data
    assert "explanations" in data
    assert len(data["explanations"]) > 0

def test_simulate_sandbox_endpoint():
    payload = {
        "well_id": "BGW-001",
        "steam_volume": 110.0,
        "injection_pressure": 20.0,
        "soak_time": 84.0,
        "production_cutoff": 35.0,
        "stroke_length": 84.0,
        "spm": 3.4,
        "vfd_frequency": 34.0
    }
    response = client.post("/api/v1/simulate", json=payload)
    assert response.status_code == 200
    state = response.json()
    assert state["srp"]["stroke_length"] == 84.0
    assert state["srp"]["spm"] == 3.4
