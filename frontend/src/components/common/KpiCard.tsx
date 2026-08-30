import React from 'react';
import { HelpCircle } from 'lucide-react';
import { TOOLTIPS } from '../../utils/units';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  tooltipKey?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral' | 'warning';
  status?: 'normal' | 'warning' | 'critical' | 'info';
  icon?: React.ReactNode;
  subtext?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  tooltipKey,
  trend,
  trendType = 'neutral',
  status = 'normal',
  icon,
  subtext,
}) => {
  const tooltipText = tooltipKey ? TOOLTIPS[tooltipKey] : null;

  const statusBorder = {
    normal: 'border-industrial-750 hover:border-industrial-600',
    warning: 'border-amber-500/50 bg-amber-950/10 shadow-[0_0_15px_rgba(245,158,11,0.08)]',
    critical: 'border-red-500/60 bg-red-950/15 shadow-[0_0_15px_rgba(239,68,68,0.12)]',
    info: 'border-cyan-500/50 bg-cyan-950/10 shadow-[0_0_15px_rgba(6,182,212,0.08)]',
  }[status];

  const trendColor = {
    positive: 'text-emerald-400',
    negative: 'text-red-400',
    warning: 'text-amber-400',
    neutral: 'text-slate-400',
  }[trendType];

  return (
    <div className={`relative bg-industrial-900/90 rounded-lg p-4 border transition-all duration-200 ${statusBorder}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
          {tooltipText && (
            <div className="group relative cursor-help">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block z-50 w-56 p-2 bg-industrial-950 border border-industrial-700 text-xs text-slate-200 rounded shadow-xl pointer-events-none">
                {tooltipText}
              </div>
            </div>
          )}
        </div>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold font-mono tracking-tight text-white">{value}</span>
        {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
      </div>

      {(trend || subtext) && (
        <div className="mt-2 pt-2 border-t border-industrial-800 flex items-center justify-between text-xs">
          {trend && <span className={`font-mono ${trendColor}`}>{trend}</span>}
          {subtext && <span className="text-slate-500 truncate ml-auto">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
