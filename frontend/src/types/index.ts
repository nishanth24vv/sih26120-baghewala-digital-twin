export interface WellSummary {
  id: number;
  well_id: string;
  name: string;
  field: string;
  status: string;
  scenario_type: string;
  current_oil_rate: number;
  current_water_rate: number;
  current_temperature: number;
  current_pressure: number;
  current_viscosity: number;
  current_sor: number;
  current_energy: number;
  current_stroke: number;
  current_spm: number;
  current_vfd: number;
  current_pump_eff: number;
  current_rod_load: number;
  current_floating_risk: number;
  current_failure_risk: number;
  current_unsetting_risk: number;
}

export interface ReservoirState {
  temperature: number;
  pressure: number;
  viscosity: number;
  mobility: number;
  heating_state: number;
  cooling_rate: number;
  permeability_md: number;
  steam_chamber_radius_m: number;
}

export interface WellboreState {
  temperature: number;
  pressure: number;
  fluid_level: number;
  pump_intake_pressure: number;
  viscosity: number;
  flow_rate: number;
  gas_oil_ratio: number;
}

export interface SRPState {
  stroke_length: number;
  spm: number;
  vfd_frequency: number;
  pprl: number;
  mprl: number;
  load_span?: number;
  scaled_load_ratio?: number;
  pump_load: number;
  rod_load: number;
  rod_stress_ratio: number;
  pump_efficiency: number;
  prhp_kw?: number;
  prhp_hp?: number;
  dynamic_viscous_drag: number;
  buoyant_rod_weight: number;
}

export interface ProductionState {
  oil_rate: number;
  water_rate: number;
  fluid_rate: number;
  sor: number;
  recovery: number;
  energy_consumption: number;
  water_cut_pct?: number;
}

export interface RiskFactor {
  name: string;
  contribution: number;
  value: string;
  threshold: string;
}

export interface RiskState {
  rod_floating: number;
  rod_floating_level: string;
  rod_failure: number;
  rod_failure_level: string;
  pump_unsetting: number;
  pump_unsetting_level: string;
  impact_loading: number;
  contributing_factors?: Record<string, RiskFactor[]>;
}

export interface DigitalTwinState {
  well_id: string;
  well_name: string;
  status: string;
  scenario_type: string;
  timestamp: string;
  reservoir: ReservoirState;
  wellbore: WellboreState;
  srp: SRPState;
  production: ProductionState;
  risks: RiskState;
  current_css_cycle: number;
  days_on_production: number;
  cumulative_steam_injected_m3: number;
}

export interface DynacardPoint {
  position_in: number;
  load_kn: number;
  stroke_direction?: string;
}

export interface DynacardData {
  card_type: string;
  diagnostic_desc?: string;
  pprl_kn: number;
  mprl_kn: number;
  load_span_kn?: number;
  stroke_length_in: number;
  spm: number;
  card_area_kj?: number;
  card_area_in_lbs?: number;
  prhp_hp?: number;
  prhp_kw?: number;
  pump_fillage_pct?: number;
  surface_card: DynacardPoint[];
  downhole_card: DynacardPoint[];
}

export interface CSSPredictResponse {
  well_id: string;
  predicted_oil_rate: number;
  predicted_sor: number;
  predicted_energy: number;
  recovery: number;
  peak_temperature: number;
  temperature_forecast: Array<{ day: number; temperature: number; viscosity?: number }>;
  viscosity_forecast: Array<{ day: number; viscosity: number }>;
  model_version: string;
}

export interface SRPPredictResponse {
  well_id: string;
  pprl: number;
  mprl: number;
  load_span?: number;
  scaled_load_ratio?: number;
  rod_load: number;
  pump_load: number;
  dynamic_viscous_drag: number;
  pump_efficiency: number;
  rod_stress_ratio: number;
  prhp_kw?: number;
  prhp_hp?: number;
  pump_fillage_pct?: number;
  floating_probability: number;
  floating_risk_level: string;
  failure_probability: number;
  failure_risk_level: string;
  energy_consumption: number;
  dynacard: DynacardData;
}

export interface ExplanationItem {
  category: string;
  title: string;
  text: string;
  importance: string;
}

export interface OptimizeResponse {
  optimization_id: string;
  well_id: string;
  timestamp: string;
  candidates_evaluated: number;
  valid_candidates: number;
  rejected_by_constraints: number;
  score: number;
  objective_weights: Record<string, number>;
  current: Record<string, any>;
  recommended: Record<string, any>;
  predicted: Record<string, any>;
  improvements: Record<string, number>;
  explanations: ExplanationItem[];
  model_versions: Record<string, string>;
}

export interface AlertItem {
  id: number;
  alert_id: string;
  well_id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  parameter: string;
  value: number;
  threshold: number;
  unit: string;
  title: string;
  message: string;
  recommended_action: string;
  is_acknowledged: boolean;
}

export interface AuditItem {
  id: number;
  timestamp: string;
  user: string;
  well_id: string;
  action: string;
  previous_parameters: Record<string, any>;
  recommended_parameters: Record<string, any>;
  final_approved_parameters: Record<string, any>;
  reason: string;
  approval_status: string;
}

export interface ModelMetadata {
  training_timestamp: string;
  total_samples: number;
  train_samples: number;
  test_samples: number;
  split_strategy: string;
  models: Record<string, {
    name: string;
    version: string;
    confidence_tier?: string;
    algorithm: string;
    features: string[];
    target: string;
    metrics: Record<string, number>;
    feature_importances: Record<string, number>;
  }>;
}

export interface TelemetryTick {
  well_id: string;
  timestamp: string;
  timestamp_iso: string;
  temperature: number;
  pressure: number;
  viscosity: number;
  oil_rate: number;
  water_rate: number;
  spm: number;
  stroke: number;
  vfd: number;
  pprl: number;
  mprl: number;
  rod_load: number;
  pump_load: number;
  dynamic_viscous_drag: number;
  pump_efficiency: number;
  energy_consumption: number;
  floating_risk: number;
  floating_risk_level: string;
  failure_risk: number;
  failure_risk_level: string;
  unsetting_risk: number;
  unsetting_risk_level: string;
  active_anomaly?: string | null;
  dynacard: DynacardData;
  alert?: {
    severity: string;
    title: string;
    message: string;
    recommended_action: string;
  } | null;
}
