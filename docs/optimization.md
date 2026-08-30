# Joint Constrained Multi-Objective Optimization Methodology

## 1. Decision Variables
The optimizer searches a 7-dimensional operational space:
1. **Steam Volume ($V_s$)**: $20\text{ to }200\text{ m}^3\text{ CWE}$
2. **Injection Pressure ($P_{inj}$)**: $10\text{ to }35\text{ bar}$
3. **Soak Time ($t_{soak}$)**: $24\text{ to }240\text{ hr}$
4. **Production Cutoff ($t_{cut}$)**: $10\text{ to }90\text{ days}$
5. **Polished Rod Stroke ($S$)**: $48\text{ to }144\text{ in}$
6. **Pumping Speed ($SPM$)**: $1.5\text{ to }6.0\text{ SPM}$
7. **VFD Motor Frequency ($f$)**: $20\text{ to }60\text{ Hz}$

---

## 2. Hard Safety Constraints (Candidate Rejection)
Every candidate combination is tested against strict boundaries before scoring. Invalid candidates are immediately rejected:
* **Max Sucker Rod Stress**: $\sigma_{peak} \le 0.85 \cdot \sigma_{yield}$ ($497\text{ MPa}$ for API Grade D).
* **Formation Fracture Limit**: $P_{inj} \le 38.0\text{ bar}$.
* **Anti-Buckling Tension**: $MPRL \ge 5.0\text{ kN}$.
* **Max Acceptable Floating Hazard**: $P(\text{float}) \le 50\%$.

---

## 3. Normalized Objective Function
$$\text{Score} = w_{prod} \cdot \tilde{q}_o - w_{sor} \cdot \widetilde{\text{SOR}} - w_{energy} \cdot \tilde{E} - w_{float} \cdot \tilde{P}_{float} - w_{fail} \cdot \tilde{P}_{fail}$$

Where all quantities are scaled to $[0, 1]$ before combining with operator-configurable weights.

---

## 4. Dynamic Explainability Generation
The reasoning engine computes numerical deltas between current baseline and proposed configuration, analyzing feature contributions (e.g. reduction in downstroke velocity, lowering viscous shear drag from 28.4 kN to 12.1 kN) to generate structured natural-language rationale.
