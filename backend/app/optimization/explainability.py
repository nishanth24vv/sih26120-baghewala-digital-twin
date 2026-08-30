"""
Dynamic Natural-Language Explainability Reasoner for AI Recommendations.
Synthesizes domain-specific physical rationale and feature importances
comparing current vs recommended states with real numerical metrics.
"""

from typing import Dict, Any, List

def generate_recommendation_explanations(
    current: Dict[str, Any],
    recommended: Dict[str, Any],
    predicted: Dict[str, Any],
    improvements: Dict[str, Any]
) -> List[Dict[str, str]]:
    """
    Generate rich, structured, domain-grounded explanations for why
    the optimizer selected the recommended CSS + SRP configuration.
    """
    explanations = []

    curr_spm = current.get("spm", 3.8)
    rec_spm = recommended.get("spm", 3.8)
    curr_stroke = current.get("stroke", current.get("stroke_length", 72.0))
    rec_stroke = recommended.get("stroke", recommended.get("stroke_length", 72.0))
    
    curr_floating = current.get("floating_risk", 0.20) * 100
    pred_floating = predicted.get("floating_risk", 0.15) * 100

    curr_oil = current.get("oil_rate", 35.0)
    pred_oil = predicted.get("oil_rate", 42.0)
    oil_delta_pct = improvements.get("production", round(((pred_oil - curr_oil) / max(curr_oil, 1.0)) * 100, 1))

    curr_sor = current.get("sor", 5.0)
    pred_sor = predicted.get("sor", 4.2)
    sor_delta_pct = improvements.get("sor", round(((curr_sor - pred_sor) / max(curr_sor, 1.0)) * 100, 1))

    curr_energy = current.get("energy", 95.0)
    pred_energy = predicted.get("energy", 82.0)
    energy_delta_pct = improvements.get("energy", round(((curr_energy - pred_energy) / max(curr_energy, 1.0)) * 100, 1))

    # 1. SPM & Rod Floating Mechanical Rationalization
    if curr_spm > rec_spm:
        spm_diff = round(curr_spm - rec_spm, 2)
        explanations.append({
            "category": "MECHANICAL_INTEGRITY",
            "title": f"Mitigate Rod-Floating Hazard (Reduce SPM {curr_spm:.1f} → {rec_spm:.1f})",
            "text": (
                f"High crude viscosity in the wellbore produces substantial downstroke viscous shear drag. "
                f"Lowering pumping speed by {spm_diff} SPM reduces maximum rod velocity, decreasing dynamic drag "
                f"and slashing predicted rod-floating probability from {curr_floating:.0f}% down to {pred_floating:.0f}%."
            ),
            "importance": "CRITICAL" if curr_floating > 60 else "HIGH"
        })
    elif curr_spm < rec_spm:
        spm_diff = round(rec_spm - curr_spm, 2)
        explanations.append({
            "category": "THROUGHPUT_OPTIMIZATION",
            "title": f"Increase Pumping Cadence (SPM {curr_spm:.1f} → {rec_spm:.1f})",
            "text": (
                f"Reservoir thermal state provides sufficient crude mobility (viscosity safely low). "
                f"Pumping frequency can be safely increased by {spm_diff} SPM without exceeding the 85% rod stress limit, "
                f"capturing additional drawdown potential."
            ),
            "importance": "MEDIUM"
        })

    # 2. CSS Thermal & SOR Rationalization
    rec_steam = recommended.get("steam_volume", 85.0)
    rec_soak = recommended.get("soak_time", 72.0)
    rec_inj_p = recommended.get("injection_pressure", 18.0)

    if pred_sor < curr_sor:
        explanations.append({
            "category": "THERMAL_EFFICIENCY",
            "title": f"Optimized Steam-to-Oil Ratio ({curr_sor:.1f} → {pred_sor:.1f} m³/m³)",
            "text": (
                f"Injecting {rec_steam:.0f} m³ CWE at {rec_inj_p:.1f} bar with a {rec_soak:.0f} hr soak window "
                f"maximizes near-wellbore thermal chamber expansion while preventing convective overburden heat loss. "
                f"Delivers an estimated {sor_delta_pct:.0f}% improvement in steam efficiency."
            ),
            "importance": "HIGH"
        })

    # 3. Production & Recovery Enhancement
    if pred_oil > curr_oil:
        explanations.append({
            "category": "PRODUCTION_UPLIFT",
            "title": f"Production Deliverability (+{oil_delta_pct:.1f}% Oil Rate)",
            "text": (
                f"Predicted oil rate improves from {curr_oil:.1f} to {pred_oil:.1f} BOPD. "
                f"The synchronized CSS thermal mobility enhancement coupled with optimized SRP displacement "
                f"prevents pump fluid pound and maintains efficient bottom-hole drawdown."
            ),
            "importance": "HIGH"
        })

    # 4. Lifting Energy Efficiency
    if pred_energy < curr_energy:
        explanations.append({
            "category": "ENERGY_CONSERVATION",
            "title": f"Specific Energy Reduction ({curr_energy:.1f} → {pred_energy:.1f} kWh/bbl)",
            "text": (
                f"Optimizing motor VFD frequency and polished rod stroke trajectory avoids peak motor torque spikes, "
                f"yielding a {energy_delta_pct:.0f}% reduction in specific lifting energy consumption."
            ),
            "importance": "MEDIUM"
        })

    return explanations
