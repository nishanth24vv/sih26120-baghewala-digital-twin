# Open-Source & Scientific References Audit

**Project:** SIH 26120 — Baghewala Heavy-Oil Well-to-Surface Digital Twin  
**Date:** August 2026  
**License Compliance:** All studied open-source repositories are permissive (MIT / BSD / Apache / Academic). No proprietary or copyleft code was directly copied. All models implemented in this repository are independent, reduced-order physics and ML pipelines tailored specifically to the unique ultra-heavy oil characteristics of the Baghewala Field (Bikaner-Nagaur Basin, Rajasthan).

---

## 1. Open-Source Repositories Audited

### Reference A: BYU-PRISM USTAR Artificial Lift
* **Repository URL:** [https://github.com/BYU-PRISM/USTAR-Artificial-Lift](https://github.com/BYU-PRISM/USTAR-Artificial-Lift)
* **License:** Open Academic / Permissive Research License (Brigham Young University PRISM Group)
* **Core Purpose:** Analytical sucker-rod-pump simulation, dynamic rod-string modeling, fluid-height estimation, Moving Horizon Estimation (MHE), and Model Predictive Control (MPC) for artificial lift.
* **What We Studied:**
  - Angular harmonic kinematic relationships: $\omega = \frac{2\pi \cdot \text{SPM}}{60}$, (\theta) = \frac{S}{2}\omega \sin\theta$, (\theta) = \frac{S}{2}\omega^2 \cos\theta$.
  - Relationship between pump intake pressure ({pip}$), flowing bottomhole pressure ({wf}$), and dynamic submerged fluid column height ({fluid}$).
  - Multi-step receding horizon optimization formulation.
* **What We Implemented:**
  - Deterministic harmonic kinematic solver in ackend/app/physics/srp.py.
  - Dynamic fluid level estimation coupled to reservoir drawdown in ackend/app/physics/wellbore.py.
  - Multi-objective constrained receding horizon optimizer in ackend/app/optimization/joint_optimizer.py.
* **What We Did NOT Copy / Kept Different:**
  - Full Partial Differential Equation (PDE) wave simulation in Modelica/Simulink was omitted in favor of a fast Python-native analytical reduced-order solver to maintain < 2 second API response times.
  - Coupled reservoir thermal steam diffusion (CSS) is absent in USTAR, whereas it is the central driving force in our twin.

---

### Reference B & B1: Vamsee Achanta digitalmodel
* **Repository URL:** [https://github.com/vamseeachanta/digitalmodel](https://github.com/vamseeachanta/digitalmodel)
* **License:** MIT License
* **Core Purpose:** Comprehensive digital engineering suite covering API RP 11L correlations, Gibbs wave equation transformation, surface-to-downhole dynacard analysis, card work integration, and operating setting rules.
* **What We Studied:**
  - API RP 11L structural load equations (Mills acceleration factor $\alpha = \frac{S \cdot \text{SPM}^2}{70500}$, Buoyant Rod Weight {rf}$, Fluid Load $).
  - Closed-loop polygon area integration (Shoelace / Green's theorem) to compute Card Area (in$\cdot and kJ).
  - Polished Rod Horsepower (PRHP) calculation: $\text{PRHP} = \frac{\text{Area}_{\text{in}\cdot\text{lb}} \times \text{SPM}}{396000}$.
  - Fillage ratio diagnostics and downhole pump stroke loss.
* **What We Implemented:**
  - Numerical polygon Shoelace integration for Dynacard area and PRHP in ackend/app/physics/dynacard.py.
  - API RP 11L structural load baseline with heavy-oil Couette viscous shear amplification in ackend/app/physics/srp.py.
  - Dynacard Diagnostic Archetype Classifier (NORMAL FULL PUMP, ROD_FLOATING / SEVERE DRAG, FLUID POUND, EXCESSIVE VISCOUS DAMPING, HIGH STRESS / OVERLOAD).
* **What We Did NOT Copy / Kept Different:**
  - Full numeric Fourier-series Gibbs wave inversion was replaced with a calibrated downhole plunger load-transfer model to guarantee real-time performance for interactive multi-well hackathon demonstrations.

---

### Reference C: vkopey/PU
* **Repository URL:** [https://github.com/vkopey/PU](https://github.com/vkopey/PU)
* **License:** Open Source Research
* **Core Purpose:** Sucker-rod pump modeling and simulation in Python, Modelica, and MapleSim.
* **What We Studied:**
  - Modular state machine architecture and standard petroleum engineering parameter conventions.
  - Separation of kinematics, hydraulic pump valve events, and motor drive efficiency.
* **What We Implemented:**
  - Python-native modular subsystem architecture (
eservoir.py, wellbore.py, srp.py, dynacard.py) with strict SI and field unit conversions (core/units.py).
* **What We Did NOT Copy / Kept Different:**
  - Modelica and MapleSim runtime dependencies were rejected to preserve lightweight, 100% offline-ready Python execution without external compiler runtimes.

---

### Reference D: Predictive Oil-Well Diagnostics (bdoelsayed2016)
* **Repository URL:** [https://github.com/abdoelsayed2016/Developing-Predictive-Oil-Well-Diagnostics-Based-on-Intelligent-Algorithms](https://github.com/abdoelsayed2016/Developing-Predictive-Oil-Well-Diagnostics-Based-on-Intelligent-Algorithms)
* **License:** MIT License
* **Core Purpose:** Intelligent diagnostics and predictive maintenance for beam pumping systems using machine learning algorithms.
* **What We Studied:**
  - Feature extraction from dynamometer card geometries (peak loads, minimum loads, load delta, cycle rates).
  - Multi-class fault classification pipelines (normal, underfilled, gas locked, mechanical friction).
* **What We Implemented:**
  - Hybrid Physics-Informed ML Architecture in ackend/app/ml/registry.py where physical indicators (shear drag margin, fatigue index, uplift force) blend with trained scikit-learn/XGBoost models to prevent unphysical extrapolation.

---

## 2. Scientific Literature & Standards References

1. **American Petroleum Institute (API):** *API RP 11L — Recommended Practice for Design Calculations for Sucker Rod Pumping Systems*, 5th Edition.
2. **SPE Research on Scaled Load Ratios:** *Prediction of Sucker Rod Pump Failures Using Scaled Load Ratios and Machine Learning*, SPE Artificial Lift Conference.
   - Core Formulation: $\text{SLR} = \frac{\text{PPRL} - \text{MPRL}}{W_{rf}}$. Normal baseline operating range: .45 \le \text{SLR} \le 0.85$.
3. **Baghewala Heavy Oil Rheology:** *ONGC / DGH Technical Reports on Bikaner-Nagaur Basin Heavy Crude (17.5° API, 8000–12000 cP at 38°C formation temperature)*.
4. **Marx-Langenheim / Boberg-Lantz Thermal Models:** Reservoir steam chamber heat balance, thermal front expansion, and exponential conductive heat loss.
