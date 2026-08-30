import React, { useState, useEffect } from 'react';
import { useTwin } from '../context/TwinContext';
import { KpiCard } from '../components/common/KpiCard';
import { RiskGauge } from '../components/common/RiskGauge';
import { StatusBadge } from '../components/common/StatusBadge';
import { TwinFlowDiagram } from '../components/digital_twin/TwinFlowDiagram';
import { api } from '../services/api';
import {
  Droplets, Flame, Activity, Gauge, Zap,
  TrendingDown, Layers, RefreshCw, AlertTriangle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

export const DigitalTwinPage: React.FC = () => {
  const { selectedWellId, twinState, refreshTwinState, isLoading } = useTwin();
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'flow' | 'trends' | 'subsystems'>('flow');

  useEffect(() => {
    if (selectedWellId) {
      api.getWellHistory(selectedWellId, 45).then(setHistoryData).catch(console.error);
    }
  }, [selectedWellId]);

  if (!twinState) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-cyber-amber mb-2" />
        <span>Loading Digital Twin State for {selectedWellId}...</span>
      </div>
    );
  }

  const { reservoir, wellbore, srp, production, risks } = twinState;

  return (
    <div className="space-y-6">
      {/* Well Twin State Header */}
      <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold font-mono tracking-tight text-white">{twinState.well_id}</h1>
            <span className="text-xs text-slate-400 font-mono">({twinState.well_name})</span>
            <span className="flex items-center space-x-1.5 text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>DIGITAL TWIN SYNCHRONIZED</span>
            </span>
            <StatusBadge status={twinState.scenario_type} />
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Bikaner-Nagaur Sandstone • Depth: 1,050m • API: 17.5° • Active Cycle: #{twinState.current_css_cycle} ({twinState.days_on_production}d produced)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => refreshTwinState()}
            className="flex items-center space-x-1 px-3 py-1.5 rounded bg-industrial-950 border border-industrial-750 text-xs font-mono text-slate-300 hover:border-slate-400 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Twin State</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <KpiCard
          label="Oil Rate"
          value={production.oil_rate}
          unit="BOPD"
          tooltipKey="BOPD"
          status={production.oil_rate < 30 ? 'warning' : 'normal'}
          trend="-18% cycle decline"
          trendType="negative"
          icon={<Droplets className="w-4 h-4 text-emerald-400" />}
        />
        <KpiCard
          label="In-Situ Temp"
          value={reservoir.temperature}
          unit="°C"
          status={reservoir.temperature < 60 ? 'warning' : 'normal'}
          trend="Thermal decay"
          trendType="negative"
          icon={<Flame className="w-4 h-4 text-amber-400" />}
        />
        <KpiCard
          label="Viscosity"
          value={reservoir.viscosity}
          unit="cP"
          tooltipKey="Viscosity"
          status={reservoir.viscosity > 800 ? 'critical' : 'normal'}
          trend="+320% vs peak"
          trendType="negative"
          icon={<Activity className="w-4 h-4 text-red-400" />}
        />
        <KpiCard
          label="Cycle SOR"
          value={production.sor}
          unit="m³/m³"
          tooltipKey="SOR"
          icon={<Flame className="w-4 h-4 text-amber-400" />}
        />
        <KpiCard
          label="Pumping Speed"
          value={srp.spm}
          unit="SPM"
          tooltipKey="SPM"
          icon={<Gauge className="w-4 h-4 text-cyan-400" />}
        />
        <KpiCard
          label="Downstroke Drag"
          value={srp.dynamic_viscous_drag}
          unit="kN"
          status={srp.dynamic_viscous_drag > 20 ? 'critical' : 'normal'}
          trend="Opposes gravity"
          trendType="warning"
          icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}
        />
        <KpiCard
          label="Pump Efficiency"
          value={srp.pump_efficiency}
          unit="%"
          icon={<Zap className="w-4 h-4 text-violet-400" />}
        />
      </div>

      {/* Central Interactive Twin Diagram */}
      <TwinFlowDiagram twinState={twinState} />

      {/* Operational Risks & Historical Trends Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Risk Gauges */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between pb-1 border-b border-industrial-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Mechanical Integrity Risks
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">Physics + ML Evaluated</span>
          </div>

          <RiskGauge
            label="Rod Floating Risk"
            probability={risks.rod_floating}
            level={risks.rod_floating_level}
            description="Viscous drag on downstroke (28.4 kN) exceeds allowable safety threshold relative to buoyant rod weight."
            trend="+14% this cycle"
          />

          <RiskGauge
            label="30-Day Rod String Failure"
            probability={risks.rod_failure}
            level={risks.rod_failure_level}
            description="Cumulative fatigue from cyclic impact loading and maximum rod tensile stress (81% yield)."
            trend="Moderate fatigue"
          />

          <RiskGauge
            label="Downhole Pump Unsetting"
            probability={risks.pump_unsetting}
            level={risks.pump_unsetting_level}
            description="Upstroke fluid frictional uplift vs seating nipple mechanical hold."
            trend="Nominal seating"
          />
        </div>

        {/* Right: Coupled Historical Time-Series Chart */}
        <div className="lg:col-span-2 bg-industrial-900 border border-industrial-800 rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-industrial-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Historical Thermal-Viscosity-Production Coupling (Past 45 Days)
              </h3>
              <p className="text-[11px] text-slate-400">
                Observing the direct causal link: Temperature Cooling ↓ → Viscosity ↑ → Oil Rate Decline ↓
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis yAxisId="left" stroke="#10b981" tick={{ fontSize: 10, fill: '#10b981' }} label={{ value: 'Oil Rate (BOPD)', angle: -90, position: 'insideLeft', fill: '#10b981', fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 10, fill: '#f59e0b' }} label={{ value: 'Temp (°C) / Visc (cP)', angle: 90, position: 'insideRight', fill: '#f59e0b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Line yAxisId="left" type="monotone" dataKey="oil_rate" name="Oil Rate (BOPD)" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="viscosity" name="Viscosity (cP)" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
