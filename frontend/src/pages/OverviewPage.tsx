import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTwin } from '../context/TwinContext';
import { KpiCard } from '../components/common/KpiCard';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Droplets, Flame, Zap, ShieldAlert, Activity,
  ArrowUpDown, ExternalLink, AlertCircle
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const { wellsList, setSelectedWellId, setIsDemoMode } = useTwin();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('current_floating_risk');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const navigate = useNavigate();

  // Field Level Aggregations
  const totalWells = wellsList.length;
  const activeWells = wellsList.filter(w => w.status === 'ACTIVE').length;
  const highRiskWells = wellsList.filter(w => w.current_floating_risk > 0.50 || w.current_failure_risk > 0.30).length;
  
  const avgOilRate = totalWells > 0
    ? (wellsList.reduce((acc, w) => acc + (w.current_oil_rate || 0), 0) / totalWells).toFixed(1)
    : '0.0';

  const totalOilRate = totalWells > 0
    ? wellsList.reduce((acc, w) => acc + (w.current_oil_rate || 0), 0).toFixed(0)
    : '0';

  const avgSOR = totalWells > 0
    ? (wellsList.reduce((acc, w) => acc + (w.current_sor || 0), 0) / totalWells).toFixed(2)
    : '0.00';

  const avgEnergy = totalWells > 0
    ? (wellsList.reduce((acc, w) => acc + (w.current_energy || 0), 0) / totalWells).toFixed(1)
    : '0.0';

  // Filter and sort wells
  const filteredWells = wellsList.filter(w =>
    w.well_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.scenario_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedWells = [...filteredWells].sort((a, b) => {
    const valA = (a as any)[sortField] ?? 0;
    const valB = (b as any)[sortField] ?? 0;
    return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
  });

  const handleSelectWell = (wellId: string) => {
    setSelectedWellId(wellId);
    if (wellId === 'BGW-001') setIsDemoMode(true);
    navigate('/digital-twin');
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Field Overview Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-industrial-900 border border-industrial-800 rounded-lg p-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold uppercase tracking-wider text-white">
              Baghewala Heavy-Oil Field Overview
            </h1>
            <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
              ● FIELD ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Bikaner-Nagaur Basin • CSS Thermal Recovery Coupled with Surface Sucker Rod Pumping (SRP)
          </p>
        </div>

        {/* Demo Callout banner */}
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-lg px-3.5 py-2 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-300 font-mono block">Judging Demo Notice:</span>
            <span className="text-slate-300 text-[11px]">
              Well <b>BGW-001</b> exhibits acute cooling, elevated viscosity (1,280 cP), and 78% rod-floating hazard.
            </span>
          </div>
          <button
            onClick={() => handleSelectWell('BGW-001')}
            className="px-2.5 py-1 bg-cyber-amber text-black font-mono font-bold text-xs rounded hover:bg-amber-400 transition-all flex-shrink-0"
          >
            Inspect BGW-001
          </button>
        </div>
      </div>

      {/* Fleet KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <KpiCard
          label="Total Fleet"
          value={totalWells}
          unit="wells"
          subtext={`${activeWells} producing active`}
          icon={<Activity className="w-4 h-4 text-slate-400" />}
        />
        <KpiCard
          label="Total Oil Rate"
          value={totalOilRate}
          unit="BOPD"
          trend="+4.2% fleet trend"
          trendType="positive"
          icon={<Droplets className="w-4 h-4 text-emerald-400" />}
        />
        <KpiCard
          label="Avg Well Rate"
          value={avgOilRate}
          unit="BOPD"
          tooltipKey="BOPD"
          icon={<Droplets className="w-4 h-4 text-cyan-400" />}
        />
        <KpiCard
          label="Avg Field SOR"
          value={avgSOR}
          unit="m³/m³"
          tooltipKey="SOR"
          status={parseFloat(avgSOR) > 5.0 ? 'warning' : 'normal'}
          icon={<Flame className="w-4 h-4 text-amber-400" />}
        />
        <KpiCard
          label="Avg Lifting Energy"
          value={avgEnergy}
          unit="kWh/bbl"
          icon={<Zap className="w-4 h-4 text-violet-400" />}
        />
        <KpiCard
          label="High-Risk Wells"
          value={highRiskWells}
          unit="alerts"
          status={highRiskWells > 0 ? 'critical' : 'normal'}
          subtext="Require Joint Tuning"
          icon={<ShieldAlert className="w-4 h-4 text-red-400" />}
        />
      </div>

      {/* Fleet Wells Summary Table */}
      <div className="bg-industrial-900 border border-industrial-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-industrial-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Field Wells Telemetry Matrix ({filteredWells.length} Wells)
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search well ID or scenario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-industrial-950 border border-industrial-750 text-xs font-mono px-3 py-1.5 rounded focus:outline-none focus:border-cyber-amber w-60 text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-industrial-950/80 text-slate-400 border-b border-industrial-800">
              <tr>
                <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('well_id')}>
                  <div className="flex items-center space-x-1">
                    <span>Well ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3">Scenario / Status</th>
                <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('current_oil_rate')}>
                  <div className="flex items-center space-x-1">
                    <span>Oil Rate</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('current_temperature')}>
                  <div className="flex items-center space-x-1">
                    <span>Temp</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('current_viscosity')}>
                  <div className="flex items-center space-x-1">
                    <span>Viscosity</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('current_sor')}>
                  <div className="flex items-center space-x-1">
                    <span>SOR</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('current_spm')}>
                  <div className="flex items-center space-x-1">
                    <span>SPM</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('current_pump_eff')}>
                  <div className="flex items-center space-x-1">
                    <span>Pump Eff</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('current_floating_risk')}>
                  <div className="flex items-center space-x-1">
                    <span>Rod Float Risk</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800/60">
              {sortedWells.map((w) => {
                const isHighRisk = w.current_floating_risk > 0.60;
                return (
                  <tr
                    key={w.well_id}
                    className={`hover:bg-industrial-850/60 transition-all ${
                      w.well_id === 'BGW-001' ? 'bg-amber-950/15 border-l-2 border-cyber-amber' : ''
                    }`}
                  >
                    <td className="p-3 font-bold text-white flex items-center space-x-1.5">
                      <span>{w.well_id}</span>
                      {w.well_id === 'BGW-001' && (
                        <span className="text-[9px] bg-cyber-amber text-black font-bold px-1 rounded">DEMO</span>
                      )}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={w.scenario_type} />
                    </td>
                    <td className="p-3 font-semibold text-emerald-400">{w.current_oil_rate} BOPD</td>
                    <td className="p-3">{w.current_temperature}°C</td>
                    <td className="p-3 text-slate-300">{w.current_viscosity} cP</td>
                    <td className="p-3">{w.current_sor}</td>
                    <td className="p-3 text-cyan-300">{w.current_spm}</td>
                    <td className="p-3">{w.current_pump_eff}%</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          w.current_floating_risk >= 0.70
                            ? 'bg-red-950/60 text-red-400 border border-red-500/50'
                            : w.current_floating_risk >= 0.40
                            ? 'bg-amber-950/40 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {Math.round(w.current_floating_risk * 100)}%
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleSelectWell(w.well_id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-industrial-950 border border-industrial-750 hover:border-cyber-amber hover:text-cyber-amber transition-all text-[11px]"
                      >
                        <span>Twin View</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
