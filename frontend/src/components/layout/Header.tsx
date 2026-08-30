import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTwin } from '../../context/TwinContext';
import {
  Flame, Radio, RefreshCw, AlertTriangle, ShieldCheck,
  ChevronRight, Play, CheckCircle2, Sliders, Activity
} from 'lucide-react';
import { api } from '../../services/api';

export const Header: React.FC = () => {
  const {
    selectedWellId,
    setSelectedWellId,
    wellsList,
    twinState,
    isDemoMode,
    setIsDemoMode,
    isJudgingMode,
    setIsJudgingMode,
    judgingStep,
    setJudgingStep,
    resetJudgingDemo,
    isLoading
  } = useTwin();

  const [backendHealth, setBackendHealth] = useState<string>('checking');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkHealth = () => {
      api.getHealth()
        .then(res => setBackendHealth(res.status))
        .catch(() => setBackendHealth('offline'));
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Judging Step definitions for smooth live presentation flow
  const judgingSteps = [
    { step: 1, label: 'Overview', route: '/', hint: 'Review field-wide status, active fleet, and identify high-risk wells.' },
    { step: 2, label: 'Well BGW-001', route: '/digital-twin', hint: 'Select BGW-001: Observe thermal decline, rising viscosity, and rod load.' },
    { step: 3, label: 'Twin Causal Flow', route: '/digital-twin', hint: 'Inspect connected Reservoir → Wellbore → Surface SRP state.' },
    { step: 4, label: 'Predictions', route: '/predictions', hint: 'View multi-month forecast of cooling curve & production decline.' },
    { step: 5, label: 'Risk Center', route: '/risks', hint: 'Examine Rod Floating (78% HIGH) and contributing shear drag factors.' },
    { step: 6, label: 'Joint Optimizer', route: '/optimization/joint', hint: 'Run Joint CSS + SRP Optimization: observe multi-objective search.' },
    { step: 7, label: 'AI Explainability', route: '/optimization/joint', hint: 'Review AI rationale: Why reducing SPM to 3.7 mitigates rod float.' },
    { step: 8, label: 'Before vs After', route: '/optimization/joint', hint: 'Compare deltas: +25% Production, -67% Floating Risk, -22% SOR.' },
    { step: 9, label: 'Simulation Sandbox', route: '/simulation', hint: 'Adjust parameters in what-if sandbox without mutating base well state.' },
    { step: 10, label: 'Approve to Twin', route: '/optimization/joint', hint: 'Operator approves recommendation; persist state and log to audit trail.' },
    { step: 11, label: 'Live Monitoring', route: '/monitoring', hint: 'Observe real-time dynacards, streaming sensors, and inject disturbances.' },
  ];

  const currentJudgingStep = judgingSteps[judgingStep - 1] || judgingSteps[0];

  const handleNextJudgingStep = () => {
    if (judgingStep < judgingSteps.length) {
      const nextStepNum = judgingStep + 1;
      setJudgingStep(nextStepNum);
      const nextStepObj = judgingSteps[nextStepNum - 1];
      navigate(nextStepObj.route);
    }
  };

  const handlePrevJudgingStep = () => {
    if (judgingStep > 1) {
      const prevStepNum = judgingStep - 1;
      setJudgingStep(prevStepNum);
      const prevStepObj = judgingSteps[prevStepNum - 1];
      navigate(prevStepObj.route);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-industrial-950/95 backdrop-blur border-b border-industrial-800 px-4 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Well Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-cyber-amber/10 border border-cyber-amber/40 flex items-center justify-center text-cyber-amber font-bold">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-cyber-amber block leading-tight">
                BAGHEWALA TWIN
              </span>
              <span className="text-[10px] font-mono text-slate-400 block leading-tight">
                SIH 26120 • Heavy Oil
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-industrial-800 mx-1 hidden sm:block" />

          {/* Active Well Selector */}
          <div className="flex items-center space-x-1.5 bg-industrial-900 border border-industrial-750 rounded px-2.5 py-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Active Well:</span>
            <select
              value={selectedWellId}
              onChange={(e) => setSelectedWellId(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
            >
              {wellsList.map((w) => (
                <option key={w.well_id} value={w.well_id} className="bg-industrial-950 text-white">
                  {w.well_id} — {w.name} ({w.scenario_type.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
            {twinState && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" title="Live Twin Synchronized" />
            )}
          </div>
        </div>

        {/* Center: Judging Mode / Demo Mode Controls */}
        <div className="flex items-center space-x-2">
          {/* Judging Mode Stepper Toggle */}
          <button
            onClick={() => {
              const newVal = !isJudgingMode;
              setIsJudgingMode(newVal);
              if (newVal) {
                setSelectedWellId('BGW-001');
                setIsDemoMode(true);
                navigate(currentJudgingStep.route);
              }
            }}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-mono font-semibold transition-all border ${
              isJudgingMode
                ? 'bg-cyber-amber text-black border-cyber-amber shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-industrial-900 text-slate-300 border-industrial-750 hover:border-slate-500'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isJudgingMode ? 'JUDGING DEMO ACTIVE' : 'START JUDGING DEMO'}</span>
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={resetJudgingDemo}
            disabled={isLoading}
            className="flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono text-slate-300 bg-industrial-900 border border-industrial-750 hover:bg-industrial-800 transition-all"
            title="Restore BGW-001 clean baseline dataset"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyber-amber' : 'text-slate-400'}`} />
            <span className="hidden md:inline">Reset Demo</span>
          </button>
        </div>

        {/* Right: System Health & Operator */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-industrial-900 border border-industrial-800">
            <span className={`w-2 h-2 rounded-full ${backendHealth === 'healthy' ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-slate-400 text-[11px]">Backend:</span>
            <span className="text-slate-200 font-bold text-[11px] uppercase">{backendHealth}</span>
          </div>

          <div className="hidden lg:flex items-center space-x-1 text-slate-400 text-[11px]">
            <span>Operator:</span>
            <b className="text-slate-200">Demo Operator</b>
          </div>
        </div>
      </div>

      {/* Judging Mode Navigation Banner */}
      {isJudgingMode && (
        <div className="mt-2 pt-2 border-t border-industrial-800/80 flex flex-wrap items-center justify-between gap-2 bg-industrial-900/60 -mx-4 -mb-2.5 px-4 py-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold bg-cyber-amber text-black px-2 py-0.5 rounded">
              DEMO STEP {judgingStep}/11
            </span>
            <span className="text-xs font-semibold text-white font-mono">{currentJudgingStep.label}:</span>
            <span className="text-xs text-slate-300">{currentJudgingStep.hint}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevJudgingStep}
              disabled={judgingStep === 1}
              className="px-2 py-0.5 rounded text-xs font-mono border border-industrial-700 bg-industrial-950 text-slate-300 disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              onClick={handleNextJudgingStep}
              disabled={judgingStep === judgingSteps.length}
              className="px-3 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-40 flex items-center space-x-1"
            >
              <span>Next Step</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
