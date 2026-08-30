import React, { useState, useEffect } from 'react';
import { useTwin } from '../context/TwinContext';
import { api } from '../services/api';
import { RiskGauge } from '../components/common/RiskGauge';
import { ShieldAlert, AlertTriangle, ShieldCheck, Activity, ArrowRight, HelpCircle } from 'lucide-react';

export const RiskReliabilityPage: React.FC = () => {
  const { selectedWellId, twinState } = useTwin();
  const [riskData, setRiskData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (selectedWellId) {
      setIsLoading(true);
      api.getRisks(selectedWellId)
        .then(setRiskData)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [selectedWellId, twinState]);

  if (!twinState) return null;

  const { risks, srp, reservoir } = twinState;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h1 className="text-lg font-bold uppercase tracking-wider text-white">
              Operational Risk & Mechanical Reliability Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Target Well: <b className="text-white font-mono">{selectedWellId}</b> • Multi-variable risk modeling based on dynamic viscous drag, cyclic fatigue, and hydraulic uplift.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono px-3 py-1 rounded bg-industrial-950 border border-industrial-750 text-slate-300">
            Current Risk State: <b className={risks.rod_floating > 0.6 ? 'text-red-400' : 'text-emerald-400'}>{risks.rod_floating_level}</b>
          </span>
        </div>
      </div>

      {/* Main 3 Risk Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <RiskGauge
          label="Downstroke Rod Floating"
          probability={risks.rod_floating}
          level={risks.rod_floating_level}
          description="Occurs when upward fluid shear drag exceeds buoyant rod string weight, causing rods to fall slower than the surface carrier bar."
          trend={risks.rod_floating > 0.6 ? "CRITICAL HAZARD" : "Nominal drag"}
        />

        <RiskGauge
          label="30-Day Rod String Fatigue"
          probability={risks.rod_failure}
          level={risks.rod_failure_level}
          description="Cumulative fatigue damage from cyclic stress reversals and compressive shock waves from rod floating."
          trend="Fatigue index active"
        />

        <RiskGauge
          label="Downhole Pump Unsetting"
          probability={risks.pump_unsetting}
          level={risks.pump_unsetting_level}
          description="Upstroke frictional uplift exceeding seating nipple anchor hold capacity."
          trend="Anchor secure"
        />
      </div>

      {/* Contributing Factors Breakdown (Req #24) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Rod Floating Breakdown */}
        <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-industrial-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-cyber-amber" />
              <span>Rod Floating Contributing Factors</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Relative Weight Contribution</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {risks.contributing_factors?.rod_floating?.map((factor, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>{factor.name}</span>
                  <span className="text-white font-bold">{factor.value} <span className="text-slate-500 font-normal">({factor.threshold})</span></span>
                </div>
                <div className="w-full bg-industrial-950 h-2 rounded-full overflow-hidden border border-industrial-800">
                  <div
                    className="h-full bg-cyber-amber rounded-full"
                    style={{ width: `${factor.contribution * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-950/20 border border-amber-500/30 rounded p-3 text-xs text-amber-300">
            <b>Recommended AI Action:</b> Reduce surface pumping speed from {srp.spm} SPM to 3.7 SPM or trigger CSS Cycle #{twinState.current_css_cycle + 1} steam injection to raise formation temperature and lower crude viscosity.
          </div>
        </div>

        {/* Rod Failure & Stress Breakdown */}
        <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-industrial-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Fatigue Stress & Loading Factors</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Yield Cap: 85%</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {risks.contributing_factors?.rod_failure?.map((factor, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>{factor.name}</span>
                  <span className="text-white font-bold">{factor.value} <span className="text-slate-500 font-normal">({factor.threshold})</span></span>
                </div>
                <div className="w-full bg-industrial-950 h-2 rounded-full overflow-hidden border border-industrial-800">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${factor.contribution * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-cyan-950/20 border border-cyan-500/30 rounded p-3 text-xs text-cyan-300">
            <b>Structural Integrity Note:</b> Peak polished rod stress is currently at {Math.round(srp.rod_stress_ratio * 100)}% of allowable API Grade D yield strength.
          </div>
        </div>
      </div>
    </div>
  );
};
