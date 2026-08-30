/**
 * Central Unit Registry and Tooltips for Baghewala Heavy-Oil Field.
 */

export const UNITS: Record<string, { symbol: string; name: string }> = {
  temperature: { symbol: "°C", name: "Degrees Celsius" },
  pressure: { symbol: "bar", name: "Bar" },
  viscosity: { symbol: "cP", name: "Centipoise" },
  oil_rate: { symbol: "BOPD", name: "Barrels of Oil Per Day" },
  water_rate: { symbol: "BWPD", name: "Barrels of Water Per Day" },
  fluid_rate: { symbol: "BFPD", name: "Barrels of Fluid Per Day" },
  steam_volume: { symbol: "m³", name: "Cubic Meters CWE" },
  injection_pressure: { symbol: "bar", name: "Bar" },
  soak_time: { symbol: "hr", name: "Hours" },
  production_cutoff: { symbol: "days", name: "Days" },
  stroke_length: { symbol: "in", name: "Inches" },
  spm: { symbol: "SPM", name: "Strokes Per Minute" },
  vfd_frequency: { symbol: "Hz", name: "Hertz" },
  rod_load: { symbol: "kN", name: "Kilonewtons" },
  pprl: { symbol: "kN", name: "Kilonewtons" },
  mprl: { symbol: "kN", name: "Kilonewtons" },
  pump_load: { symbol: "kN", name: "Kilonewtons" },
  dynamic_viscous_drag: { symbol: "kN", name: "Kilonewtons" },
  stress: { symbol: "MPa", name: "Megapascals" },
  energy: { symbol: "kWh/bbl", name: "Kilowatt-hours per Barrel" },
  sor: { symbol: "m³/m³", name: "Steam-to-Oil Ratio" },
  recovery: { symbol: "bbl", name: "Barrels" },
  pump_efficiency: { symbol: "%", name: "Percentage" },
  fluid_level: { symbol: "m", name: "Meters" },
};

export const TOOLTIPS: Record<string, string> = {
  SOR: "Steam-Oil Ratio: Volume of steam injected relative to oil produced. Lower is more energy efficient.",
  SPM: "Strokes Per Minute: Pumping cycle speed. In heavy oil, excessive SPM causes severe downstroke rod floating.",
  VFD: "Variable Frequency Drive: Motor inverter frequency governing pump speed and acceleration profile.",
  PPRL: "Peak Polished Rod Load: Maximum tensile load on top rod during upstroke.",
  MPRL: "Minimum Polished Rod Load: Lowest load during downstroke. Near-zero indicates rod floating / compression buckling.",
  IPR: "Inflow Performance Relationship: Reservoir deliverability linking drawdown to production rate.",
  BOPD: "Barrels of Oil Per Day: Standard oil production volume (1 bbl = 159 liters).",
  Viscosity: "Crude flow resistance. Baghewala crude drops exponentially from ~8,500 cP at 38°C to <30 cP at 180°C under CSS heating.",
  "Rod Floating": "Hazardous downstroke phenomenon where buoyant rod weight is exceeded by upward viscous shear drag forces.",
  "Pump Unsetting": "Mechanical hazard where excessive upstroke friction or gas compression uplifts the downhole pump from its seating nipple."
};

export function formatValueWithUnit(metricKey: string, value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "N/A";
  const unit = UNITS[metricKey]?.symbol || "";
  return `${value.toFixed(decimals)} ${unit}`.trim();
}
