# AI-Enabled Well-to-Surface Digital Twin for Baghewala Heavy-Oil Field
### Smart India Hackathon Prototype — SIH 26120

> **An AI-powered Well-to-Surface Digital Twin that continuously connects reservoir behavior, wellbore conditions, and SRP performance to predict production and operational risks, jointly optimize CSS and SRP parameters, and provide explainable recommendations for safer, more efficient heavy-oil production.**

---

## 1. System Architecture

```text
                       DATA SOURCES (15 Wells, 365 Days)
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
      Historical Telemetry       CSS Records            SRP Sensors
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                      ▼
                           DATA INGESTION & DB (SQLite)
                                      │
                                      ▼
                        DIGITAL TWIN STATE MANAGER
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
      RESERVOIR SUBSYSTEM     WELLBORE HYDRAULICS      SURFACE SRP MECHANICS
    • In-Situ Temperature    • Flowing BHP (Pwf)      • Polished Rod Stroke
    • Andrade Viscosity      • Pump Intake (Ppip)     • Cadence (SPM) & VFD
    • Mobility (k/μ)         • Fluid Level            • Viscous Shear Drag
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                      ▼
                          PREDICTION & RISK ENGINE
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
      PRODUCTION FORECAST     THERMAL DECAY CURVE     MECHANICAL RISK MODELS
     (Gradient Boosting)       (Random Forest)        • Rod Floating Classifier
                                                      • 30-Day Failure (XGBoost)
                                                      • Pump Unsetting Estimator
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                      ▼
                        JOINT CONSTRAINED OPTIMIZER
                   (7-Dimensional Multi-Objective Search)
                                      │
                                      ▼
                           AI EXPLAINABLE PROPOSAL
                                      │
                                      ▼
                        SUPERVISORY OPERATOR REVIEW
                                      │
                                      ▼
                    APPROVAL & TWIN STATE SYNCHRONIZATION
```

---

## 2. Key Domain Innovations

### The Core Problem Solved
In the Baghewala heavy-oil field (~17.5° API, native viscosity ~8,500 cP at 38°C), **Cyclic Steam Stimulation (CSS)** and **Sucker Rod Pumping (SRP)** are traditionally operated in silos. 

Because steam heating exponentially reduces crude viscosity ($\mu(T) = \mu_0 \exp(B / (T + 273.15))$), reservoir thermal decay directly governs crude inflow, annular viscous shear drag on the sucker rod string, and pump efficiency. High downstroke viscous drag in cooling crude causes **severe rod floating**, compression buckling, carrier bar separation, and catastrophic shock failures.

This platform bridges the disciplines into a **single coupled Digital Twin**:
$$\text{Steam Injection } (V_s, P_{inj}) \longrightarrow \text{Reservoir Thermal State } T(t) \longrightarrow \text{In-Situ Viscosity } \mu(T) \longrightarrow \text{Inflow Mobility } (k/\mu) \longrightarrow \text{Dynamic Drag } F_{drag} \longrightarrow \text{Rod Floating & Mechanical Stress} \longrightarrow \text{Joint CSS + SRP Optimization}$$

---

## 3. Technology Stack

* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (Industrial Dark Theme), Recharts, Lucide Icons.
* **Backend**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy, Uvicorn, WebSockets.
* **Physics Engine**: Andrade Heavy-Crude Viscosity, Darcy/Vogel Heavy Oil IPR, Multi-phase Wellbore Hydraulics, Sucker Rod Harmonic Kinematics & Dynamic Viscous Shear Drag.
* **Machine Learning**: Scikit-Learn (Gradient Boosting, Random Forest, Logistic Regression), XGBoost, Joblib.
* **Database**: SQLite (100% Offline-ready local database with baseline seed generator).

---

## 4. Quick Startup (100% Offline-Ready)

### One-Click Launch (Windows)
Double-click `run_demo.bat` or run:
```powershell
.\run_demo.ps1
```

### Manual Step-by-Step Launch

