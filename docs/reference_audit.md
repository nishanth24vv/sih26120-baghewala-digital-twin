# Technical Reference Matrix & Subsystem Audit

**Project:** SIH 26120 — Baghewala Heavy-Oil Well-to-Surface Digital Twin  
**Date:** August 2026

---

## 1. Technical Reference Matrix

| Subsystem | Reference | Relevant Open-Source Method | Current Implementation | Technical Gap Identified | Implemented Improvement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SRP Kinematics** | BYU-PRISM USTAR | Harmonic crank angle $\\omega = 2\\pi N/60$, displacement (\\theta)$, velocity (\\theta)$, acceleration (\\theta)$ | Constant average velocity assumption | Ignored peak downstroke acceleration & dynamic inertia | Full harmonic kinematic solver calculating peak velocity ({peak} = \\pi S N/60$) and acceleration ({peak} = \\frac{S}{2}\\omega^2$) in srp.py. |
| **Annular Fluid Level** | BYU-PRISM USTAR | Dynamic submerged head {fluid} = (P_{wf} - P_{casing})/(\\rho_f g)$ | Fixed static fluid level table | Inflow drawdown did not dynamically alter pump intake pressure | Dynamic fluid column calculation in wellbore.py coupled to reservoir Darcy inflow and drawdown. |
| **Dynacard Area & Work** | digitalmodel | Shoelace closed polygon area $\\oint L \\, dx$, Polished Rod HP ($) | Approximate bounding rectangle | Did not calculate exact work per stroke or motor power | Numerical polygon Shoelace integration in dynacard.py returning Card Area in kJ and in-lbf, plus PRHP (kW/HP). |
| **Dynacard Diagnostics** | digitalmodel | Multi-archetype library (fluid pound, gas interference, floating) | Single static dynacard shape | Lacked diagnostic pattern classification and fillage ratio | 6 distinct diagnostic archetypes with effective pump fillage % and diagnosis explanation strings. |
| **Structural Loading** | API RP 11L | Mills acceleration factor $\\alpha = \\frac{S N^2}{70500}$, Buoyant weight {rf}$, Fluid load $ | Empirical linear fit | Missed buoyant correction and Mills inertial amplification | Full API RP 11L formulation with .5\\times$ heavy-oil sucker rod coupling drag amplification factor. |
| **Mechanical Risk** | SPE Failure Studies | Scaled Load Ratio ( = \\frac{PPRL - MPRL}{W_{rf}}$) for fatigue screening | Unnormalized raw load delta | Unscaled loads across different well depths gave inconsistent fatigue metrics | Incorporated normalized $ into srp.py, 
egistry.py, and the predictive maintenance feature pipeline. |
| **Thermal CSS Model** | Marx-Langenheim / Boberg-Lantz | Steam chamber radius, latent heat transfer, Andrade exponential viscosity decay | Basic temperature decay | Missing coupling between thermal chamber and SRP viscous drag | Coupled thermal diffusion: Steam {inj} \\to T \\to \\mu(T) \\to F_{drag} \\to MPRL \\to \\text{Floating Risk}$. |

---

## 2. SRP Model Item Classification

Every component of our SRP subsystem was audited against the reference repositories:

| SRP Modeling Component | Classification | Technical Rationale & Implementation Details |
| :--- | :--- | :--- |
| **Crank Position $\\theta$** | **IMPLEMENTED** | Harmonic angular angle $\\theta \\in [0, 2\\pi]$ resolved in 60 discrete stroke intervals in dynacard.py. |
| **Crank Velocity (\\theta)$** | **IMPLEMENTED** | Peak velocity {peak} = \\pi \\cdot S \\cdot (SPM/60)$ used for peak Couette viscous shear force calculation. |
| **Crank Acceleration (\\theta)$** | **IMPLEMENTED** | Mills inertial factor $\\alpha = S \\cdot SPM^2 / 70500$ applied to buoyant rod mass. |
| **Polished Rod Stroke $** | **IMPLEMENTED** | Constrained continuous decision variable (\\text{ in} \\le S \\le 144\\text{ in}$). |
| **Pumping Speed (SPM)** | **IMPLEMENTED** | Constrained continuous decision variable (.5 \\le SPM \\le 6.0$). |
| **Rod String Geometry** | **IMPLEMENTED** | 1.0 inch API Grade D sucker rod string (.33\\text{ kg/m}$,  = 0.5\\text{ in}$,  = 1000\\text{ m}$). |
| **Buoyant Rod Weight {rf}$** | **IMPLEMENTED** | {rf} = W_{rod} \\cdot (1 - \\rho_{fluid}/\\rho_{steel}) \\approx 38.5\\text{ kN}$. |
| **Fluid Dynamic Viscosity $\\mu(T)$** | **IMPLEMENTED** | Temperature-dependent Andrade equation calibrated to Baghewala crude (,000\\text{ cP}$ at ^\\circ\\text{C} \\to 350\\text{ cP}$ at ^\\circ\\text{C}$). |
| **Annular Viscous Drag {drag}$** | **IMPLEMENTED** | Couette laminar shear with .5\\times$ coupling form drag factor. |
| **PPRL / MPRL Loads** | **IMPLEMENTED** | Structural API RP 11L formulation with drag directionality (+ upstroke, - downstroke). |
| **Downhole Pump Load $** | **IMPLEMENTED** | Plunger hydrostatic differential load {plunger} \\cdot \\rho_f g \\cdot H_{submerged}$. |
| **Pump Volumetric Efficiency** | **IMPLEMENTED** | Ratio of actual inflow deliverability to theoretical pump displacement (\\% - 95\\%$). |
| **Closed-Loop Dynacards** | **IMPLEMENTED** | 60-point closed polygon loops for surface polished rod and downhole pump. |
| **Card Area & PRHP** | **IMPLEMENTED** | Shoelace integration in kJ, in-lbf, and Polished Rod Horsepower (kW / HP). |
| **Scaled Load Ratio (SLR)** | **IMPLEMENTED** |  = (PPRL - MPRL) / W_{rf}$ for dynamic fatigue and rod floating screening. |
| **Full Gibbs Wave PDE Solver** | **SIMPLIFIED** | Replaced full numerical PDE solver with analytical load-transfer model to guarantee < 100ms API latency. |
| **Modelica / MapleSim Multi-body** | **NOT NEEDED FOR MVP** | Rejected external runtime dependencies; 100% Python/TypeScript stack is robust and offline-ready. |
