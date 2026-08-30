"""
SQLAlchemy Database Models for Baghewala Heavy-Oil Digital Twin.
Includes entities for Wells, Production History, CSS Cycles, SRP Operations,
Failures, Sensor Telemetry, Optimization Runs, and Operator Audit Logs.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Well(Base):
    __tablename__ = "wells"

    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    field = Column(String(100), default="Baghewala")
    status = Column(String(50), default="ACTIVE")  # ACTIVE, SHUT_IN, STEAM_INJECTION, SOAKING, MAINTENANCE
    scenario_type = Column(String(50), default="NORMAL_WELL")  # COOLING_RESERVOIR, HIGH_VISCOSITY, HIGH_ROD_LOAD, etc.
    latitude = Column(Float, default=27.52)
    longitude = Column(Float, default=71.85)
    reservoir_type = Column(String(100), default="Bikaner-Nagaur Heavy Sandstone")
    completion_date = Column(DateTime, default=datetime.utcnow)
    
    # Static Reservoir & Equipment Attributes
    reservoir_depth_m = Column(Float, default=1050.0)
    formation_thickness_m = Column(Float, default=18.5)
    permeability_md = Column(Float, default=450.0)
    porosity_pct = Column(Float, default=26.0)
    base_reservoir_pressure_bar = Column(Float, default=75.0)
    fracture_pressure_bar = Column(Float, default=38.0)
    tubing_id_in = Column(Float, default=2.992)
    rod_diameter_in = Column(Float, default=1.0)
    pump_bore_in = Column(Float, default=2.25)
    
    # Dynamic Current State Summary
    current_oil_rate = Column(Float, default=42.0)
    current_water_rate = Column(Float, default=14.0)
    current_temperature = Column(Float, default=68.0)
    current_pressure = Column(Float, default=62.0)
    current_viscosity = Column(Float, default=420.0)
    current_sor = Column(Float, default=4.6)
    current_energy = Column(Float, default=88.5)
    current_stroke = Column(Float, default=72.0)
    current_spm = Column(Float, default=3.8)
    current_vfd = Column(Float, default=38.0)
    current_pump_eff = Column(Float, default=76.0)
    current_rod_load = Column(Float, default=82.0)
    current_floating_risk = Column(Float, default=0.22)
    current_failure_risk = Column(Float, default=0.08)
    current_unsetting_risk = Column(Float, default=0.05)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    production_records = relationship("ProductionRecord", back_populates="well", cascade="all, delete-orphan")
    css_cycles = relationship("CSSCycle", back_populates="well", cascade="all, delete-orphan")
    srp_operations = relationship("SRPOperation", back_populates="well", cascade="all, delete-orphan")
    failures = relationship("FailureRecord", back_populates="well", cascade="all, delete-orphan")
    sensor_readings = relationship("SensorReading", back_populates="well", cascade="all, delete-orphan")
    optimization_runs = relationship("OptimizationRun", back_populates="well", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="well", cascade="all, delete-orphan")


class ProductionRecord(Base):
    __tablename__ = "production_records"

    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(String(50), ForeignKey("wells.well_id"), index=True, nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    oil_rate = Column(Float, nullable=False)      # BOPD
    water_rate = Column(Float, nullable=False)    # BWPD
    fluid_rate = Column(Float, nullable=False)    # BFPD
    pressure = Column(Float, nullable=False)      # bar
    temperature = Column(Float, nullable=False)   # °C
    viscosity = Column(Float, nullable=False)     # cP
    sor = Column(Float, nullable=True)            # m³/m³
    energy_kwh = Column(Float, nullable=True)     # kWh/bbl

    well = relationship("Well", back_populates="production_records")


class CSSCycle(Base):
    __tablename__ = "css_cycles"

    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(String(50), ForeignKey("wells.well_id"), index=True, nullable=False)
    cycle_number = Column(Integer, nullable=False)
    start_date = Column(DateTime, nullable=False)
    injection_start = Column(DateTime, nullable=False)
    injection_end = Column(DateTime, nullable=False)
    soak_start = Column(DateTime, nullable=False)
    soak_end = Column(DateTime, nullable=False)
    production_start = Column(DateTime, nullable=False)
    production_end = Column(DateTime, nullable=False)
    
    steam_volume = Column(Float, nullable=False)       # m³ CWE
    injection_pressure = Column(Float, nullable=False) # bar
    soak_time = Column(Float, nullable=False)          # hr
    production_cutoff = Column(Float, nullable=False)  # days
    oil_recovery = Column(Float, nullable=False)       # cumulative bbl
    sor = Column(Float, nullable=False)                # m³/m³
    energy_consumption = Column(Float, nullable=False) # kWh/bbl
    peak_temperature = Column(Float, nullable=False)   # °C

    well = relationship("Well", back_populates="css_cycles")


class SRPOperation(Base):
    __tablename__ = "srp_operations"

    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(String(50), ForeignKey("wells.well_id"), index=True, nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    stroke_length = Column(Float, nullable=False)   # in
    spm = Column(Float, nullable=False)             # strokes/min
    vfd_frequency = Column(Float, nullable=False)   # Hz
    pprl = Column(Float, nullable=False)            # Peak Polished Rod Load (kN)
    mprl = Column(Float, nullable=False)            # Min Polished Rod Load (kN)
    pump_load = Column(Float, nullable=False)       # kN
    rod_load = Column(Float, nullable=False)        # kN
    rod_stress_ratio = Column(Float, nullable=False)# % of yield
    pump_efficiency = Column(Float, nullable=False) # %
    fluid_level = Column(Float, nullable=False)     # m from surface

    well = relationship("Well", back_populates="srp_operations")


class FailureRecord(Base):
    __tablename__ = "failures"

    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(String(50), ForeignKey("wells.well_id"), index=True, nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    failure_type = Column(String(50), nullable=False)  # ROD_FAILURE, PUMP_UNSETTING, ROD_FLOATING, IMPACT_LOADING
    severity = Column(String(20), nullable=False)      # LOW, MEDIUM, HIGH, CRITICAL
    operating_hours = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    contributing_factors = Column(JSON, nullable=True)

    well = relationship("Well", back_populates="failures")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(String(50), ForeignKey("wells.well_id"), index=True, nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    temperature = Column(Float, nullable=False) # °C
    pressure = Column(Float, nullable=False)    # bar
    viscosity = Column(Float, nullable=False)   # cP
    rod_load = Column(Float, nullable=False)    # kN
    pump_load = Column(Float, nullable=False)   # kN
    oil_rate = Column(Float, nullable=False)    # BOPD
    water_rate = Column(Float, nullable=False)  # BWPD
    vfd = Column(Float, nullable=False)         # Hz
    spm = Column(Float, nullable=False)         # SPM
    stroke = Column(Float, nullable=False)      # in
    floating_risk = Column(Float, default=0.0)
    failure_risk = Column(Float, default=0.0)

    well = relationship("Well", back_populates="sensor_readings")


class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id = Column(Integer, primary_key=True, index=True)
    optimization_id = Column(String(50), unique=True, index=True, nullable=False)
    well_id = Column(String(50), ForeignKey("wells.well_id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    current_parameters = Column(JSON, nullable=False)
    recommended_parameters = Column(JSON, nullable=False)
    operator_modified_parameters = Column(JSON, nullable=True)
    predicted_metrics = Column(JSON, nullable=False)
    improvements = Column(JSON, nullable=False)
    
    candidates_evaluated = Column(Integer, default=0)
    valid_candidates = Column(Integer, default=0)
    rejected_by_constraints = Column(Integer, default=0)
    
    objective_score = Column(Float, nullable=False)
    objective_weights = Column(JSON, nullable=False)
    explanation = Column(JSON, nullable=False)
    status = Column(String(50), default="GENERATED")  # GENERATED, APPROVED, REJECTED, MODIFIED

    well = relationship("Well", back_populates="optimization_runs")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user = Column(String(100), default="Demo Operator")
    well_id = Column(String(50), ForeignKey("wells.well_id"), index=True, nullable=False)
    action = Column(String(100), nullable=False)
    previous_parameters = Column(JSON, nullable=False)
    recommended_parameters = Column(JSON, nullable=False)
    final_approved_parameters = Column(JSON, nullable=False)
    reason = Column(Text, nullable=False)
    approval_status = Column(String(50), nullable=False)

    well = relationship("Well", back_populates="audit_logs")


class AlertRecord(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(50), unique=True, index=True, nullable=False)
    well_id = Column(String(50), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    severity = Column(String(20), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    parameter = Column(String(50), nullable=False)
    value = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    is_acknowledged = Column(Boolean, default=False)
