"""
Central Unit Registry and Formatting Utilities for Baghewala Digital Twin.
Strictly defines metric & oilfield units to prevent ambiguity.
"""

from typing import Dict, Any

UNITS: Dict[str, Dict[str, str]] = {
    "temperature": {"symbol": "°C", "name": "Degrees Celsius", "description": "Reservoir & wellbore fluid temperature"},
    "pressure": {"symbol": "bar", "name": "Bar", "description": "Pressure (1 bar = 100 kPa)"},
    "viscosity": {"symbol": "cP", "name": "Centipoise", "description": "Dynamic fluid viscosity (1 cP = 1 mPa·s)"},
    "oil_rate": {"symbol": "BOPD", "name": "Barrels of Oil Per Day", "description": "Volumetric crude oil production rate"},
    "water_rate": {"symbol": "BWPD", "name": "Barrels of Water Per Day", "description": "Volumetric water production rate"},
    "fluid_rate": {"symbol": "BFPD", "name": "Barrels of Fluid Per Day", "description": "Total liquid production rate"},
    "steam_volume": {"symbol": "m³", "name": "Cubic Meters Cold Water Equivalent", "description": "Total cumulative injected steam volume"},
    "soak_time": {"symbol": "hr", "name": "Hours", "description": "Well shut-in soak duration after steam injection"},
    "production_cutoff": {"symbol": "days", "name": "Days", "description": "CSS cycle production phase target cutoff"},
    "stroke_length": {"symbol": "in", "name": "Inches", "description": "Surface pumping unit polished rod stroke length"},
    "spm": {"symbol": "SPM", "name": "Strokes Per Minute", "description": "Sucker rod pumping cycle frequency"},
    "vfd_frequency": {"symbol": "Hz", "name": "Hertz", "description": "Variable Frequency Drive electrical frequency"},
    "rod_load": {"symbol": "kN", "name": "Kilonewtons", "description": "Polished rod load tension"},
    "pump_load": {"symbol": "kN", "name": "Kilonewtons", "description": "Downhole sucker rod pump barrel load"},
    "stress": {"symbol": "MPa", "name": "Megapascals", "description": "Sucker rod string tensile/compressive stress"},
    "energy": {"symbol": "kWh/bbl", "name": "Kilowatt-hours per Barrel", "description": "Specific lifting energy consumption"},
    "sor": {"symbol": "m³/m³", "name": "Steam-to-Oil Ratio", "description": "Steam volume injected per unit of oil produced (CWE)"},
    "recovery": {"symbol": "%", "name": "Percentage", "description": "Estimated ultimate recovery factor or cycle recovery"},
    "pump_efficiency": {"symbol": "%", "name": "Percentage", "description": "Pump volumetric efficiency"},
    "fluid_level": {"symbol": "m", "name": "Meters from surface", "description": "Annular acoustic dynamic fluid level"}
}

TOOLTIPS: Dict[str, str] = {
    "SOR": "Steam-Oil Ratio: Volume of steam injected (Cold Water Equivalent) relative to oil produced. Lower is more energy efficient.",
    "SPM": "Strokes Per Minute: Pumping unit cycling speed. High SPM in high-viscosity crude triggers severe downstroke rod floating.",
    "VFD": "Variable Frequency Drive: Motor inverter frequency governing pump kinematics and soft turnaround.",
    "PPRL": "Peak Polished Rod Load: Maximum tensile load on the top rod during the upstroke cycle.",
    "MPRL": "Minimum Polished Rod Load: Lowest load during the downstroke. Negative or near-zero indicates rod floating / compression.",
    "IPR": "Inflow Performance Relationship: Reservoir deliverability relationship linking drawdown to production rate.",
    "BOPD": "Barrels of Oil Per Day: Standard oil production volume (1 barrel = 159 liters).",
    "Viscosity": "Crude flow resistance. Baghewala crude drops exponentially from ~10,000 cP at 38°C to <30 cP at 180°C under CSS heating.",
    "Rod Floating": "Hazardous downstroke phenomenon where buoyant rod weight is exceeded by upward viscous drag forces, causing rod buckle and surface shock impact.",
    "Pump Unsetting": "Mechanical hazard where excessive upstroke friction or gas compression uplifts the downhole pump anchor from its seating nipple."
}

def format_value_with_unit(metric_key: str, value: float, decimal_places: int = 1) -> str:
    """Format a numerical metric with its standardized engineering unit symbol."""
    if value is None:
        return "N/A"
    unit_symbol = UNITS.get(metric_key, {}).get("symbol", "")
    formatted_num = f"{value:.{decimal_places}f}"
    return f"{formatted_num} {unit_symbol}".strip()
