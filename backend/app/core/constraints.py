"""
Central Operating Boundaries and Hard Constraints for Baghewala Field.
Used uniformly by Optimizer, Simulation Engine, Pydantic Validators, and UI Sliders.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any

class ParameterRange(BaseModel):
    min_val: float
    max_val: float
    step: float
    default: float
    unit: str
    description: str

class OperatingConstraints(BaseModel):
    # CSS Parameters Limits
    steam_volume: ParameterRange = Field(
        default=ParameterRange(min_val=20.0, max_val=200.0, step=5.0, default=85.0, unit="m³", description="Steam injection volume CWE per cycle")
    )
    injection_pressure: ParameterRange = Field(
        default=ParameterRange(min_val=10.0, max_val=35.0, step=1.0, default=18.0, unit="bar", description="Steam injection wellhead pressure (must not exceed fracture pressure)")
    )
    soak_time: ParameterRange = Field(
        default=ParameterRange(min_val=24.0, max_val=240.0, step=6.0, default=72.0, unit="hr", description="Well shut-in soak period for thermal diffusion")
    )
    production_cutoff: ParameterRange = Field(
        default=ParameterRange(min_val=10.0, max_val=90.0, step=2.0, default=30.0, unit="days", description="Production period target cutoff duration before next CSS cycle")
    )

    # SRP Parameters Limits
    stroke_length: ParameterRange = Field(
        default=ParameterRange(min_val=48.0, max_val=144.0, step=6.0, default=72.0, unit="in", description="Surface polished rod stroke length")
    )
    spm: ParameterRange = Field(
        default=ParameterRange(min_val=1.5, max_val=6.0, step=0.1, default=3.7, unit="SPM", description="Pumping speed in strokes per minute")
    )
    vfd_frequency: ParameterRange = Field(
        default=ParameterRange(min_val=20.0, max_val=60.0, step=1.0, default=38.0, unit="Hz", description="Motor VFD electrical drive frequency")
    )

    # Safety & Structural Limits (Hard Safety Thresholds)
    max_fracture_pressure_bar: float = 38.0  # Cap on injection pressure to prevent formation rupture
    max_rod_stress_ratio: float = 0.85      # Must remain <= 85% of sucker rod yield limit (API Modified Goodman diagram)
    max_allowable_rod_load_kn: float = 125.0 # Max structural load on Mark II / Beam unit
    min_allowable_mprl_kn: float = 8.0      # Minimum downstroke load to prevent rod float & compression buckling
    max_acceptable_failure_risk: float = 0.40 # 40% risk upper limit for viable candidate configurations
    max_acceptable_floating_risk: float = 0.50 # 50% max floating probability in recommended states

    def validate_candidate(self, candidate: Dict[str, Any]) -> tuple[bool, str]:
        """Strictly validate an operational candidate against hard safety constraints."""
        spm_val = candidate.get("spm", 0.0)
        if not (self.spm.min_val <= spm_val <= self.spm.max_val):
            return False, f"SPM {spm_val} out of bounds [{self.spm.min_val}, {self.spm.max_val}]"

        stroke_val = candidate.get("stroke_length", candidate.get("stroke", 0.0))
        if not (self.stroke_length.min_val <= stroke_val <= self.stroke_length.max_val):
            return False, f"Stroke {stroke_val} out of bounds [{self.stroke_length.min_val}, {self.stroke_length.max_val}]"

        vfd_val = candidate.get("vfd_frequency", candidate.get("vfd", 0.0))
        if not (self.vfd_frequency.min_val <= vfd_val <= self.vfd_frequency.max_val):
            return False, f"VFD {vfd_val} out of bounds [{self.vfd_frequency.min_val}, {self.vfd_frequency.max_val}]"

        inj_p = candidate.get("injection_pressure", 0.0)
        if inj_p > self.max_fracture_pressure_bar:
            return False, f"Injection pressure {inj_p} bar exceeds formation fracture limit {self.max_fracture_pressure_bar} bar"

        steam_v = candidate.get("steam_volume", 0.0)
        if not (self.steam_volume.min_val <= steam_v <= self.steam_volume.max_val):
            return False, f"Steam volume {steam_v} m³ out of bounds [{self.steam_volume.min_val}, {self.steam_volume.max_val}]"

        soak_t = candidate.get("soak_time", 0.0)
        if not (self.soak_time.min_val <= soak_t <= self.soak_time.max_val):
            return False, f"Soak time {soak_t} hr out of bounds [{self.soak_time.min_val}, {self.soak_time.max_val}]"

        return True, "Valid"

# Global singleton constraints object
OPERATING_CONSTRAINTS = OperatingConstraints()
