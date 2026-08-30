"""
Central Digital Twin State Schema (Single Source of Truth).
Unifies Reservoir, Wellbore, SRP, Production, and Risk subsystems into a single coupled state.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime

class ReservoirState(BaseModel):
    temperature: float = Field(..., description="Average near-wellbore reservoir temperature (°C)")
    pressure: float = Field(..., description="Current reservoir static/depletion pressure (bar)")
    viscosity: float = Field(..., description="In-situ heavy crude oil dynamic viscosity (cP)")
    mobility: float = Field(..., description="Crude oil relative mobility k/mu (mD/cP)")
    heating_state: float = Field(..., description="Thermal saturation index [0.0 - 1.0]")
    cooling_rate: float = Field(..., description="Current exponential thermal decay rate (%/day)")
    permeability_md: float = Field(default=450.0, description="Formation effective permeability (mD)")
    steam_chamber_radius_m: float = Field(default=14.5, description="Estimated thermal steam zone radius (m)")

class WellboreState(BaseModel):
    temperature: float = Field(..., description="Bottom-hole fluid temperature (°C)")
    pressure: float = Field(..., description="Bottom-hole flowing pressure Pwf (bar)")
    fluid_level: float = Field(..., description="Annular dynamic fluid level from surface (m)")
    pump_intake_pressure: float = Field(..., description="Pump intake pressure P_pip (bar)")
    viscosity: float = Field(..., description="Wellbore fluid flow viscosity (cP)")
    flow_rate: float = Field(..., description="Total liquid volumetric inflow rate (BFPD)")
    gas_oil_ratio: float = Field(default=12.0, description="Produced gas-oil ratio (scf/bbl)")

class SRPState(BaseModel):
    stroke_length: float = Field(..., description="Polished rod stroke length (in)")
    spm: float = Field(..., description="Pumping speed (strokes/min)")
    vfd_frequency: float = Field(..., description="Motor VFD inverter frequency (Hz)")
    pprl: float = Field(..., description="Peak Polished Rod Load (kN)")
    mprl: float = Field(..., description="Minimum Polished Rod Load (kN)")
    load_span: Optional[float] = Field(default=None, description="Dynamic Load Span PPRL - MPRL (kN)")
    scaled_load_ratio: Optional[float] = Field(default=None, description="Scaled Load Ratio (Load Span / W_rf)")
    pump_load: float = Field(..., description="Downhole plunger differential load (kN)")
    rod_load: float = Field(..., description="Average rod string tension (kN)")
    rod_stress_ratio: float = Field(..., description="Operating stress ratio relative to rod yield limit (0-1)")
    pump_efficiency: float = Field(..., description="Pump volumetric efficiency (%)")
    prhp_kw: Optional[float] = Field(default=None, description="Polished rod power (kW)")
    prhp_hp: Optional[float] = Field(default=None, description="Polished rod horsepower (HP)")
    dynamic_viscous_drag: float = Field(..., description="Downstroke fluid shear friction drag on rod string (kN)")
    buoyant_rod_weight: float = Field(default=38.5, description="Net buoyant rod string weight (kN)")

class ProductionState(BaseModel):
    oil_rate: float = Field(..., description="Current oil production rate (BOPD)")
    water_rate: float = Field(..., description="Current water cut rate (BWPD)")
    fluid_rate: float = Field(..., description="Total liquid production (BFPD)")
    sor: float = Field(..., description="Current cycle Steam-to-Oil Ratio (m³/m³)")
    recovery: float = Field(..., description="Cycle estimated cumulative oil recovery (bbl)")
    energy_consumption: float = Field(..., description="Specific lifting energy (kWh/bbl)")
    water_cut_pct: float = Field(default=25.0, description="Water cut percentage (%)")

class RiskFactor(BaseModel):
    name: str
    contribution: float = Field(..., description="Relative weight/influence score [0.0 - 1.0]")
    value: str
    threshold: str

class RiskState(BaseModel):
    rod_floating: float = Field(..., description="Downstroke rod floating probability [0.0 - 1.0]")
    rod_floating_level: str = Field(..., description="Risk band: LOW, MEDIUM, HIGH, CRITICAL")
    rod_failure: float = Field(..., description="Rod fatigue failure probability within 30 days [0.0 - 1.0]")
    rod_failure_level: str = Field(..., description="Risk band: LOW, MEDIUM, HIGH, CRITICAL")
    pump_unsetting: float = Field(..., description="Pump unsetting probability [0.0 - 1.0]")
    pump_unsetting_level: str = Field(..., description="Risk band: LOW, MEDIUM, HIGH, CRITICAL")
    impact_loading: float = Field(..., description="Upstroke impact / shock load severity index [0.0 - 1.0]")
    contributing_factors: Dict[str, List[RiskFactor]] = Field(default_factory=dict)

class DigitalTwinState(BaseModel):
    well_id: str
    well_name: str
    status: str = "ACTIVE"
    scenario_type: str = "NORMAL_WELL"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    reservoir: ReservoirState
    wellbore: WellboreState
    srp: SRPState
    production: ProductionState
    risks: RiskState
    
    # Active CSS Cycle metadata
    current_css_cycle: int = Field(default=3, description="Current CSS cycle index")
    days_on_production: float = Field(default=24.5, description="Days produced in active CSS cycle")
    cumulative_steam_injected_m3: float = Field(default=255.0, description="Total steam injected across cycles (m³ CWE)")