#### 1. Backend Setup & Startup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Generate 15-well synthetic historical time-series and train ML models
python scripts/generate_synthetic_data.py
python scripts/train_models.py

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup & Startup
```bash
cd frontend
npm install
npm run dev
```

* **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
* **Backend Swagger API**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **System Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 5. Live Judging Demonstration Flow (11 Steps)

Click the **"START JUDGING DEMO"** button in the top navigation bar to enable guided stepper prompts:

| Step | Page | Action & Key Talking Point |
| :--- | :--- | :--- |
| **01** | **Overview** | Observe field fleet of 15 wells. Identify `BGW-001` flagged as High Risk (78% Rod Floating Hazard). |
| **02** | **Well Explorer** | Select `BGW-001`. Filter by scenarios and risk bands. |
| **03** | **Digital Twin** | Inspect the central **Interactive Causal Schematic**. Click on Reservoir, Wellbore, and SRP nodes to view coupled parameters. |
| **04** | **AI & Predictions** | View multi-month forward forecast showing reservoir cooling curve (54.2°C) and corresponding production decline. |
| **05** | **Risk Center** | Examine **Rod Floating Risk (78% HIGH)** and contributing factor breakdown (28.4 kN viscous drag). |
| **06** | **Joint Optimizer** | *(Primary Judging Screen)* Click **"GENERATE OPTIMAL WELL PLAN"**. Watch the authentic 11-stage search animation. |
| **07** | **AI Explainability** | Review dynamic natural-language rationale explaining *why* reducing SPM from 4.2 to 3.7 eliminates downstroke rod floating. |
| **08** | **Before vs After** | Review comparative deltas: **+25% Oil Production**, **-67% Rod Floating Risk**, **-22% SOR**, and **-11% Energy**. |
| **09** | **Simulation Sandbox** | Adjust CSS & SRP sliders to run what-if simulations without mutating base database state. |
| **10** | **Approve Recommendation**| Click **"APPROVE & APPLY TO DIGITAL TWIN"**. Verify state update and check persistent Audit Trail. |
| **11** | **Live Monitoring** | Open real-time SCADA feed. View live updating dynacard loop and test the **Anomaly Injector** (e.g. Temperature Drop). |

---

## 6. Trained ML Models & Empirical Test Metrics

All metrics evaluated on held-out temporal test dataset (zero data leakage):

* **Production Rate Predictor** (`GradientBoostingRegressor`): $R^2 = 0.9994$, $\text{MAE} = 0.226\text{ BOPD}$, $\text{RMSE} = 0.282$
* **Reservoir Thermal Decay Model** (`RandomForestRegressor`): $R^2 = 0.9988$, $\text{MAE} = 0.620^\circ\text{C}$, $\text{RMSE} = 0.850$
* **Rod Floating Risk Classifier** (`RandomForestClassifier`): $\text{Precision} = 0.883$, $\text{Recall} = 0.616$, $\text{ROC-AUC} = 0.941$
* **30-Day Rod String Failure Predictor** (`XGBClassifier`): $\text{Precision} = 0.578$, $\text{Recall} = 0.356$, $\text{ROC-AUC} = 0.543$
* **Downhole Pump Unsetting Risk Estimator** (`LogisticRegression`): $\text{Precision} = 0.455$, $\text{ROC-AUC} = 0.545$

---

## 7. Testing & Verification

Run the automated backend test suite:
```bash
backend\venv\Scripts\pytest -v
```
* **Physics Tests**: Validates Andrade viscosity calculation, thermal diffusion, and dynamic viscous drag.
* **Optimizer Tests**: Validates multi-objective candidate ranking and strict hard constraint rejection.
* **API Tests**: Validates all FastAPI REST endpoints using TestClient.

---

## 8. Limitations & Future Scope
* **Scope**: Built as an advanced decision-support digital twin for hackathon demonstration, not an autonomous direct-field PLC controller.
* **Future Work**: Integration with high-fidelity thermal reservoir simulators (e.g. CMG STARS) and live Modbus/OPC-UA field telemetry gateways.
