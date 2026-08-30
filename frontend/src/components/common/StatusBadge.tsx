import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getBadgeStyle = (st: string) => {
    switch (st.toUpperCase()) {
      case 'ACTIVE':
      case 'NORMAL_WELL':
      case 'HEALTHY':
      case 'LOW':
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40';
      case 'COOLING_RESERVOIR':
      case 'HIGH_VISCOSITY':
      case 'MEDIUM':
      case 'SOAKING':
      case 'WARNING':
        return 'bg-amber-950/40 text-amber-400 border-amber-500/40';
      case 'HIGH_ROD_LOAD':
      case 'HIGH_SOR':
      case 'HIGH':
        return 'bg-orange-950/40 text-orange-400 border-orange-500/40';
      case 'ROD_FLOATING':
      case 'CRITICAL':
      case 'PUMP_UNSETTING':
      case 'PRODUCTION_DECLINE':
      case 'SHUT_IN':
        return 'bg-red-950/40 text-red-400 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.2)]';
      case 'STEAM_INJECTION':
      case 'INFO':
        return 'bg-cyan-950/40 text-cyan-400 border-cyan-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${getBadgeStyle(
        status
      )} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
