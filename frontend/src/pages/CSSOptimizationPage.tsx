import React, { useState } from 'react';
import { useTwin } from '../context/TwinContext';
import { api } from '../services/api';
import { CSSPredictResponse } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { OPERATING_CONSTRAINTS } from '../utils/constraints';
import { Flame, Play, Sparkles, Droplets, Zap, Activity } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

export const CSSOptimizationPage: React.FC = () => {
  const { selectedWellId, twinState } = useTwin();

  const [steamVolume, setSteamVolume] = useState<number>(85);
  const [injectionPressure, setInjectionPressure] = useState<number>(18);
  const [soakTime, setSoakTime] = useState<number>(72);
  const [productionCutoff, setProductionCutoff] = useState<number>(30);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cssResult, setCssResult] = useState<CSSPredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePredictCSS = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.predictCSS({
        well_id: selectedWellId,
        steam_volume: steamVolume,
        injection_pressure: injectionPressure,
        soak_time: soakTime,
        production_cutoff: productionCutoff,
      });
      setCssResult(res);
    } catch (err: any) {
      console.error('CSS Prediction failed:', err);
      setError(err.message || 'Failed to simulate CSS cycle.');
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
            <Flame className="w-5 h-5 text-amber-400" />
            <h1 className="text-lg font-bold uppercase tracking-wider text-white">
              Cyclic Steam Stimulation (CSS) Thermal Optimization
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Target Well: <b className="text-white font-mono">{selectedWellId}</b> • Simulate thermal diffusion, viscosity reduction, and Steam-Oil Ratio (SOR).
          </p>
        </div>

        <button
          onClick={handlePredictCSS}
          disabled={isLoading}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs rounded transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>OPTIMIZE CSS PARAMETERS</span>
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-300 font-semibold">Steam Volume CWE</span>
            <span className="text-amber-400 font-bold">{steamVolume} m³</span>
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
          <span className="text-[10px] text-slate-500 block">Limits: 20 – 200 m³</span>
        </div>

        <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-300 font-semibold">Injection Pressure</span>
            <span className="text-cyan-400 font-bold">{injectionPressure} bar</span>
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
          <span className="text-[10px] text-slate-500 block">Fracture Limit: 38 bar</span>
        </div>

        <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-300 font-semibold">Soak Time</span>
            <span className="text-emerald-400 font-bold">{soakTime} hr</span>
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
          <span className="text-[10px] text-slate-500 block">Diffusion Window: 24 – 240 hr</span>
        </div>

        <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-300 font-semibold">Production Cutoff</span>
            <span className="text-violet-400 font-bold">{productionCutoff} days</span>
          </div>
          <input
            type="range"
            min={OPERATING_CONSTRAINTS.production_cutoff.min}
            max={OPERATING_CONSTRAINTS.production_cutoff.max}
            step={OPERATING_CONSTRAINTS.production_cutoff.step}
            value={productionCutoff}
            onChange={(e) => setProductionCutoff(parseFloat(e.target.value))}
            className="w-full accent-violet-500 h-1.5 bg-industrial-950 rounded cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 block">Cycle Length: 10 – 90 days</span>
        </div>
      </div>

      {/* Results Display */}
      {cssResult && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <KpiCard
              label="Predicted Oil Rate"
              value={cssResult.predicted_oil_rate}
              unit="BOPD"
              icon={<Droplets className="w-4 h-4 text-emerald-400" />}
            />
            <KpiCard
              label="Predicted Cycle SOR"
              value={cssResult.predicted_sor}
              unit="m³/m³"
              tooltipKey="SOR"
              icon={<Flame className="w-4 h-4 text-amber-400" />}
            />
            <KpiCard
              label="Peak In-Situ Temp"
              value={cssResult.peak_temperature}
              unit="°C"
              icon={<Activity className="w-4 h-4 text-red-400" />}
            />
            <KpiCard
              label="Est. Cumulative Recovery"
              value={cssResult.recovery}
              unit="bbl"
              icon={<Zap className="w-4 h-4 text-violet-400" />}
            />
          </div>

          {/* Thermal Cooling & Viscosity Forecast Charts */}
          <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-industrial-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Simulated Temperature Decay & In-Situ Viscosity Trajectory ({productionCutoff} Days)
              </h3>
              <span className="text-[11px] font-mono text-cyan-400">{cssResult.model_version}</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cssResult.temperature_forecast} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} label={{ value: 'Days on Production', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis yAxisId="left" stroke="#f59e0b" tick={{ fontSize: 10, fill: '#f59e0b' }} label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', fill: '#f59e0b', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#ef4444" tick={{ fontSize: 10, fill: '#ef4444' }} label={{ value: 'Viscosity (cP)', angle: 90, position: 'insideRight', fill: '#ef4444', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Line yAxisId="left" type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="viscosity" name="Viscosity (cP)" stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
