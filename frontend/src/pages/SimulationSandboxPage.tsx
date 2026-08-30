import React, { useState } from 'react';
import { useTwin } from '../context/TwinContext';
import { api } from '../services/api';
import { DigitalTwinState } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { RiskGauge } from '../components/common/RiskGauge';
import { OPERATING_CONSTRAINTS } from '../utils/constraints';
import { FlaskConical, Play, Sparkles, CheckCircle2, RotateCcw, Droplets, Flame, Zap, Activity } from 'lucide-react';

export const SimulationSandboxPage: React.FC = () => {
  const { selectedWellId, twinState, refreshTwinState } = useTwin();

  // Sandbox parameters
  const [steamVolume, setSteamVolume] = useState<number>(85);
  const [injectionPressure, setInjectionPressure] = useState<number>(18);
  const [soakTime, setSoakTime] = useState<number>(72);
  const [productionCutoff, setProductionCutoff] = useState<number>(30);
  const [strokeLength, setStrokeLength] = useState<number>(72);
  const [spm, setSpm] = useState<number>(3.7);
  const [vfdFrequency, setVfdFrequency] = useState<number>(38);

  const [simulatedTwin, setSimulatedTwin] = useState<DigitalTwinState | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setIsApproved(false);
    setNotice(null);
    try {
      const res = await api.simulateTwin({
        well_id: selectedWellId,
        steam_volume: steamVolume,
        injection_pressure: injectionPressure,
        soak_time: soakTime,
        production_cutoff: productionCutoff,
        stroke_length: strokeLength,
        spm: spm,
        vfd_frequency: vfdFrequency,
      });
      setSimulatedTwin(res);
    } catch (err: any) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApproveSimulation = async () => {
    if (!simulatedTwin) return;
    try {
      const payload = {
        well_id: selectedWellId,
        operator_name: 'Demo Operator',
        action: 'APPROVE_SIMULATION',
        previous_parameters: {
          spm: twinState?.srp.spm,
          stroke: twinState?.srp.stroke_length,
          vfd: twinState?.srp.vfd_frequency,
        },
        recommended_parameters: {
          steam_volume: steamVolume,
          injection_pressure: injectionPressure,
          soak_time: soakTime,
          production_cutoff: productionCutoff,
          stroke: strokeLength,
          spm: spm,
          vfd: vfdFrequency,
        },
        final_approved_parameters: {
          steam_volume: steamVolume,
          injection_pressure: injectionPressure,
          soak_time: soakTime,
          production_cutoff: productionCutoff,
          stroke: strokeLength,
          spm: spm,
          vfd: vfdFrequency,
        },
        reason: 'Operator promoted sandbox what-if scenario into the active Digital Twin state.'
      };
      await api.approveRecommendation(payload);
      setIsApproved(true);
      setNotice('Sandbox scenario approved and persisted to active Digital Twin.');
      await refreshTwinState();
    } catch (err: any) {
      console.error('Failed to approve simulation:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FlaskConical className="w-5 h-5 text-violet-400" />
            <h1 className="text-lg font-bold uppercase tracking-wider text-white">
              Interactive Digital-Twin Simulation Sandbox
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Target Well: <b className="text-white font-mono">{selectedWellId}</b> • Test arbitrary CSS thermal & SRP mechanical combinations in a safe sandbox without mutating live well state.
          </p>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={isSimulating}
          className="px-5 py-2.5 bg-violet-500 hover:bg-violet-400 text-black font-mono font-bold text-xs rounded transition-all flex items-center space-x-2 shadow-[0_0_15px_rgba(139,92,246,0.25)]"
        >
          {isSimulating ? (
            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          <span>RUN WHAT-IF SIMULATION</span>
        </button>
      </div>

      {/* Dual Controls: CSS & SRP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: CSS Parameters */}
        <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-industrial-800">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">CSS Thermal Sliders</h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Steam Volume CWE:</span>
                <b className="text-amber-400">{steamVolume} m³</b>
              </div>
              <input
                type="range"
                min={OPERATING_CONSTRAINTS.steam_volume.min}
                max={OPERATING_CONSTRAINTS.steam_volume.max}
                step={OPERATING_CONSTRAINTS.steam_volume.step}
                value={steamVolume}
                onChange={(e) => setSteamVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-industrial-950 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Injection Pressure:</span>
                <b className="text-cyan-400">{injectionPressure} bar</b>
              </div>
              <input
                type="range"
                min={OPERATING_CONSTRAINTS.injection_pressure.min}
                max={OPERATING_CONSTRAINTS.injection_pressure.max}
                step={OPERATING_CONSTRAINTS.injection_pressure.step}
                value={injectionPressure}
                onChange={(e) => setInjectionPressure(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-industrial-950 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Soak Time:</span>
                <b className="text-emerald-400">{soakTime} hr</b>
              </div>
              <input
                type="range"
                min={OPERATING_CONSTRAINTS.soak_time.min}
                max={OPERATING_CONSTRAINTS.soak_time.max}
                step={OPERATING_CONSTRAINTS.soak_time.step}
                value={soakTime}
                onChange={(e) => setSoakTime(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-industrial-950 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right: SRP Parameters */}
        <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-industrial-800">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">SRP Mechanical Sliders</h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Pumping Speed (SPM):</span>
                <b className="text-cyan-400">{spm} SPM</b>
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
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Stroke Length:</span>
                <b className="text-emerald-400">{strokeLength}"</b>
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
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>VFD Frequency:</span>
                <b className="text-violet-400">{vfdFrequency} Hz</b>
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
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Output State */}
      {simulatedTwin && (
        <div className="space-y-5 bg-industrial-950 border border-violet-500/40 rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-industrial-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Simulated Sandbox Digital-Twin State (Temporary What-If)
              </h3>
              <span className="text-[11px] font-mono text-violet-400">
                Coupled Multi-Physics Recalculation Complete
              </span>
            </div>

            {!isApproved ? (
              <button
                onClick={handleApproveSimulation}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs rounded transition-all flex items-center space-x-1.5 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>APPROVE & APPLY TO ACTIVE TWIN</span>
              </button>
            ) : (
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded border border-emerald-500/40">
                ✓ SIMULATION APPROVED & APPLIED
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Simulated Oil Rate" value={simulatedTwin.production.oil_rate} unit="BOPD" />
            <KpiCard label="Simulated In-Situ Temp" value={simulatedTwin.reservoir.temperature} unit="°C" />
            <KpiCard label="Simulated Viscosity" value={simulatedTwin.reservoir.viscosity} unit="cP" />
            <KpiCard label="Simulated SOR" value={simulatedTwin.production.sor} unit="m³/m³" />
            <KpiCard label="Peak Rod Load (PPRL)" value={simulatedTwin.srp.pprl} unit="kN" />
            <KpiCard label="Min Rod Load (MPRL)" value={simulatedTwin.srp.mprl} unit="kN" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <RiskGauge
              label="Simulated Rod Floating"
              probability={simulatedTwin.risks.rod_floating}
              level={simulatedTwin.risks.rod_floating_level}
            />
            <RiskGauge
              label="Simulated Rod Failure"
              probability={simulatedTwin.risks.rod_failure}
              level={simulatedTwin.risks.rod_failure_level}
            />
            <RiskGauge
              label="Simulated Pump Unsetting"
              probability={simulatedTwin.risks.pump_unsetting}
              level={simulatedTwin.risks.pump_unsetting_level}
            />
          </div>

          {notice && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-3 rounded text-xs font-mono">
              {notice}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
