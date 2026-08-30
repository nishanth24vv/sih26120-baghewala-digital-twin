import React from 'react';
import { AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';

interface RiskGaugeProps {
  label: string;
  probability: number; // 0.0 to 1.0
  level: string; // LOW, MEDIUM, HIGH, CRITICAL
  description?: string;
  trend?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  label,
  probability,
  level,
  description,
  trend,
  size = 'md',
}) => {
  const pct = Math.round(probability * 100);

  const levelConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
    LOW: {
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-500/30',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    },
    MEDIUM: {
      color: 'text-amber-400',
      bg: 'bg-amber-950/30',
      border: 'border-amber-500/30',
      icon: <AlertCircle className="w-4 h-4 text-amber-400" />,
    },
    HIGH: {
      color: 'text-orange-400',
      bg: 'bg-orange-950/30',
      border: 'border-orange-500/40',
      icon: <AlertTriangle className="w-4 h-4 text-orange-400" />,
    },
    CRITICAL: {
      color: 'text-red-400',
      bg: 'bg-red-950/40',
      border: 'border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
      icon: <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />,
    },
  };

  const cfg = levelConfig[level] || levelConfig.LOW;

  return (
    <div className={`rounded-lg p-4 border bg-industrial-900/90 ${cfg.border} transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">{label}</span>
        <div className="flex items-center space-x-1">
          {cfg.icon}
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${cfg.border} ${cfg.bg} ${cfg.color}`}>
            {level}
          </span>
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-2">
        <div className="flex items-baseline space-x-1">
          <span className={`text-3xl font-bold font-mono tracking-tight ${cfg.color}`}>{pct}%</span>
          <span className="text-xs font-mono text-slate-400">probability</span>
        </div>
        {trend && <span className="text-xs font-mono text-slate-400">{trend}</span>}
      </div>

      {/* Probability Progress Bar */}
      <div className="w-full bg-industrial-950 h-2 rounded-full mt-3 overflow-hidden border border-industrial-800">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            pct >= 80 ? 'bg-red-500' : pct >= 60 ? 'bg-orange-500' : pct >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {description && <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">{description}</p>}
    </div>
  );
};
