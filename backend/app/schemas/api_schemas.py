"""
Pydantic API Schemas for Requests and Responses.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

# CSS Prediction Schemas
class CSSPredictRequest(BaseModel):
    well_id: str = Field(default="BGW-001", description="Target well identifier")
    steam_volume: float = Field(default=85.0, ge=20.0, le=200.0, description="Steam volume injected (m³ CWE)")
    injection_pressure: float = Field(default=18.0, ge=10.0, le=35.0, description="Injection pressure (bar)")
    soak_time: float = Field(default=72.0, ge=24.0, le=240.0, description="Soak time (hr)")
    production_cutoff: float = Field(default=30.0, ge=10.0, le=90.0, description="Production cycle cutoff (days)")

class ForecastPoint(BaseModel):
    day: int
    value: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None

class CSSPredictResponse(BaseModel):
    well_id: str
    predicted_oil_rate: float
    predicted_sor: float
    predicted_energy: float
    recovery: float
    peak_temperature: float
    temperature_forecast: List[Dict[str, float]]
    viscosity_forecast: List[Dict[str, float]]
    model_version: str = "v1.2"

# SRP Prediction Schemas
class SRPPredictRequest(BaseModel):
    well_id: str = Field(default="BGW-001")
    stroke_length: float = Field(default=72.0, ge=48.0, le=144.0, description="Stroke length (in)")
    spm: float = Field(default=3.7, ge=1.5, le=6.0, description="Pumping speed (SPM)")
    vfd_frequency: float = Field(default=38.0, ge=20.0, le=60.0, description="VFD frequency (Hz)")
    wellbore_viscosity_override: Optional[float] = None

class SRPPredictResponse(BaseModel):
    well_id: str
    pprl: float
    mprl: float
    load_span: Optional[float] = None
    scaled_load_ratio: Optional[float] = None
    rod_load: float
    pump_load: float
    dynamic_viscous_drag: float
    pump_efficiency: float
    rod_stress_ratio: float
    prhp_kw: Optional[float] = None
    prhp_hp: Optional[float] = None
    pump_fillage_pct: Optional[float] = None
    floating_probability: float
    floating_risk_level: str
    failure_probability: float
    failure_risk_level: str
    energy_consumption: float
    dynacard: Dict[str, Any]

# Joint Optimization Schemas
class ObjectiveWeights(BaseModel):
    production: float = Field(default=0.35, ge=0.0, le=1.0)
    sor: float = Field(default=0.15, ge=0.0, le=1.0)
    energy: float = Field(default=0.15, ge=0.0, le=1.0)
    reliability: float = Field(default=0.20, ge=0.0, le=1.0)
    maintenance: float = Field(default=0.15, ge=0.0, le=1.0)

class OptimizeRequest(BaseModel):
    well_id: str = Field(default="BGW-001")
    objective_weights: Optional[ObjectiveWeights] = None
    grid_density: Optional[str] = Field(default="NORMAL", description="FAST, NORMAL, or DEEP search")

class ExplanationItem(BaseModel):
    category: str
    title: str
    text: str
    importance: str

class OptimizeResponse(BaseModel):
    optimization_id: str
    well_id: str
    timestamp: str
    candidates_evaluated: int
    valid_candidates: int
    rejected_by_constraints: int
    rejection_reasons: Optional[Dict[str, int]] = None
    score: float
    objective_weights: Dict[str, float]
    current: Dict[str, Any]
    recommended: Dict[str, Any]
    predicted: Dict[str, Any]
    improvements: Dict[str, Any]
    explanations: List[ExplanationItem]
    optimization_trace: Optional[List[Dict[str, Any]]] = None
    model_versions: Dict[str, str]

# Simulation Request Schema
class SimulationRequest(BaseModel):
    well_id: str = Field(default="BGW-001")
    # CSS Parameters
    steam_volume: float = Field(default=85.0, ge=20.0, le=200.0)
    injection_pressure: float = Field(default=18.0, ge=10.0, le=35.0)
    soak_time: float = Field(default=72.0, ge=24.0, le=240.0)
    production_cutoff: float = Field(default=30.0, ge=10.0, le=90.0)
    # SRP Parameters
    stroke_length: float = Field(default=72.0, ge=48.0, le=144.0)
    spm: float = Field(default=3.7, ge=1.5, le=6.0)
    vfd_frequency: float = Field(default=38.0, ge=20.0, le=60.0)
    # Reservoir Override (Optional)
    temperature_override: Optional[float] = None

# Approval & Audit Request
class ApprovalRequest(BaseModel):
    well_id: str
    optimization_id: Optional[str] = None
    operator_name: str = "Demo Operator"
    action: str = "APPROVE"  # APPROVE, REJECT, MODIFY
    previous_parameters: Dict[str, Any]
    recommended_parameters: Dict[str, Any]
    final_approved_parameters: Dict[str, Any]
    reason: str = "Operator approved AI recommendation to mitigate rod floating and enhance production."

# Anomaly Injection Request
class AnomalyRequest(BaseModel):
    anomaly_type: str = Field(..., description="TEMPERATURE_DROP, HIGH_VISCOSITY, HIGH_ROD_LOAD, ROD_FLOATING, PUMP_UNSETTING, PRODUCTION_DROP")
