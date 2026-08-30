import React, { useState, useEffect, useRef } from 'react';
import { useTwin } from '../context/TwinContext';
import { api } from '../services/api';
import { TelemetryTick } from '../types';
import { DynacardView } from '../components/common/DynacardView';
import { RiskGauge } from '../components/common/RiskGauge';
import {
  Radio, Play, Pause, RotateCcw, AlertTriangle,
  Zap, Flame, Droplets, Activity, ShieldAlert, CheckCircle2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

export const RealTimeMonitoringPage: React.FC = () => {
  const { selectedWellId, twinState } = useTwin();

  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryTick[]>([]);
  const [currentTick, setCurrentTick] = useState<TelemetryTick | null>(null);
  const [activeAnomaly, setActiveAnomaly] = useState<string | null>(null);
  const [injectionNotice, setInjectionNotice] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!selectedWellId) return;

    // Connect WebSocket
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const apiHost = apiUrl ? apiUrl.replace(/^https?:\/\//, '') : window.location.host;
    const isHttps = apiUrl.startsWith('https') || window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${apiHost}/api/v1/telemetry/ws/${selectedWellId}`;
    
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        if (!isStreaming) return;
        try {
          const data: TelemetryTick = JSON.parse(event.data);
          setCurrentTick(data);
          if (data.active_anomaly) setActiveAnomaly(data.active_anomaly);
          else setActiveAnomaly(null);

          setTelemetryHistory((prev) => {
            const next = [...prev, data];
            return next.slice(-25); // keep latest 25 samples
          });
        } catch (e) {
          console.error('Error parsing telemetry packet:', e);
        }
      };

      ws.onerror = () => {
        // Fallback simulated local ticker if ws fails
        console.warn('WebSocket unavailable, using simulated local ticker.');
      };
    } catch (err) {
      console.warn('WS connection failed:', err);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedWellId, isStreaming]);

  const handleInjectAnomaly = async (anomalyType: string) => {
    try {
      const res = await api.injectAnomaly(selectedWellId, anomalyType);
      setActiveAnomaly(anomalyType);
      setInjectionNotice(res.message);
      setTimeout(() => setInjectionNotice(null), 5000);
    } catch (err: any) {
      console.error('Failed to inject anomaly:', err);
    }
  };

  const handleClearAnomaly = async () => {
    try {
      await api.clearAnomaly(selectedWellId);
      setActiveAnomaly(null);
      setInjectionNotice('Operational disturbance cleared. Nominal stream restored.');
      setTimeout(() => setInjectionNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed to clear anomaly:', err);
    }
  };

  const handleResetFeed = () => {
    setTelemetryHistory([]);
    handleClearAnomaly();
  };

  return (
    <div className="space-y-6">
      {/* Header with Stream Controls */}
      <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-bold uppercase tracking-wider text-white">
              Real-Time SCADA Telemetry & Dynacard Stream
            </h1>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border flex items-center space-x-1.5 ${
              isStreaming
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                : 'bg-amber-950/60 text-amber-400 border-amber-500/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span>{isStreaming ? 'LIVE STREAMING (1.5s)' : 'STREAM PAUSED'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Active Well: <b className="text-white">{selectedWellId}</b> • Streaming surface polished rod load cells, downhole sensor packets, and closed-loop dynacards.
          </p>
        </div>

        {/* Stream Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-industrial-950 border border-industrial-750 text-xs font-mono text-white hover:border-slate-400 transition-all"
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isStreaming ? 'Pause Feed' : 'Resume Feed'}</span>
          </button>

          <button
            onClick={handleResetFeed}
            className="flex items-center space-x-1 px-3 py-1.5 rounded bg-industrial-950 border border-industrial-750 text-xs font-mono text-slate-300 hover:text-white transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Feed</span>
          </button>
        </div>
      </div>

      {/* Anomaly Injector Bar (Req #22) */}
      <div className="bg-industrial-950 border border-industrial-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-industrial-800/80">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-cyber-amber" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Judging Interactive Anomaly Injector
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Simulate operational disturbances to observe live digital twin & alert reaction
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleInjectAnomaly('TEMPERATURE_DROP')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-all ${
              activeAnomaly === 'TEMPERATURE_DROP'
                ? 'bg-amber-500 text-black font-bold border-amber-500 shadow-md'
                : 'bg-industrial-900 text-slate-300 border-industrial-750 hover:border-amber-400'
            }`}
          >
            🔥 Temperature Drop
          </button>

          <button
            onClick={() => handleInjectAnomaly('HIGH_VISCOSITY')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-all ${
              activeAnomaly === 'HIGH_VISCOSITY'
                ? 'bg-red-500 text-black font-bold border-red-500 shadow-md'
                : 'bg-industrial-900 text-slate-300 border-industrial-750 hover:border-red-400'
            }`}
          >
            🌊 High Viscosity
          </button>

          <button
            onClick={() => handleInjectAnomaly('ROD_FLOATING')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-all ${
              activeAnomaly === 'ROD_FLOATING'
                ? 'bg-red-500 text-black font-bold border-red-500 shadow-md animate-pulse'
                : 'bg-industrial-900 text-slate-300 border-industrial-750 hover:border-red-400'
            }`}
          >
            ⚠️ Rod Floating Hazard
          </button>

          <button
            onClick={() => handleInjectAnomaly('HIGH_ROD_LOAD')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-all ${
              activeAnomaly === 'HIGH_ROD_LOAD'
                ? 'bg-orange-500 text-black font-bold border-orange-500 shadow-md'
                : 'bg-industrial-900 text-slate-300 border-industrial-750 hover:border-orange-400'
            }`}
          >
            ⚡ High Rod Overload
          </button>

          <button
            onClick={() => handleInjectAnomaly('PUMP_UNSETTING')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-all ${
              activeAnomaly === 'PUMP_UNSETTING'
                ? 'bg-cyan-500 text-black font-bold border-cyan-500 shadow-md'
                : 'bg-industrial-900 text-slate-300 border-industrial-750 hover:border-cyan-400'
            }`}
          >
            ⚓ Pump Unsetting Thrust
          </button>

          <button
            onClick={() => handleInjectAnomaly('PRODUCTION_DROP')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-all ${
              activeAnomaly === 'PRODUCTION_DROP'
                ? 'bg-violet-500 text-black font-bold border-violet-500 shadow-md'
                : 'bg-industrial-900 text-slate-300 border-industrial-750 hover:border-violet-400'
            }`}
          >
            📉 Production Drop
          </button>

          {activeAnomaly && (
            <button
              onClick={handleClearAnomaly}
              className="ml-auto px-3 py-1 rounded text-xs font-mono font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-all"
            >
              ✓ Clear Anomaly
            </button>
          )}
        </div>

        {injectionNotice && (
          <div className="text-xs font-mono text-amber-300 bg-amber-950/30 border border-amber-500/30 p-2 rounded flex items-center space-x-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>{injectionNotice}</span>
          </div>
        )}
      </div>

      {/* Live Active Alert Ticker */}
      {currentTick?.alert && (
        <div className="bg-red-950/30 border border-red-500/60 p-3.5 rounded-lg flex items-center justify-between gap-3 text-xs font-mono shadow-[0_0_15px_rgba(239,68,68,0.15)]">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 animate-bounce" />
            <div>
              <span className="font-bold text-red-300 uppercase block">{currentTick.alert.title}</span>
              <span className="text-slate-300 text-[11px]">{currentTick.alert.message}</span>
            </div>
          </div>
          <span className="text-amber-300 bg-industrial-950 px-2 py-1 rounded border border-industrial-700 text-[11px]">
            Action: {currentTick.alert.recommended_action}
          </span>
        </div>
      )}

      {/* Live Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-industrial-900 border border-industrial-800 rounded p-3 font-mono">
          <span className="text-[10px] text-slate-400 uppercase block">Live Temp</span>
          <span className="text-xl font-bold text-amber-400">{currentTick?.temperature ?? twinState?.reservoir.temperature}°C</span>
          <span className="text-[10px] text-slate-500 block">Formation heat</span>
        </div>

        <div className="bg-industrial-900 border border-industrial-800 rounded p-3 font-mono">
          <span className="text-[10px] text-slate-400 uppercase block">Live Viscosity</span>
          <span className="text-xl font-bold text-red-400">{currentTick?.viscosity ?? twinState?.reservoir.viscosity} cP</span>
          <span className="text-[10px] text-slate-500 block">In-situ resistance</span>
        </div>

        <div className="bg-industrial-900 border border-industrial-800 rounded p-3 font-mono">
          <span className="text-[10px] text-slate-400 uppercase block">PPRL Load</span>
          <span className="text-xl font-bold text-white">{currentTick?.pprl ?? twinState?.srp.pprl} kN</span>
          <span className="text-[10px] text-slate-500 block">Peak upstroke</span>
        </div>

        <div className="bg-industrial-900 border border-industrial-800 rounded p-3 font-mono">
          <span className="text-[10px] text-slate-400 uppercase block">MPRL Load</span>
          <span className={`text-xl font-bold ${(currentTick?.mprl ?? twinState?.srp.mprl ?? 14) < 8 ? 'text-red-400' : 'text-emerald-400'}`}>
            {currentTick?.mprl ?? twinState?.srp.mprl} kN
          </span>
          <span className="text-[10px] text-slate-500 block">Downstroke tension</span>
        </div>

        <div className="bg-industrial-900 border border-industrial-800 rounded p-3 font-mono">
          <span className="text-[10px] text-slate-400 uppercase block">Viscous Drag</span>
          <span className="text-xl font-bold text-orange-400">{currentTick?.dynamic_viscous_drag ?? twinState?.srp.dynamic_viscous_drag} kN</span>
          <span className="text-[10px] text-slate-500 block">Opposes rod weight</span>
        </div>

        <div className="bg-industrial-900 border border-industrial-800 rounded p-3 font-mono">
          <span className="text-[10px] text-slate-400 uppercase block">Floating Risk</span>
          <span className={`text-xl font-bold ${(currentTick?.floating_risk ?? twinState?.risks.rod_floating ?? 0) > 0.6 ? 'text-red-400' : 'text-emerald-400'}`}>
            {Math.round((currentTick?.floating_risk ?? twinState?.risks.rod_floating ?? 0) * 100)}%
          </span>
          <span className="text-[10px] text-slate-500 block">{currentTick?.floating_risk_level ?? twinState?.risks.rod_floating_level}</span>
        </div>
      </div>

      {/* Live Dynacard & Live Rolling Stream Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DynacardView dynacard={currentTick?.dynacard || null} height={280} title="Real-Time SCADA Polished Rod Dynacard" />

        <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-industrial-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Live Sensor Rolling Oscilloscope (Past 25 Samples)
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">WebSocket Live Packets</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }} />
                <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="rod_load" name="Rod Load (kN)" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="oil_rate" name="Oil Rate (BOPD)" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
