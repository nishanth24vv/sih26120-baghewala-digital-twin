import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Search, Cpu, Flame, Gauge,
  Layers, TrendingUp, ShieldAlert, Radio,
  FlaskConical, BarChart3, Settings
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navGroups = [
    {
      title: 'CORE',
      items: [
        { label: 'Overview', to: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Well Explorer', to: '/wells', icon: <Search className="w-4 h-4" /> },
        { label: 'Digital Twin', to: '/digital-twin', icon: <Cpu className="w-4 h-4" /> },
      ],
    },
    {
      title: 'OPTIMIZATION',
      items: [
        { label: 'Joint Optimizer', to: '/optimization/joint', icon: <Layers className="w-4 h-4 text-cyber-amber" />, hero: true },
        { label: 'CSS Optimization', to: '/optimization/css', icon: <Flame className="w-4 h-4 text-amber-400" /> },
        { label: 'SRP Optimization', to: '/optimization/srp', icon: <Gauge className="w-4 h-4 text-cyan-400" /> },
      ],
    },
    {
      title: 'AI & PREDICTIONS',
      items: [
        { label: 'Production Forecast', to: '/predictions', icon: <TrendingUp className="w-4 h-4 text-emerald-400" /> },
        { label: 'Risk & Reliability', to: '/risks', icon: <ShieldAlert className="w-4 h-4 text-red-400" /> },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Live Monitoring', to: '/monitoring', icon: <Radio className="w-4 h-4 text-cyan-400" /> },
        { label: 'Simulation Sandbox', to: '/simulation', icon: <FlaskConical className="w-4 h-4 text-violet-400" /> },
      ],
    },
    {
      title: 'GOVERNANCE',
      items: [
        { label: 'Model Performance', to: '/models', icon: <BarChart3 className="w-4 h-4 text-slate-400" /> },
        { label: 'Audit Log & Config', to: '/settings', icon: <Settings className="w-4 h-4 text-slate-400" /> },
      ],
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-industrial-950 border-r border-industrial-800 flex flex-col h-[calc(100vh-53px)] sticky top-[53px] overflow-y-auto">
      <div className="p-3 space-y-5">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase px-3 block">
              {group.title}
            </span>
            <div className="space-y-0.5">
              {group.items.map((item, iIdx) => (
                <NavLink
                  key={iIdx}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-mono transition-all ${
                      isActive
                        ? 'bg-industrial-850 text-white font-bold border-l-2 border-cyber-amber shadow-inner'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-industrial-900'
                    } ${item.hero ? 'ring-1 ring-cyber-amber/30 bg-cyber-amber/5' : ''}`
                  }
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                  {item.hero && (
                    <span className="ml-auto text-[9px] font-mono font-bold bg-cyber-amber text-black px-1.5 py-0.2 rounded">
                      HERO
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto p-3 border-t border-industrial-850 bg-industrial-900/60">
        <div className="text-[10px] font-mono text-slate-500 space-y-0.5">
          <div>Baghewala Field Prototype</div>
          <div>Coupled CSS-SRP Digital Twin</div>
          <div className="text-cyan-400/80">Smart India Hackathon 2026</div>
        </div>
      </div>
    </aside>
  );
};
