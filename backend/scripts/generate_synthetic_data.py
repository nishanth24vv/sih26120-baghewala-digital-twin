"""
Synthetic Data Generator for Baghewala Heavy-Oil Field Digital Twin.
Generates 15 realistic heavy-oil wells with 365 days of coupled historical time-series,
CSS cycles, SRP kinematics, realistic noise, and correlated failure events.
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
import numpy as np
import pandas as pd

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings, SYNTHETIC_DATA_DIR, BASELINE_DATA_DIR
from app.core.database import SessionLocal, init_db
from app.models.db_models import (
    Well, ProductionRecord, CSSCycle, SRPOperation, FailureRecord, SensorReading, AlertRecord
)
from app.physics.reservoir import calculate_oil_viscosity, calculate_steam_heating, calculate_inflow_production
from app.physics.wellbore import calculate_wellbore_state
from app.physics.srp import calculate_srp_mechanics

def generate_field_dataset():
    print("Initializing Database & Tables...")
    init_db()
    db = SessionLocal()

    # Clear existing data
    db.query(AlertRecord).delete()
    db.query(FailureRecord).delete()
    db.query(SensorReading).delete()
    db.query(SRPOperation).delete()
    db.query(CSSCycle).delete()
    db.query(ProductionRecord).delete()
    db.query(Well).delete()
    db.commit()

    print("Generating Wells & Multi-Physics Historical Time-Series...")

    well_configs = [
        {"id": "BGW-001", "name": "Baghewala-01 (Pad A)", "scenario": "COOLING_RESERVOIR", "status": "ACTIVE", "base_temp": 38.0, "spm": 4.2, "stroke": 72.0, "vfd": 42.0, "steam_v": 80.0, "inj_p": 18.0, "soak_t": 72.0},
        {"id": "BGW-002", "name": "Baghewala-02 (Pad A)", "scenario": "HIGH_SOR", "status": "ACTIVE", "base_temp": 38.0, "spm": 3.6, "stroke": 84.0, "vfd": 36.0, "steam_v": 150.0, "inj_p": 24.0, "soak_t": 96.0},
        {"id": "BGW-003", "name": "Baghewala-03 (Pad A)", "scenario": "NORMAL_WELL", "status": "ACTIVE", "base_temp": 39.0, "spm": 3.5, "stroke": 72.0, "vfd": 35.0, "steam_v": 90.0, "inj_p": 19.0, "soak_t": 72.0},
        {"id": "BGW-004", "name": "Baghewala-04 (Pad B)", "scenario": "HIGH_ROD_LOAD", "status": "ACTIVE", "base_temp": 37.0, "spm": 4.8, "stroke": 120.0, "vfd": 48.0, "steam_v": 95.0, "inj_p": 20.0, "soak_t": 72.0},
        {"id": "BGW-005", "name": "Baghewala-05 (Pad B)", "scenario": "PUMP_UNSETTING", "status": "ACTIVE", "base_temp": 38.0, "spm": 4.4, "stroke": 72.0, "vfd": 44.0, "steam_v": 85.0, "inj_p": 18.0, "soak_t": 60.0},
        {"id": "BGW-006", "name": "Baghewala-06 (Pad B)", "scenario": "PRODUCTION_DECLINE", "status": "ACTIVE", "base_temp": 38.0, "spm": 2.8, "stroke": 64.0, "vfd": 28.0, "steam_v": 75.0, "inj_p": 17.0, "soak_t": 72.0},
        {"id": "BGW-007", "name": "Baghewala-07 (Pad C)", "scenario": "NORMAL_WELL", "status": "ACTIVE", "base_temp": 39.0, "spm": 3.7, "stroke": 72.0, "vfd": 37.0, "steam_v": 88.0, "inj_p": 18.5, "soak_t": 72.0},
        {"id": "BGW-008", "name": "Baghewala-08 (Pad C)", "scenario": "ENERGY_INEFFICIENCY", "status": "ACTIVE", "base_temp": 38.0, "spm": 5.0, "stroke": 84.0, "vfd": 50.0, "steam_v": 110.0, "inj_p": 22.0, "soak_t": 84.0},
        {"id": "BGW-009", "name": "Baghewala-09 (Pad C)", "scenario": "NORMAL_WELL", "status": "ACTIVE", "base_temp": 38.0, "spm": 3.4, "stroke": 72.0, "vfd": 34.0, "steam_v": 85.0, "inj_p": 18.0, "soak_t": 72.0},
        {"id": "BGW-010", "name": "Baghewala-10 (Pad D)", "scenario": "HIGH_VISCOSITY", "status": "ACTIVE", "base_temp": 36.0, "spm": 4.0, "stroke": 72.0, "vfd": 40.0, "steam_v": 65.0, "inj_p": 16.0, "soak_t": 48.0},
        {"id": "BGW-011", "name": "Baghewala-11 (Pad D)", "scenario": "NORMAL_WELL", "status": "ACTIVE", "base_temp": 39.0, "spm": 3.6, "stroke": 72.0, "vfd": 36.0, "steam_v": 90.0, "inj_p": 19.0, "soak_t": 72.0},
        {"id": "BGW-012", "name": "Baghewala-12 (Pad D)", "scenario": "NORMAL_WELL", "status": "ACTIVE", "base_temp": 38.0, "spm": 3.5, "stroke": 72.0, "vfd": 35.0, "steam_v": 92.0, "inj_p": 19.0, "soak_t": 72.0},
        {"id": "BGW-013", "name": "Baghewala-13 (Pad E)", "scenario": "COOLING_RESERVOIR", "status": "ACTIVE", "base_temp": 38.0, "spm": 4.1, "stroke": 72.0, "vfd": 41.0, "steam_v": 78.0, "inj_p": 17.5, "soak_t": 66.0},
        {"id": "BGW-014", "name": "Baghewala-14 (Pad E)", "scenario": "NORMAL_WELL", "status": "ACTIVE", "base_temp": 39.0, "spm": 3.7, "stroke": 84.0, "vfd": 37.0, "steam_v": 88.0, "inj_p": 18.0, "soak_t": 72.0},
        {"id": "BGW-015", "name": "Baghewala-15 (Pad E)", "scenario": "NORMAL_WELL", "status": "ACTIVE", "base_temp": 38.0, "spm": 3.6, "stroke": 72.0, "vfd": 36.0, "steam_v": 85.0, "inj_p": 18.0, "soak_t": 72.0},
    ]

    all_prod_records = []
    all_failures = []
    
    end_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = end_date - timedelta(days=365)
    np.random.seed(42)

    for w_idx, cfg in enumerate(well_configs):
        well_id = cfg["id"]
        well = Well(
            well_id=well_id,
            name=cfg["name"],
            field="Baghewala",
            status=cfg["status"],
            scenario_type=cfg["scenario"],
            latitude=27.50 + (w_idx * 0.008),
            longitude=71.80 + ((w_idx % 4) * 0.012),
            reservoir_type="Bikaner-Nagaur Heavy Sandstone",
            completion_date=start_date - timedelta(days=120),
            reservoir_depth_m=1050.0 + (w_idx * 5.0),
            formation_thickness_m=18.5,
            permeability_md=450.0 + (w_idx * 15.0),
            porosity_pct=26.5,
            base_reservoir_pressure_bar=75.0,
            fracture_pressure_bar=38.0,
            tubing_id_in=2.992,
            rod_diameter_in=1.0,
            pump_bore_in=2.25
        )

        cycle_len_days = 91
        latest_state = {}

        for cycle_num in range(1, 5):
            cycle_start = start_date + timedelta(days=(cycle_num - 1) * cycle_len_days)
            inj_days = 4
            soak_days = 3
            prod_days = cycle_len_days - inj_days - soak_days

            inj_start = cycle_start
            inj_end = inj_start + timedelta(days=inj_days)
            soak_start = inj_end
            soak_end = soak_start + timedelta(days=soak_days)
            prod_start = soak_end
            prod_end = cycle_start + timedelta(days=cycle_len_days)

            steam_vol = cfg["steam_v"] * (1.0 + np.random.uniform(-0.06, 0.06))
            inj_press = cfg["inj_p"] * (1.0 + np.random.uniform(-0.04, 0.04))
            soak_time = cfg["soak_t"]

            peak_t, h_radius, h_state = calculate_steam_heating(
                steam_vol, inj_press, soak_time, cfg["base_temp"]
            )

            cycle_cum_oil = 0.0
            cycle_cum_energy = 0.0

            for d in range(prod_days):
                curr_time = prod_start + timedelta(days=d)
                if curr_time > end_date:
                    break

                decay_rate = 0.022
                if cfg["scenario"] == "COOLING_RESERVOIR" and (cycle_num == 4 or (cycle_num == 2 and d > 40)):
                    decay_rate = 0.038
                elif cfg["scenario"] == "HIGH_VISCOSITY":
                    decay_rate = 0.032

                temp_c = cfg["base_temp"] + (peak_t - cfg["base_temp"]) * np.exp(-decay_rate * d)
                # Sensor measurement noise
                temp_c += np.random.normal(0, 0.8)
                viscosity_cp = calculate_oil_viscosity(temp_c)

                # Inflow
                oil_base, water_base, mobility = calculate_inflow_production(
                    reservoir_pressure_bar=75.0 - (cycle_num * 1.5),
                    flowing_bottomhole_pressure_bar=18.0,
                    temp_c=temp_c,
                    permeability_md=well.permeability_md
                )
                # Sensor/flow noise
                oil_rate = max(oil_base + np.random.normal(0, 1.2), 3.0)
                water_rate = max(water_base + np.random.normal(0, 0.6), 1.0)

                spm_val = cfg["spm"] + np.random.normal(0, 0.08)
                stroke_val = cfg["stroke"]
                vfd_val = cfg["vfd"]

                pwf, ppip, f_level, wb_temp, wb_visc = calculate_wellbore_state(
                    reservoir_pressure_bar=70.0,
                    reservoir_temp_c=temp_c,
                    oil_rate_bopd=oil_rate,
                    water_rate_bwpd=water_rate
                )

                srp_res = calculate_srp_mechanics(
                    stroke_length_in=stroke_val,
                    spm=spm_val,
                    vfd_frequency_hz=vfd_val,
                    wellbore_viscosity_cp=wb_visc,
                    oil_rate_bopd=oil_rate,
                    water_rate_bwpd=water_rate
                )

                cycle_cum_oil += oil_rate
                cycle_cum_energy += srp_res["energy_consumption"] * oil_rate

                # Drag ratio & Floating risk
                drag_ratio = srp_res["dynamic_viscous_drag_kn"] / max(srp_res["buoyant_rod_weight_kn"], 1.0)
                mprl_deficit = max(14.0 - srp_res["mprl_kn"], 0.0) / 14.0
                floating_risk = float(np.clip((drag_ratio * 0.60) + (mprl_deficit * 0.40) + np.random.normal(0, 0.02), 0.05, 0.95))

                stress_risk = max(srp_res["rod_stress_ratio"] - 0.65, 0.0) / 0.35
                failure_risk = float(np.clip((stress_risk * 0.35) + (floating_risk * 0.65) + np.random.normal(0, 0.02), 0.03, 0.92))
                
                unsetting_risk = float(np.clip((srp_res["pump_load_kn"] / 35.0) * (srp_res["pump_efficiency"] / 100.0) * 0.4 + np.random.normal(0, 0.02), 0.02, 0.70))

                prod_rec = ProductionRecord(
                    well_id=well_id,
                    timestamp=curr_time,
                    oil_rate=round(oil_rate, 2),
                    water_rate=round(water_rate, 2),
                    fluid_rate=round(oil_rate + water_rate, 2),
                    pressure=round(pwf, 2),
                    temperature=round(temp_c, 1),
                    viscosity=round(viscosity_cp, 1),
                    sor=round(steam_vol / max(oil_rate, 1.0), 2),
                    energy_kwh=round(srp_res["energy_consumption"], 1)
                )
                db.add(prod_rec)
                all_prod_records.append({
                    "well_id": well_id,
                    "timestamp": curr_time,
                    "temperature": temp_c,
                    "pressure": pwf,
                    "viscosity": viscosity_cp,
                    "oil_rate": oil_rate,
                    "water_rate": water_rate,
                    "spm": spm_val,
                    "stroke": stroke_val,
                    "vfd": vfd_val,
                    "pprl": srp_res["pprl_kn"],
                    "mprl": srp_res["mprl_kn"],
                    "rod_load": srp_res["rod_load_kn"],
                    "pump_load": srp_res["pump_load_kn"],
                    "floating_risk": floating_risk,
                    "failure_risk": failure_risk,
                    "unsetting_risk": unsetting_risk,
                    "sor": steam_vol / max(oil_rate, 1.0),
                    "energy": srp_res["energy_consumption"]
                })

                srp_rec = SRPOperation(
                    well_id=well_id,
                    timestamp=curr_time,
                    stroke_length=stroke_val,
                    spm=round(spm_val, 2),
                    vfd_frequency=vfd_val,
                    pprl=srp_res["pprl_kn"],
                    mprl=srp_res["mprl_kn"],
                    pump_load=srp_res["pump_load_kn"],
                    rod_load=srp_res["rod_load_kn"],
                    rod_stress_ratio=srp_res["rod_stress_ratio"],
                    pump_efficiency=srp_res["pump_efficiency"],
                    fluid_level=round(f_level, 1)
                )
                db.add(srp_rec)

                sensor_rec = SensorReading(
                    well_id=well_id,
                    timestamp=curr_time,
                    temperature=round(temp_c, 1),
                    pressure=round(pwf, 2),
                    viscosity=round(viscosity_cp, 1),
                    rod_load=srp_res["rod_load_kn"],
                    pump_load=srp_res["pump_load_kn"],
                    oil_rate=round(oil_rate, 2),
                    water_rate=round(water_rate, 2),
                    vfd=vfd_val,
                    spm=round(spm_val, 2),
                    stroke=stroke_val,
                    floating_risk=round(floating_risk, 3),
                    failure_risk=round(failure_risk, 3)
                )
                db.add(sensor_rec)

                if floating_risk > 0.80 and np.random.random() < 0.04 and len(all_failures) < 15:
                    fail_rec = FailureRecord(
                        well_id=well_id,
                        timestamp=curr_time,
                        failure_type="ROD_FLOATING",
                        severity="HIGH",
                        operating_hours=float(d * 24),
                        description=f"Severe downstroke viscous drag ({srp_res['dynamic_viscous_drag_kn']} kN) caused rod float hazard.",
                        contributing_factors={"viscosity_cp": viscosity_cp, "spm": spm_val, "drag_kn": srp_res["dynamic_viscous_drag_kn"]}
                    )
                    db.add(fail_rec)
                    all_failures.append(fail_rec)

                latest_state = {
                    "oil_rate": oil_rate,
                    "water_rate": water_rate,
                    "temp": temp_c,
                    "press": pwf,
                    "visc": viscosity_cp,
                    "sor": steam_vol / max(oil_rate, 1.0),
                    "energy": srp_res["energy_consumption"],
                    "stroke": stroke_val,
                    "spm": spm_val,
                    "vfd": vfd_val,
                    "pump_eff": srp_res["pump_efficiency"],
                    "rod_load": srp_res["rod_load_kn"],
                    "floating_risk": floating_risk,
                    "failure_risk": failure_risk,
                    "unsetting_risk": unsetting_risk
                }

            css_rec = CSSCycle(
                well_id=well_id,
                cycle_number=cycle_num,
                start_date=cycle_start,
                injection_start=inj_start,
                injection_end=inj_end,
                soak_start=soak_start,
                soak_end=soak_end,
                production_start=prod_start,
                production_end=prod_end,
                steam_volume=round(steam_vol, 1),
                injection_pressure=round(inj_press, 1),
                soak_time=round(soak_time, 1),
                production_cutoff=round(float(prod_days), 1),
                oil_recovery=round(cycle_cum_oil, 1),
                sor=round(steam_vol / max(cycle_cum_oil / prod_days, 1.0), 2),
                energy_consumption=round(cycle_cum_energy / max(cycle_cum_oil, 1.0), 1),
                peak_temperature=round(peak_t, 1)
            )
            db.add(css_rec)

        well.current_oil_rate = round(latest_state["oil_rate"], 1)
        well.current_water_rate = round(latest_state["water_rate"], 1)
        well.current_temperature = round(latest_state["temp"], 1)
        well.current_pressure = round(latest_state["press"], 1)
        well.current_viscosity = round(latest_state["visc"], 1)
        well.current_sor = round(latest_state["sor"], 2)
        well.current_energy = round(latest_state["energy"], 1)
        well.current_stroke = round(latest_state["stroke"], 1)
        well.current_spm = round(latest_state["spm"], 2)
        well.current_vfd = round(latest_state["vfd"], 1)
        well.current_pump_eff = round(latest_state["pump_eff"], 1)
        well.current_rod_load = round(latest_state["rod_load"], 1)
        well.current_floating_risk = round(latest_state["floating_risk"], 3)
        well.current_failure_risk = round(latest_state["failure_risk"], 3)
        well.current_unsetting_risk = round(latest_state["unsetting_risk"], 3)

        db.add(well)

    alert_1 = AlertRecord(
        alert_id="ALT-BGW001-01",
        well_id="BGW-001",
        timestamp=end_date,
        severity="HIGH",
        parameter="rod_floating",
        value=78.0,
        threshold=60.0,
        unit="%",
        title="High Rod-Floating Risk Detected",
        message="Reservoir cooling to 54.2°C increased crude viscosity to 1,280 cP. Downstroke viscous drag is 28.4 kN, causing severe rod float hazard.",
        recommended_action="Reduce SPM from 4.2 to 3.7 or initiate cycle 5 steam stimulation to restore thermal mobility."
    )
    alert_2 = AlertRecord(
        alert_id="ALT-BGW004-01",
        well_id="BGW-004",
        timestamp=end_date - timedelta(hours=3),
        severity="HIGH",
        parameter="rod_load",
        value=118.5,
        threshold=110.0,
        unit="kN",
        title="Peak Polished Rod Overload",
        message="High stroke (120 in) at 4.8 SPM created peak rod stress exceeding 85% of Grade D sucker rod yield strength.",
        recommended_action="Reduce SPM to 3.8 and lower VFD frequency."
    )
    db.add(alert_1)
    db.add(alert_2)

    db.commit()
    db.close()

    df = pd.DataFrame(all_prod_records)
    csv_path = SYNTHETIC_DATA_DIR / "production_time_series.csv"
    df.to_csv(csv_path, index=False)
    
    # Save baseline copy for instant demo reset
    baseline_csv = BASELINE_DATA_DIR / "production_time_series.csv"
    df.to_csv(baseline_csv, index=False)
    print(f"Generated {len(df)} time-series records across 15 wells -> {csv_path}")

if __name__ == "__main__":
    generate_field_dataset()
