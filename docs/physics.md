# Baghewala Heavy-Oil Physics & Mathematical Modeling Guide

## 1. Heavy Crude Viscosity Model (Andrade Formulation)

Baghewala crude is characterized by ultra-high viscosity at reservoir temperature (~8,500 cP at $38^\circ\text{C}$). Dynamic viscosity $\mu(T)$ is modeled via the two-parameter Andrade equation:

$$\ln(\mu) = A + \frac{B}{T_c + 273.15}$$

Calibrated constants for Baghewala $17.5^\circ\text{ API}$ crude:
* $A = -10.42$
* $B = 6050.0\text{ K}$

### Temperature-Viscosity Benchmark
* **$38^\circ\text{C}$ (Native Reservoir)**: $\mu \approx 8,800\text{ cP}$ (Near-solid asphaltic emulsion)
* **$65^\circ\text{C}$**: $\mu \approx 650\text{ cP}$
* **$100^\circ\text{C}$**: $\mu \approx 125\text{ cP}$
* **$180^\circ\text{C}$ (Peak CSS Heating)**: $\mu \approx 28\text{ cP}$

---

## 2. Cyclic Steam Stimulation (CSS) Thermal Dynamics

Steam injection delivers latent and sensible heat into the near-wellbore formation:

$$Q_{eff} = m_{steam} \cdot h_{fg} \cdot \eta_{thermal}$$

Where:
* $m_{steam} = V_{steam} \cdot 1000\text{ kg/m}^3$ (Cold Water Equivalent)
* $h_{fg} \approx 2.75\text{ MJ/kg}$ (Enthalpy of saturated steam at 18–25 bar)
* $\eta_{thermal} = 0.72 - 0.001 \cdot t_{soak}$ (Thermal efficiency accounting for overburden conductive loss)

### Production Thermal Decay Curve
During the subsequent production phase, convective fluid outflow and rock thermal conduction cool the formation:

$$T(t) = T_{native} + (T_{peak} - T_{native}) \cdot e^{-\lambda t}$$

Where cooling constant $\lambda = 0.018 + 0.00012 \cdot q_{fluid}\text{ day}^{-1}$.

---

## 3. Reservoir Inflow Deliverability (IPR)

Crude oil inflow rate $q_o$ couples formation deliverability and temperature-dependent mobility $M(T) = k / \mu(T)$:

$$q_o = J(T) \cdot (P_{res} - P_{wf})$$

$$J(T) = \frac{0.00708 \cdot k \cdot h \cdot 6.2898}{\mu(T) \cdot \left(\ln\left(\frac{r_e}{r_w}\right) - 0.75 + s\right)}$$

---

## 4. Sucker Rod Pumping (SRP) Mechanics & Downstroke Rod Floating

### Dynamic Viscous Drag Force
In high-viscosity crude, annular Couette fluid shear creates upward drag opposing rod fall on the downstroke:

$$F_{drag} = \frac{2\pi \cdot r_{rod} \cdot L \cdot \mu \cdot v_{peak}}{r_{tubing} - r_{rod}}$$

Where $v_{peak} = \frac{\pi \cdot S \cdot SPM}{60}\text{ m/s}$.

### Minimum Polished Rod Load (MPRL) & Rod Floating Criterion
$$MPRL = W_{rf} \cdot (1 - \alpha) - F_{drag}$$

$$\text{Hazard Condition: } F_{drag} \ge W_{rf}$$

When upward viscous shear drag $F_{drag}$ exceeds net buoyant rod weight $W_{rf}$ (38.5 kN for 1.0" Grade D rods at 1,000m depth), the rod string falls slower than the surface carrier bar. This produces:
1. Slackline & carrier bar separation.
2. Sucker rod compression buckling.
3. Severe surface shock impact on upstroke reversal.
4. Premature fatigue failure.
