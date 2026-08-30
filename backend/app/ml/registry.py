"""
ML Model Registry and Inference Pipeline.
Loads serialized models from models_store/ and exposes unified prediction interfaces
with physics fallback to ensure offline resilience.
"""

import json
import warnings
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import joblib

# Suppress feature name warnings for fast numpy/dataframe prediction
warnings.filterwarnings("ignore", category=UserWarning)

from app.core.config import MODELS_DIR
from app.physics.reservoir import calculate_oil_viscosity, calculate_inflow_production
from app.physics.srp import calculate_srp_mechanics

class ModelRegistry:
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}
        self.load_models()

    def load_models(self):
        """Load all ML model artifacts and evaluation metadata."""
        meta_path = MODELS_DIR / "metadata.json"
        if meta_path.exists():
            with open(meta_path, "r") as f:
                self.metadata = json.load(f)
        
        model_files = {
            "production": "production_model.joblib",
            "thermal": "thermal_model.joblib",
            "rod_floating": "rod_floating_model.joblib",
            "rod_failure": "rod_failure_model.joblib",
            "pump_unsetting": "pump_unsetting_model.joblib"
        }

        for key, fname in model_files.items():
            fpath = MODELS_DIR / fname
            if fpath.exists():
                try:
                    self.models[key] = joblib.load(fpath)
                except Exception as e:
                    print(f"Warning: Failed to load {fname}: {e}")

    def predict_production(
        self,
        temperature: float,
        pressure: float,
        viscosity: float,
        spm: float,
        stroke: float,
        vfd: float,
        rod_load: float
    ) -> float:
        """Predict oil production rate (BOPD) using ML model with physics fallback."""
        if "production" in self.models:
            feats = pd.DataFrame([{
                "temperature": temperature,
                "pressure": pressure,
                "viscosity": viscosity,
                "spm": spm,
                "stroke": stroke,
                "vfd": vfd,
                "rod_load": rod_load
            }])
            try:
                pred = float(self.models["production"].predict(feats)[0])
                return max(round(pred, 1), 2.0)
            except Exception:
                pass
        
        # Physics fallback
        oil_rate, _, _ = calculate_inflow_production(pressure + 10.0, pressure, temperature)
        return round(oil_rate, 1)

    def predict_rod_floating_risk(
        self,
        rod_load: float,
        pump_load: float,
        spm: float,
        vfd: float,
        stroke: float,
        temperature: float,
        viscosity: float,
        oil_rate: float,
        mprl: float
    ) -> Dict[str, Any]:
        """Predict rod floating risk probability and classification."""
        # Calculate dynamic drag force
        visc_pa_s = viscosity * 0.001
        v_peak = np.pi * (stroke * 0.0254) * (spm / 60.0)
        coupling_drag_factor = 12.5
        drag_kn = (2.0 * np.pi * 0.0127 * 1000.0 * visc_pa_s * (v_peak / 0.0253) * coupling_drag_factor) / 1000.0
        buoyant_rod_kn = 38.5
        
        # Continuous physical drag ratio
        drag_ratio = drag_kn / max(buoyant_rod_kn, 1.0)
        mprl_deficit = max(14.0 - mprl, 0.0) / 14.0
        phys_prob = float(np.clip((drag_ratio * 0.60) + (mprl_deficit * 0.40), 0.05, 0.95))

        if "rod_floating" in self.models:
            feats = pd.DataFrame([{
                "rod_load": rod_load,
                "pump_load": pump_load,
                "spm": spm,
                "vfd": vfd,
                "stroke": stroke,
                "temperature": temperature,
                "viscosity": viscosity,
                "oil_rate": oil_rate,
                "mprl": mprl
            }])
            try:
                proba = self.models["rod_floating"].predict_proba(feats)
                ml_prob = float(proba[0, 1] if proba.shape[1] > 1 else proba[0, 0])
                prob = float(0.5 * phys_prob + 0.5 * ml_prob)
            except Exception:
                prob = phys_prob
        else:
            prob = phys_prob

        prob = float(np.clip(prob, 0.02, 0.98))

        if prob >= 0.80:
            level = "CRITICAL"
        elif prob >= 0.60:
            level = "HIGH"
        elif prob >= 0.30:
            level = "MEDIUM"
        else:
            level = "LOW"

        return {
            "probability": round(prob, 3),
            "level": level,
            "viscous_drag_kn": round(drag_kn, 1),
            "drag_ratio": round(drag_ratio, 2)
        }

    def predict_rod_failure_risk(
        self,
        rod_load: float,
        pprl: float,
        mprl: float,
        spm: float,
        stroke: float,
        viscosity: float,
        floating_risk: float,
        energy: float
    ) -> Dict[str, Any]:
        """
        Predict 30-day rod string failure probability.
        Incorporates Scaled Load Ratio (SLR = Load_Span / W_buoyant) from published SPE/JPT research.
        """
        # Baseline physical fatigue accumulation & Scaled Load Ratio
        buoyant_rod_kn = 38.5
        load_span_kn = max(pprl - max(mprl, 0.0), 0.1)
        scaled_load_ratio = float(load_span_kn / max(buoyant_rod_kn, 1.0))
        
        # Fatigue index scales with SLR and cycle rate (SPM), compounded by rod floating impact shock
        fatigue_index = (scaled_load_ratio * (spm / 4.0)) * (1.0 + (floating_risk * 1.5))
        phys_prob = float(np.clip(fatigue_index * 0.25, 0.04, 0.90))

        if "rod_failure" in self.models:
            feats = pd.DataFrame([{
                "rod_load": rod_load,
                "pprl": pprl,
                "mprl": mprl,
                "spm": spm,
                "stroke": stroke,
                "viscosity": viscosity,
                "floating_risk": floating_risk,
                "energy": energy
            }])
            try:
                proba = self.models["rod_failure"].predict_proba(feats)
                ml_prob = float(proba[0, 1] if proba.shape[1] > 1 else proba[0, 0])
                prob = float(0.5 * phys_prob + 0.5 * ml_prob)
            except Exception:
                prob = phys_prob
        else:
            prob = phys_prob

        prob = float(np.clip(prob, 0.02, 0.95))

        if prob >= 0.70:
            level = "CRITICAL"
        elif prob >= 0.45:
            level = "HIGH"
        elif prob >= 0.25:
            level = "MEDIUM"
        else:
            level = "LOW"

        return {
            "probability": round(prob, 3),
            "level": level,
            "scaled_load_ratio": round(scaled_load_ratio, 3),
            "fatigue_index": round(fatigue_index, 2)
        }

    def predict_pump_unsetting_risk(
        self,
        pump_load: float,
        rod_load: float,
        spm: float,
        vfd: float,
        viscosity: float,
        temperature: float,
        oil_rate: float
    ) -> Dict[str, Any]:
        """Predict pump unsetting hazard probability."""
        anchor_hold_kn = 65.0
        uplift_force_kn = pump_load * 0.35 + (viscosity * 0.005 * spm)
        phys_prob = float(np.clip(uplift_force_kn / anchor_hold_kn, 0.02, 0.85))

        if "pump_unsetting" in self.models:
            feats = pd.DataFrame([{
                "pump_load": pump_load,
                "rod_load": rod_load,
                "spm": spm,
                "vfd": vfd,
                "viscosity": viscosity,
                "temperature": temperature,
                "oil_rate": oil_rate
            }])
            try:
                proba = self.models["pump_unsetting"].predict_proba(feats)
                ml_prob = float(proba[0, 1] if proba.shape[1] > 1 else proba[0, 0])
                prob = float(0.5 * phys_prob + 0.5 * ml_prob)
            except Exception:
                prob = phys_prob
        else:
            prob = phys_prob

        prob = float(np.clip(prob, 0.01, 0.90))

        if prob >= 0.65:
            level = "CRITICAL"
        elif prob >= 0.40:
            level = "HIGH"
        elif prob >= 0.20:
            level = "MEDIUM"
        else:
            level = "LOW"

        return {
            "probability": round(prob, 3),
            "level": level,
            "uplift_force_kn": round(uplift_force_kn, 1)
        }

# Global Singleton Instance
MODEL_REGISTRY = ModelRegistry()
