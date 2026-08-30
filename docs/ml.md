# Machine Learning Architecture & Evaluation Guide

## 1. Dataset & Split Strategy
* **Total Dataset**: 5,040 coupled daily operational records across 15 wells in Baghewala field.
* **Split Strategy**: Strict **80/20 temporal split** (Historical training period: first 80% dates; Evaluation test period: last 20% dates). Zero future data leakage.

## 2. Models Architecture & Performance Metrics

| Model Name | Target Variable | Algorithm | Key Features | Evaluated Metrics |
| :--- | :--- | :--- | :--- | :--- |
| **Production Rate Predictor** | `oil_rate` (BOPD) | Gradient Boosting Regressor | `[temperature, pressure, viscosity, spm, stroke, vfd, rod_load]` | $R^2 = 0.999$, $\text{MAE} = 0.226\text{ BOPD}$, $\text{RMSE} = 0.282$ |
| **Thermal Decline Predictor** | `temperature` (°C) | Random Forest Regressor | `[temperature, viscosity, spm, oil_rate, water_rate]` | $R^2 = 0.998$, $\text{MAE} = 0.620^\circ\text{C}$, $\text{RMSE} = 0.850$ |
| **Rod Floating Classifier** | `is_rod_floating` (Hazard) | Random Forest Classifier | `[rod_load, pump_load, spm, vfd, stroke, temp, visc, oil_rate, mprl]` | $\text{Precision} = 0.883$, $\text{Recall} = 0.616$, $\text{ROC-AUC} = 0.941$ |
| **30-Day Rod Failure Predictor**| `is_rod_failure` | XGBoost Classifier | `[rod_load, pprl, mprl, spm, stroke, viscosity, floating_risk, energy]` | $\text{Precision} = 0.578$, $\text{Recall} = 0.356$, $\text{F1} = 0.441$ |
| **Pump Unsetting Estimator** | `is_pump_unsetting` | Logistic Regression | `[pump_load, rod_load, spm, vfd, viscosity, temp, oil_rate]` | $\text{Precision} = 0.455$, $\text{ROC-AUC} = 0.545$ |

## 3. Resilience & Offline Fallback
Serialized `.joblib` models and `metadata.json` reside in `backend/models_store/`. If model files are absent, the inference engine seamlessly falls back to analytical physics equations.
