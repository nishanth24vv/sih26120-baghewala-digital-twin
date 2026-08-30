/**
 * Central Operating Boundaries for UI Sliders and Input Controls.
 * Identical to backend OperatingConstraints to maintain single source of truth.
 */

export interface ParameterRange {
  min: number;
  max: number;
  step: number;
  default: number;
  unit: string;
  label: string;
  description: string;
}

export const OPERATING_CONSTRAINTS: Record<string, ParameterRange> = {
  steam_volume: {
    min: 20,
    max: 200,
    step: 5,
    default: 85,
    unit: "m³",
    label: "Steam Volume",
    description: "Steam injection volume CWE per cycle"
  },
  injection_pressure: {
    min: 10,
    max: 35,
    step: 1,
    default: 18,
    unit: "bar",
    label: "Injection Pressure",
    description: "Wellhead injection pressure (formation fracture limit: 38 bar)"
  },
  soak_time: {
    min: 24,
    max: 240,
    step: 6,
    default: 72,
    unit: "hr",
    label: "Soak Time",
    description: "Shut-in soak duration for thermal diffusion"
  },
  production_cutoff: {
    min: 10,
    max: 90,
    step: 2,
    default: 30,
    unit: "days",
    label: "Production Cutoff",
    description: "Target production window before subsequent CSS cycle"
  },
  stroke_length: {
    min: 48,
    max: 144,
    step: 6,
    default: 72,
    unit: "in",
    label: "Stroke Length",
    description: "Surface pumping unit polished rod stroke length"
  },
  spm: {
    min: 1.5,
    max: 6.0,
    step: 0.1,
    default: 3.7,
    unit: "SPM",
    label: "Pumping Speed (SPM)",
    description: "Sucker rod pumping cycle frequency"
  },
  vfd_frequency: {
    min: 20,
    max: 60,
    step: 1,
    default: 38,
    unit: "Hz",
    label: "VFD Frequency",
    description: "Motor inverter frequency governing kinematics"
  }
};
