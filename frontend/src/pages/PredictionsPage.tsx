import React, { useState, useEffect } from 'react';
import { useTwin } from '../context/TwinContext';
import { api } from '../services/api';
import { KpiCard } from '../components/common/KpiCard';
import { TrendingUp, Flame, Activity, Droplets, RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

export const PredictionsPage: React.FC = () => {
  const { selectedWellId, twinState } = useTwin();
  const [horizonDays, setHorizonDays] = useState<number>(60);
  const [forecastData, setForecastData] = useState<{
    production_forecast: Array<{ day: number; value: number; lower_bound: number; upper_bound: number }>;
    temperature_forecast: Array<{ day: number; value: number; lower_bound: number; upper_bound: number }>;
    viscosity_forecast: Array<{ day: number; value: number; lower_bound: number; upper_bound: number }>;
    model_version?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (selectedWellId) {
      setIsLoading(true);
      api.getForecasts(selectedWellId, horizonDays)
        .then(setForecastData)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [selectedWellId, horizonDays]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-bold uppercase tracking-wider text-white">
              Forward Production & Thermal Decline Forecasts
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Target Well: <b className="text-white font-mono">{selectedWellId}</b> • Hybrid Physics-ML multi-month trajectory with uncertainty confidence bounds.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-400">Forecast Horizon:</span>
          <select
            value={horizonDays}
            onChange={(e) => setHorizonDays(parseInt(e.target.value))}
            className="bg-industrial-950 border border-industrial-750 rounded px-3 py-1 text-white font-bold focus:outline-none"
          >
            <option value={30}>30 Days Ahead</option>
            <option value={60}>60 Days Ahead</option>
            <option value={90}>90 Days Ahead</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-cyber-amber mr-2" />
          <span>Calculating forecast trajectories...</span>
        </div>
      ) : forecastData ? (
        <div className="space-y-6">
          {/* Production Forecast Chart with Confidence Band */}
          <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-industrial-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                  <Droplets className="w-4 h-4 text-emerald-400" />
                  <span>Oil Production Forecast with Uncertainty Band (BOPD)</span>
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                Current: {twinState?.production.oil_rate} BOPD → Projected: {forecastData.production_forecast[forecastData.production_forecast.length - 1]?.value} BOPD
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData.production_forecast} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} label={{ value: 'Days Forward', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis stroke="#10b981" tick={{ fontSize: 10, fill: '#10b981' }} label={{ value: 'Oil Rate (BOPD)', angle: -90, position: 'insideLeft', fill: '#10b981', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }} />
                  <Area type="monotone" dataKey="upper_bound" stroke="none" fill="rgba(16, 185, 129, 0.12)" />
                  <Area type="monotone" dataKey="lower_bound" stroke="none" fill="#090d16" />
                  <Line type="monotone" dataKey="value" name="Predicted Rate (BOPD)" stroke="#10b981" strokeWidth={2.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Coupled Thermal Decay & Viscosity Trajectory */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Reservoir Temperature Forecast */}
            <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-industrial-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Reservoir Temperature Cooling (°C)</span>
                </h3>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData.temperature_forecast} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis stroke="#f59e0b" tick={{ fontSize: 10, fill: '#f59e0b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Area type="monotone" dataKey="upper_bound" stroke="none" fill="rgba(245, 158, 11, 0.12)" />
                    <Line type="monotone" dataKey="value" name="Temperature (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* In-Situ Viscosity Rise */}
            <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-industrial-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-red-400" />
                  <span>Crude Viscosity Rise (cP)</span>
                </h3>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData.viscosity_forecast} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis stroke="#ef4444" tick={{ fontSize: 10, fill: '#ef4444' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Area type="monotone" dataKey="upper_bound" stroke="none" fill="rgba(239, 68, 68, 0.12)" />
                    <Line type="monotone" dataKey="value" name="Viscosity (cP)" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
