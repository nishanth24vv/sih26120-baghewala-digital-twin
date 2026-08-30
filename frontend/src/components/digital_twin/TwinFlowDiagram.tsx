import React, { useState } from 'react';
import { DigitalTwinState } from '../../types';
import { Flame, Droplets, Activity, Gauge, AlertTriangle, ArrowDown, ChevronRight, Info } from 'lucide-react';

interface TwinFlowDiagramProps {
  twinState: DigitalTwinState | null;
  onSelectNode?: (nodeId: string) => void;
}

export const TwinFlowDiagram: React.FC<TwinFlowDiagramProps> = ({ twinState, onSelectNode }) => {
  const [selectedNode, setSelectedNode] = useState<string>('reservoir');

  if (!twinState) {
    return (
      <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-8 text-center text-slate-500">
        Loading Digital Twin State...
      </div>
    );
  }

  const { reservoir, wellbore, srp, production, risks } = twinState;

  // Causal relationship definitions for clicking nodes
  const nodeDetails: Record<string, {
    title: string;
    subtitle: string;
    metrics: Array<{ label: string; value: string; unit: string; desc: string }>;
    influences: string[];
    influencedBy: string[];
    explanation: string;
  }> = {
    css_steam: {
      title: 'Cyclic Steam Stimulation (CSS)',
      subtitle: 'Thermal In-Situ Heating',
      metrics: [
        { label: 'Cumulative Injected Steam', value: `${twinState.cumulative_steam_injected_m3}`, unit: 'm³ CWE', desc: 'Total thermal energy injected' },
        { label: 'Active Cycle', value: `#${twinState.current_css_cycle}`, unit: '', desc: 'Current CSS cycle count' },
        { label: 'Days on Production', value: `${twinState.days_on_production}`, unit: 'days', desc: 'Current production drawdown window' },
      ],
      influences: ['Reservoir Temperature', 'Heavy Crude Viscosity', 'Oil Mobility'],
      influencedBy: ['CSS Injection Pressure', 'Steam Volume', 'Soak Time'],
      explanation: 'Injected steam expands the near-wellbore thermal chamber, heating the ultra-heavy crude and exponentially reducing viscosity from >8,000 cP to <100 cP.'
    },
    reservoir: {
      title: 'Reservoir Subsystem',
      subtitle: 'Bikaner-Nagaur Sandstone Formation (1,050m)',
      metrics: [
        { label: 'In-Situ Temperature', value: `${reservoir.temperature}`, unit: '°C', desc: 'Current near-wellbore formation heat' },
        { label: 'Crude Viscosity', value: `${reservoir.viscosity}`, unit: 'cP', desc: 'Flow resistance (Andrade equation)' },
        { label: 'Relative Mobility (k/μ)', value: `${reservoir.mobility}`, unit: 'mD/cP', desc: 'Fluid transmissibility in porous media' },
        { label: 'Reservoir Pressure', value: `${reservoir.pressure}`, unit: 'bar', desc: 'Static driving reservoir pressure' },
      ],
      influences: ['Wellbore Inflow Rate', 'Flowing Bottomhole Pressure', 'Downhole Viscous Drag'],
      influencedBy: ['Steam Injection Volume', 'Overburden Thermal Diffusion', 'Production Heat Extraction'],
      explanation: 'Reservoir thermal decay governs crude viscosity. As the reservoir cools, viscosity rises exponentially, severely diminishing oil mobility and increasing rod drag.'
    },
    wellbore: {
      title: 'Wellbore & Hydraulics',
      subtitle: 'Cased Hole & Annular Column',
      metrics: [
        { label: 'Flowing BHP (Pwf)', value: `${wellbore.pressure}`, unit: 'bar', desc: 'Bottom-hole drawdown pressure' },
        { label: 'Pump Intake Pressure (Ppip)', value: `${wellbore.pump_intake_pressure}`, unit: 'bar', desc: 'Pressure feeding the standing valve' },
        { label: 'Dynamic Fluid Level', value: `${wellbore.fluid_level}`, unit: 'm', desc: 'Annular fluid distance from wellhead' },
        { label: 'Inflow Flow Rate', value: `${wellbore.flow_rate}`, unit: 'BFPD', desc: 'Total fluid entering the wellbore' },
      ],
      influences: ['Pump Volumetric Efficiency', 'Fluid Pound Severity', 'Pump Intake Pressure'],
      influencedBy: ['Reservoir Inflow Deliverability', 'SRP Lifting Displacement'],
      explanation: 'Drawdown maintained by the downhole pump determines inflow equilibrium. Underfilled pump chambers lead to fluid pound impact shocks.'
    },
    srp: {
      title: 'Surface Sucker Rod Pumping (SRP)',
      subtitle: 'Kinematics & Rod String Loading',
      metrics: [
        { label: 'Pumping Cadence', value: `${srp.spm}`, unit: 'SPM', desc: 'Surface pumping strokes per minute' },
        { label: 'Stroke Length', value: `${srp.stroke_length}`, unit: 'in', desc: 'Polished rod travel length' },
        { label: 'Peak Rod Load (PPRL)', value: `${srp.pprl}`, unit: 'kN', desc: 'Max upstroke tensile load' },
        { label: 'Min Rod Load (MPRL)', value: `${srp.mprl}`, unit: 'kN', desc: 'Downstroke tension (near 0 = floating)' },
        { label: 'Downstroke Viscous Drag', value: `${srp.dynamic_viscous_drag}`, unit: 'kN', desc: 'Fluid shear resistance opposing gravity' },
        { label: 'Pump Volumetric Efficiency', value: `${srp.pump_efficiency}`, unit: '%', desc: 'Actual vs theoretical displacement' },
      ],
      influences: ['Rod Floating Hazard', 'Rod String Fatigue Failure', 'Lifting Energy Consumption'],
      influencedBy: ['Wellbore Viscosity', 'SPM Speed', 'Polished Rod Stroke'],
      explanation: 'In heavy crude, downstroke fluid shear drag opposes rod weight. When drag approaches buoyant rod weight (38.5 kN), rods float, causing compression buckling and carrier bar shock impact.'
    },
    production_risks: {
      title: 'Field Deliverability & Integrity Risks',
      subtitle: 'Coupled Output Indicators',
      metrics: [
        { label: 'Current Oil Production', value: `${production.oil_rate}`, unit: 'BOPD', desc: 'Active oil rate' },
        { label: 'Steam-to-Oil Ratio (SOR)', value: `${production.sor}`, unit: 'm³/m³', desc: 'Thermal efficiency' },
        { label: 'Specific Lifting Energy', value: `${production.energy_consumption}`, unit: 'kWh/bbl', desc: 'Energy cost per barrel' },
        { label: 'Downstroke Rod Floating Risk', value: `${Math.round(risks.rod_floating * 100)}`, unit: '%', desc: 'Likelihood of floating separation' },
        { label: '30-Day Rod Failure Probability', value: `${Math.round(risks.rod_failure * 100)}`, unit: '%', desc: 'Fatigue failure prediction' },
      ],
      influences: ['Economic Field Margin', 'Equipment Lifespan', 'Workover Frequency'],
      influencedBy: ['Joint CSS Heating + SRP Cadence Synchronization'],
      explanation: 'The ultimate performance state. High production is only sustainable when mechanical risks (floating, failure) are minimized and SOR/energy are optimized jointly.'
    }
  };

  const handleNodeClick = (nodeKey: string) => {
    setSelectedNode(nodeKey);
    if (onSelectNode) onSelectNode(nodeKey);
  };

  const activeDetail = nodeDetails[selectedNode] || nodeDetails.reservoir;

  return (
    <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-industrial-800">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
            <span>Well-to-Surface Coupled Digital Twin Schematic</span>
            <span className="text-xs font-mono font-normal text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
              Interactive Causal Graph
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any physical subsystem to inspect its coupled parameters and downstream causal dependencies.
          </p>
        </div>
      </div>

      {/* Causal Flow Nodes Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 my-4">
        {/* Node 1: CSS */}
        <button
          onClick={() => handleNodeClick('css_steam')}
          className={`p-3.5 rounded-lg border text-left transition-all relative ${
            selectedNode === 'css_steam'
              ? 'bg-amber-950/30 border-cyber-amber shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-cyber-amber'
              : 'bg-industrial-950 border-industrial-800 hover:border-industrial-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Flame className="w-4 h-4 text-cyber-amber" />
            <span className="text-[10px] font-mono font-bold text-cyber-amber bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
              STAGE 1
            </span>
          </div>
          <h4 className="text-xs font-bold text-white">CSS Steam</h4>
          <p className="text-[11px] text-slate-400 mt-1">Thermal Energy</p>
          <div className="mt-2 text-xs font-mono text-amber-300 font-bold">
            {twinState.cumulative_steam_injected_m3} m³ CWE
          </div>
        </button>

        {/* Node 2: Reservoir */}
        <button
          onClick={() => handleNodeClick('reservoir')}
          className={`p-3.5 rounded-lg border text-left transition-all relative ${
            selectedNode === 'reservoir'
              ? 'bg-amber-950/30 border-cyber-amber shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-cyber-amber'
              : 'bg-industrial-950 border-industrial-800 hover:border-industrial-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
              STAGE 2
            </span>
          </div>
          <h4 className="text-xs font-bold text-white">Reservoir</h4>
          <p className="text-[11px] text-slate-400 mt-1">Temp & Viscosity</p>
          <div className="mt-2 text-xs font-mono text-emerald-300 font-bold">
            {reservoir.temperature}°C | {reservoir.viscosity} cP
          </div>
        </button>

        {/* Node 3: Wellbore */}
        <button
          onClick={() => handleNodeClick('wellbore')}
          className={`p-3.5 rounded-lg border text-left transition-all relative ${
            selectedNode === 'wellbore'
              ? 'bg-amber-950/30 border-cyber-amber shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-cyber-amber'
              : 'bg-industrial-950 border-industrial-800 hover:border-industrial-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
              STAGE 3
            </span>
          </div>
          <h4 className="text-xs font-bold text-white">Wellbore</h4>
          <p className="text-[11px] text-slate-400 mt-1">Hydraulics & Pwf</p>
          <div className="mt-2 text-xs font-mono text-cyan-300 font-bold">
            {wellbore.pressure} bar | {wellbore.fluid_level}m
          </div>
        </button>

        {/* Node 4: SRP */}
        <button
          onClick={() => handleNodeClick('srp')}
          className={`p-3.5 rounded-lg border text-left transition-all relative ${
            selectedNode === 'srp'
              ? 'bg-amber-950/30 border-cyber-amber shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-cyber-amber'
              : 'bg-industrial-950 border-industrial-800 hover:border-industrial-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Gauge className="w-4 h-4 text-violet-400" />
            <span className="text-[10px] font-mono font-bold text-violet-400 bg-violet-950/40 px-1.5 py-0.5 rounded border border-violet-500/30">
              STAGE 4
            </span>
          </div>
          <h4 className="text-xs font-bold text-white">Surface SRP</h4>
          <p className="text-[11px] text-slate-400 mt-1">Rod Stress & SPM</p>
          <div className="mt-2 text-xs font-mono text-violet-300 font-bold">
            {srp.spm} SPM | {srp.pprl} kN
          </div>
        </button>

        {/* Node 5: Production & Risk */}
        <button
          onClick={() => handleNodeClick('production_risks')}
          className={`p-3.5 rounded-lg border text-left transition-all relative ${
            selectedNode === 'production_risks'
              ? 'bg-amber-950/30 border-cyber-amber shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-cyber-amber'
              : 'bg-industrial-950 border-industrial-800 hover:border-industrial-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className={`w-4 h-4 ${risks.rod_floating > 0.6 ? 'text-red-400' : 'text-emerald-400'}`} />
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              risks.rod_floating > 0.6 ? 'text-red-400 bg-red-950/40 border-red-500/40' : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40'
            }`}>
              OUTPUT
            </span>
          </div>
          <h4 className="text-xs font-bold text-white">Production & Risk</h4>
          <p className="text-[11px] text-slate-400 mt-1">Deliverability & Integrity</p>
          <div className="mt-2 text-xs font-mono text-white font-bold">
            {production.oil_rate} BOPD | Float: {Math.round(risks.rod_floating * 100)}%
          </div>
        </button>
      </div>

      {/* Selected Node Deep Dive Inspector */}
      <div className="bg-industrial-950 border border-industrial-800 rounded-lg p-4 mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-industrial-800">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{activeDetail.title}</h4>
            <span className="text-[11px] font-mono text-cyan-400">{activeDetail.subtitle}</span>
          </div>
        </div>

        {/* Node Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 my-3">
          {activeDetail.metrics.map((m, idx) => (
            <div key={idx} className="bg-industrial-900 border border-industrial-800 rounded p-2.5">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block truncate">{m.label}</span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-base font-mono font-bold text-white">{m.value}</span>
                <span className="text-[10px] font-mono text-slate-400">{m.unit}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 truncate">{m.desc}</p>
            </div>
          ))}
        </div>

        {/* Causal Flow Connections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-industrial-800/80 text-xs">
          <div>
            <span className="text-[11px] font-semibold text-slate-300 block mb-1">
              ⚡ Directly Influences (Downstream):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeDetail.influences.map((inf, i) => (
                <span key={i} className="bg-amber-950/30 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-mono">
                  → {inf}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-300 block mb-1">
              🔍 Governed By (Upstream Drivers):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeDetail.influencedBy.map((inf, i) => (
                <span key={i} className="bg-cyan-950/30 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded text-[11px] font-mono">
                  ← {inf}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-3 pt-2.5 border-t border-industrial-800 leading-relaxed italic">
          <Info className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
          {activeDetail.explanation}
        </p>
      </div>
    </div>
  );
};
