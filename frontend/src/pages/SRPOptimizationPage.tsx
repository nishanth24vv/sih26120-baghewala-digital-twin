import React, { useState } from 'react';
import { useTwin } from '../context/TwinContext';
import { api } from '../services/api';
import { SRPPredictResponse } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { RiskGauge } from '../components/common/RiskGauge';
import { DynacardView } from '../components/common/DynacardView';
import { OPERATING_CONSTRAINTS } from '../utils/constraints';
import { Gauge, Sparkles, AlertTriangle, Zap, Activity } from 'lucide-react';

export const SRPOptimizationPage: React.FC = () => {
  const { selectedWellId, twinState } = useTwin();

  const [strokeLength, setStrokeLength] = useState<number>(72);
  const [spm, setSpm] = useState<number>(3.7);
  const [vfdFrequency, setVfdFrequency] = useState<number>(38);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [srpResult, setSrpResult] = useState<SRPPredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePredictSRP = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.predictSRP({
        well_id: selectedWellId,
        stroke_length: strokeLength,
        spm: spm,
        vfd_frequency: vfdFrequency,
      });
      setSrpResult(res);
    } catch (err: any) {
      console.error('SRP Prediction failed:', err);
      setError(err.message || 'Failed to simulate SRP mechanics.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Gauge className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-bold uppercase tracking-wider text-white">
              Sucker Rod Pumping (SRP) Kinematic Optimization
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Target Well: <b className="text-white font-mono">{selectedWellId}</b> • Tune SPM, stroke length, and VFD frequency to mitigate rod floating and downstroke shear drag.
          </p>
        </div>

        <button
          onClick={handlePredictSRP}
          disabled={isLoading}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs rounded transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>OPTIMIZE SRP PARAMETERS</span>
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-300 font-semibold">Pumping Cadence (SPM)</span>
            <span className="text-cyan-400 font-bold">{spm} SPM</span>
          </div>
          <input
            type="range"
            min={OPERATING_CONSTRAINTS.spm.min}
            max={OPERATING_CONSTRAINTS.spm.max}
            step={OPERATING_CONSTRAINTS.spm.step}
            value={spm}
            onChange={(e) => setSpm(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-industrial-950 rounded cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 block">High SPM triggers downstroke floating in heavy oil</span>
        </div>

        <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-300 font-semibold">Stroke Length</span>
            <span className="text-emerald-400 font-bold">{strokeLength}"</span>
          </div>
          <input
            type="range"
            min={OPERATING_CONSTRAINTS.stroke_length.min}
            max={OPERATING_CONSTRAINTS.stroke_length.max}
            step={OPERATING_CONSTRAINTS.stroke_length.step}
            value={strokeLength}
            onChange={(e) => setStrokeLength(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-industrial-950 rounded cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 block">Surface Polished Rod Travel: 48" – 144"</span>
        </div>

        <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-300 font-semibold">VFD Frequency</span>
            <span className="text-violet-400 font-bold">{vfdFrequency} Hz</span>
          </div>
          <input
            type="range"
            min={OPERATING_CONSTRAINTS.vfd_frequency.min}
            max={OPERATING_CONSTRAINTS.vfd_frequency.max}
            step={OPERATING_CONSTRAINTS.vfd_frequency.step}
            value={vfdFrequency}
            onChange={(e) => setVfdFrequency(parseFloat(e.target.value))}
            className="w-full accent-violet-500 h-1.5 bg-industrial-950 rounded cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 block">Motor Inverter Frequency: 20 – 60 Hz</span>
        </div>
      </div>

      {/* Prediction Output */}
      {srpResult && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
            <KpiCard
              label="Peak Rod Load (PPRL)"
              value={srpResult.pprl}
              unit="kN"
              tooltipKey="PPRL"
              status={srpResult.pprl > 110 ? 'warning' : 'normal'}
            />
            <KpiCard
              label="Min Rod Load (MPRL)"
              value={srpResult.mprl}
              unit="kN"
              tooltipKey="MPRL"
              status={srpResult.mprl < 8 ? 'critical' : 'normal'}
              subtext="Downstroke tension"
            />
            <KpiCard
              label="Scaled Load Ratio (SLR)"
              value={srpResult.scaled_load_ratio || 0.55}
              unit="ratio"
              tooltipKey="ROD_STRESS"
              status={(srpResult.scaled_load_ratio || 0.55) > 0.95 ? 'warning' : 'normal'}
              subtext="Load Span / W_rf (SPE)"
            />
            <KpiCard
              label="Downstroke Drag"
              value={srpResult.dynamic_viscous_drag}
              unit="kN"
              status={srpResult.dynamic_viscous_drag > 20 ? 'critical' : 'normal'}
              subtext="Annular Couette Shear"
            />
            <KpiCard
              label="Polished Rod Power"
              value={srpResult.prhp_kw || srpResult.dynacard.prhp_kw || 0}
              unit="kW"
              subtext={srpResult.prhp_hp ? `${srpResult.prhp_hp} HP` : undefined}
            />
            <KpiCard
              label="Pump Fillage"
              value={srpResult.dynacard.pump_fillage_pct || srpResult.pump_efficiency}
              unit="%"
              status={(srpResult.dynacard.pump_fillage_pct || srpResult.pump_efficiency) < 60 ? 'warning' : 'normal'}
              subtext="Volumetric stroke"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <DynacardView dynacard={srpResult.dynacard} height={280} />

            <div className="space-y-4">
              <RiskGauge
                label="Rod Floating Probability"
                probability={srpResult.floating_probability}
                level={srpResult.floating_risk_level}
                description="Downstroke fluid shear drag vs buoyant rod string weight."
              />

              <RiskGauge
                label="30-Day Rod String Failure"
                probability={srpResult.failure_probability}
                level={srpResult.failure_risk_level}
                description="Fatigue accumulation from dynamic rod loading, SLR, and shock reversals."
              />

              {/* Reference Attribution & Engineering Standards Footnote */}
              <div className="p-3 rounded bg-industrial-950/80 border border-industrial-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div className="flex items-center space-x-1 text-slate-300 font-bold">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Engineering Methodology & Open-Source References</span>
                </div>
                <p>
                  • <b>BYU-PRISM USTAR:</b> Harmonic crank kinematics (omega = 2*pi*N/60) & dynamic submerged fluid-height estimation.<br />
                  • <b>digitalmodel (API RP 11L):</b> Structural load span (Delta L = PPRL - MPRL), closed loop card work integration.<br />
                  • <b>SPE / JPT Research:</b> Scaled Load Ratio (SLR = Delta L / W_rf) fatigue and carrier-bar floating screening.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
