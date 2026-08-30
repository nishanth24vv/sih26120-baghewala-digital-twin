import {
  WellSummary, DigitalTwinState, CSSPredictResponse,
  SRPPredictResponse, OptimizeResponse, AlertItem,
  AuditItem, ModelMetadata, TelemetryTick
} from '../types';

const RAW_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE = RAW_BASE ? `${RAW_BASE}/api/v1` : '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errBody = await res.json();
      if (errBody.detail) errorMsg = errBody.detail;
      else if (errBody.error?.message) errorMsg = errBody.error.message;
    } catch (_) {}
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Health
  getHealth: () => fetchJson<{ status: string; models: string; database: string }>(`${API_BASE}/health`),

  // Wells
  listWells: () => fetchJson<WellSummary[]>(`${API_BASE}/wells`),
  getWellState: (wellId: string) => fetchJson<DigitalTwinState>(`${API_BASE}/wells/${wellId}/state`),
  getWellHistory: (wellId: string, days = 90) => fetchJson<any[]>(`${API_BASE}/wells/${wellId}/history?days=${days}`),
  getWellCSSCycles: (wellId: string) => fetchJson<any[]>(`${API_BASE}/wells/${wellId}/css-cycles`),
  getWellFailures: (wellId: string) => fetchJson<any[]>(`${API_BASE}/wells/${wellId}/failures`),
  resetDemoData: () => fetchJson<{ status: string; message: string }>(`${API_BASE}/wells/demo/reset`, { method: 'POST' }),

  // CSS Simulation & Prediction
  predictCSS: (payload: {
    well_id: string;
    steam_volume: number;
    injection_pressure: number;
    soak_time: number;
    production_cutoff: number;
  }) => fetchJson<CSSPredictResponse>(`${API_BASE}/css/predict`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // SRP Simulation & Prediction
  predictSRP: (payload: {
    well_id: string;
    stroke_length: number;
    spm: number;
    vfd_frequency: number;
    wellbore_viscosity_override?: number;
  }) => fetchJson<SRPPredictResponse>(`${API_BASE}/srp/predict`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Forecasts & Predictions
  getForecasts: (wellId: string, horizonDays = 60) =>
    fetchJson<{
      well_id: string;
      horizon_days: number;
      production_forecast: Array<{ day: number; value: number; lower_bound: number; upper_bound: number }>;
      temperature_forecast: Array<{ day: number; value: number; lower_bound: number; upper_bound: number }>;
      viscosity_forecast: Array<{ day: number; value: number; lower_bound: number; upper_bound: number }>;
    }>(`${API_BASE}/predictions/${wellId}/forecast?horizon_days=${horizonDays}`),

  // Risks
  getRisks: (wellId: string) => fetchJson<any>(`${API_BASE}/risks/${wellId}`),

  // Joint Optimization
  optimizeJoint: (payload: {
    well_id: string;
    objective_weights?: Record<string, number>;
    grid_density?: string;
  }) => fetchJson<OptimizeResponse>(`${API_BASE}/optimize`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Sandbox Simulation
  simulateTwin: (payload: {
    well_id: string;
    steam_volume: number;
    injection_pressure: number;
    soak_time: number;
    production_cutoff: number;
    stroke_length: number;
    spm: number;
    vfd_frequency: number;
    temperature_override?: number;
  }) => fetchJson<DigitalTwinState>(`${API_BASE}/simulate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Operator Approvals & Audit Trail
  approveRecommendation: (payload: {
    well_id: string;
    optimization_id?: string;
    operator_name: string;
    action: string;
    previous_parameters: Record<string, any>;
    recommended_parameters: Record<string, any>;
    final_approved_parameters: Record<string, any>;
    reason: string;
  }) => fetchJson<{ status: string; message: string; updated_twin_state: DigitalTwinState }>(
    `${API_BASE}/approvals/approve`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  ),

  getAuditLog: () => fetchJson<AuditItem[]>(`${API_BASE}/approvals/audit-log`),

  // Alerts
  listAlerts: () => fetchJson<AlertItem[]>(`${API_BASE}/alerts`),
  acknowledgeAlert: (alertId: string) =>
    fetchJson<{ status: string; alert_id: string }>(`${API_BASE}/alerts/${alertId}/acknowledge`, {
      method: 'POST',
    }),

  // Model Metadata
  getModelPerformance: () => fetchJson<ModelMetadata>(`${API_BASE}/models/performance`),

  // Anomaly Injection
  injectAnomaly: (wellId: string, anomalyType: string) =>
    fetchJson<{ status: string; well_id: string; anomaly: string; message: string }>(
      `${API_BASE}/telemetry/${wellId}/inject-anomaly`,
      {
        method: 'POST',
        body: JSON.stringify({ anomaly_type: anomalyType }),
      }
    ),

  clearAnomaly: (wellId: string) =>
    fetchJson<{ status: string; well_id: string }>(`${API_BASE}/telemetry/${wellId}/clear-anomaly`, {
      method: 'POST',
    }),
};
