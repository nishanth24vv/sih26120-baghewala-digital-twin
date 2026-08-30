"""
Surface and Downhole Dynamometer Card (Dynacard) Physics Generator.
Generates realistic position vs load closed-loop dynacards reflecting
upstroke fluid pick-up, downstroke traveling valve closure, viscous drag damping,
and fluid pound / rod compression under heavy-oil conditions.

Reference Attributions:
- Dynacard area integration, Polished Rod Horsepower (PRHP), and API RP 11L load-datum
  checks inspired by digitalmodel (https://github.com/vamseeachanta/digitalmodel).
- Heavy-oil viscous damping and downhole traveling-valve transfer dynamics inspired by
  BYU-PRISM USTAR-Artificial-Lift (https://github.com/BYU-PRISM/USTAR-Artificial-Lift).
"""

import numpy as np
from typing import Dict, Any, List

def calculate_polygon_area(x_coords: List[float], y_coords: List[float]) -> float:
    """
    Calculate enclosed polygon area using Green's theorem / Shoelace formula.
    Returns area in units of (x_unit * y_unit).
    """
    x = np.array(x_coords)
    y = np.array(y_coords)
    return float(0.5 * np.abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1))))

def generate_dynacard_points(
    stroke_length_in: float,
    spm: float,
    pprl_kn: float,
    mprl_kn: float,
    pump_load_kn: float,
    pump_efficiency_pct: float,
    viscous_drag_kn: float,
    num_points: int = 60
) -> Dict[str, Any]:
    """
    Generate synthetic yet physically responsive Surface and Downhole Dynacards.
    Returns:
        surface_card: List of {"position_in": float, "load_kn": float, "stroke_direction": str}
        downhole_card: List of {"position_in": float, "load_kn": float}
        card_type: Classification string (e.g., NORMAL, FLUID_POUND, ROD_FLOATING, HIGH_VISCOSITY_DRAG)
        card_area_kj: Closed surface loop area in kJ (kN*m)
        card_area_in_lbs: Closed surface loop area in in*lbs
        prhp_hp: Polished rod horsepower
        prhp_kw: Polished rod power in kW
        pump_fillage_pct: Effective pump stroke fillage %
        scaled_load_ratio: Load span normalized by buoyant rod weight
    """
    half_pts = num_points // 2
    surface_points = []
    downhole_points = []
    
    # Position ranges from 0 to stroke_length_in
    positions = np.linspace(0, stroke_length_in, half_pts)
    
    # Classify Dynacard Diagnostic Pattern Archetype
    if mprl_kn < 5.0 or viscous_drag_kn > 25.0:
        card_type = "ROD_FLOATING / SEVERE DRAG"
        diagnostic_desc = "Severe downstroke buoyant drag exceeds rod weight; carrier bar separation hazard."
    elif pump_efficiency_pct < 55.0:
        card_type = "FLUID POUND (UNDERFILLED PUMP)"
        diagnostic_desc = "Delayed traveling valve load transfer caused by incomplete pump fillage."
    elif viscous_drag_kn > 18.0:
        card_type = "EXCESSIVE VISCOUS DAMPING"
        diagnostic_desc = "Wide hysteresis loop caused by high-viscosity crude annular Couette shear."
    elif pprl_kn > 115.0:
        card_type = "HIGH STRESS / OVERLOAD"
        diagnostic_desc = "Polished rod load approaching structural fatigue yield boundary."
    else:
        card_type = "NORMAL FULL PUMP"
        diagnostic_desc = "Full fluid fillage with normal traveling and standing valve seating."

    # Upstroke Surface Card (0 -> Stroke): Load ramps up as travelling valve closes and fluid load is picked up
    for i, pos in enumerate(positions):
        s_norm = pos / max(stroke_length_in, 1.0)
        # Fluid load pickup curve (sigmoid load transfer)
        pickup_factor = 1.0 / (1.0 + np.exp(-15.0 * (s_norm - 0.12)))
        # Viscous drag damping on upstroke adds resistance
        drag_component = viscous_drag_kn * 0.4 * np.sin(np.pi * s_norm)
        # Surface dynamic harmonic ripple (rod stretch wave reflection)
        ripple = 1.8 * np.sin(4.0 * np.pi * s_norm)
        
        load = mprl_kn + ((pprl_kn - mprl_kn) * pickup_factor) + drag_component + ripple
        surface_points.append({
            "position_in": round(float(pos), 2),
            "load_kn": round(float(np.clip(load, 0.0, 140.0)), 2),
            "stroke_direction": "UPSTROKE"
        })
        
        # Downhole card upstroke (plunger pickup)
        dh_load = pump_load_kn * pickup_factor
        downhole_points.append({
            "position_in": round(float(pos), 2),
            "load_kn": round(float(dh_load), 2)
        })

    # Downstroke Surface Card (Stroke -> 0): Standing valve opens, load drops to minimum
    # If fluid pound occurs, load drops abruptly halfway down the stroke
    pound_cutoff = 1.0 - (pump_efficiency_pct / 100.0)
    for pos in reversed(positions):
        s_norm = pos / max(stroke_length_in, 1.0)
        # Traveling valve transfer
        if "FLUID POUND" in card_type and s_norm > pound_cutoff:
            # Traveling valve floats on gas/fluid gap before fluid impact
            release_factor = 0.85
        else:
            release_factor = 1.0 / (1.0 + np.exp(15.0 * (s_norm - 0.88)))
            
        drag_component = - (viscous_drag_kn * 0.7 * np.sin(np.pi * s_norm))
        ripple = 1.2 * np.cos(4.0 * np.pi * s_norm)
        
        load = mprl_kn + ((pprl_kn - mprl_kn) * release_factor) + drag_component + ripple
        surface_points.append({
            "position_in": round(float(pos), 2),
            "load_kn": round(float(np.clip(load, 0.0, 140.0)), 2),
            "stroke_direction": "DOWNSTROKE"
        })
        
        dh_load = pump_load_kn * release_factor
        downhole_points.append({
            "position_in": round(float(pos), 2),
            "load_kn": round(float(dh_load), 2)
        })

    # Numerical Card Area Calculation (in*kN and conversion to kJ and in*lbf)
    all_x = [pt["position_in"] for pt in surface_points]
    all_y = [pt["load_kn"] for pt in surface_points]
    raw_area_in_kn = calculate_polygon_area(all_x, all_y)
    
    # 1 in * 1 kN = 0.0254 m * 1000 N = 25.4 J = 0.0254 kJ
    card_area_kj = raw_area_in_kn * 0.0254
    # 1 kN = 224.809 lbf -> 1 in*kN = 224.809 in*lbf
    card_area_in_lbs = raw_area_in_kn * 224.809
    
    # Polished Rod Horsepower (PRHP = Area_in_lb * SPM / 396,000)
    prhp_hp = (card_area_in_lbs * spm) / 396000.0
    prhp_kw = (card_area_kj * spm) / 60.0

    # Effective Pump Fillage (%)
    pump_fillage_pct = float(np.clip(pump_efficiency_pct * 1.05, 30.0, 100.0))

    return {
        "card_type": card_type,
        "diagnostic_desc": diagnostic_desc,
        "pprl_kn": round(float(pprl_kn), 1),
        "mprl_kn": round(float(mprl_kn), 1),
        "load_span_kn": round(float(max(pprl_kn - mprl_kn, 0.1)), 1),
        "stroke_length_in": stroke_length_in,
        "spm": spm,
        "card_area_kj": round(float(card_area_kj), 2),
        "card_area_in_lbs": round(float(card_area_in_lbs), 1),
        "prhp_hp": round(float(prhp_hp), 2),
        "prhp_kw": round(float(prhp_kw), 2),
        "pump_fillage_pct": round(float(pump_fillage_pct), 1),
        "surface_card": surface_points,
        "downhole_card": downhole_points
    }
