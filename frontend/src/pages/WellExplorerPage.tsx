import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTwin } from '../context/TwinContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Search, Filter, LayoutGrid, Table as TableIcon, ArrowRight, Activity, Flame, Gauge } from 'lucide-react';

export const WellExplorerPage: React.FC = () => {
  const { wellsList, setSelectedWellId } = useTwin();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const navigate = useNavigate();

  const filteredWells = wellsList.filter(w => {
    const matchesSearch =
      w.well_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || w.scenario_type === statusFilter || w.status === statusFilter;

    const matchesRisk =
      riskFilter === 'ALL' ||
      (riskFilter === 'HIGH' && w.current_floating_risk >= 0.60) ||
      (riskFilter === 'MEDIUM' && w.current_floating_risk >= 0.30 && w.current_floating_risk < 0.60) ||
      (riskFilter === 'LOW' && w.current_floating_risk < 0.30);

    return matchesSearch && matchesStatus && matchesRisk;
  });

  const handleOpenWell = (wellId: string) => {
    setSelectedWellId(wellId);
    navigate('/digital-twin');
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Well ID or Pad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-industrial-950 border border-industrial-750 text-xs font-mono pl-9 pr-3 py-1.5 rounded focus:outline-none focus:border-cyber-amber w-64 text-white"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Scenario:</span>
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-industrial-950 border border-industrial-750 rounded px-2 py-1 text-white text-xs focus:outline-none"
            >
              <option value="ALL">All Scenarios</option>
              <option value="NORMAL_WELL">Normal Wells</option>
              <option value="COOLING_RESERVOIR">Cooling Reservoir</option>
              <option value="HIGH_ROD_LOAD">High Rod Load</option>
              <option value="HIGH_SOR">High SOR</option>
              <option value="PUMP_UNSETTING">Pump Unsetting</option>
              <option value="HIGH_VISCOSITY">High Viscosity</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400">Risk Level:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-industrial-950 border border-industrial-750 rounded px-2 py-1 text-white text-xs focus:outline-none"
            >
              <option value="ALL">All Risk Bands</option>
              <option value="HIGH">High / Critical (≥60%)</option>
              <option value="MEDIUM">Medium (30–60%)</option>
              <option value="LOW">Low (&lt;30%)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-industrial-950 border border-industrial-800 rounded p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-industrial-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            title="Grid Card View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-industrial-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            title="Dense Table View"
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Cards View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWells.map((w) => {
            const isCritical = w.current_floating_risk >= 0.70;
            return (
              <div
                key={w.well_id}
                className={`bg-industrial-900 border rounded-lg p-4 transition-all hover:border-slate-500 flex flex-col justify-between ${
                  w.well_id === 'BGW-001'
                    ? 'border-cyber-amber/60 shadow-[0_0_15px_rgba(245,158,11,0.08)] bg-amber-950/10'
                    : isCritical
                    ? 'border-red-500/40 bg-red-950/10'
                    : 'border-industrial-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-white font-mono">{w.well_id}</h3>
                        {w.well_id === 'BGW-001' && (
                          <span className="text-[9px] bg-cyber-amber text-black font-bold px-1.5 rounded">DEMO</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{w.name}</p>
                    </div>
                    <StatusBadge status={w.scenario_type} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 my-3 pt-3 border-t border-industrial-800 text-xs font-mono">
                    <div className="bg-industrial-950 p-2 rounded">
                      <span className="text-[10px] text-slate-400 uppercase block">Oil Rate</span>
                      <span className="text-sm font-bold text-emerald-400">{w.current_oil_rate}</span>
                      <span className="text-[10px] text-slate-500 block">BOPD</span>
                    </div>

                    <div className="bg-industrial-950 p-2 rounded">
                      <span className="text-[10px] text-slate-400 uppercase block">In-Situ Temp</span>
                      <span className="text-sm font-bold text-white">{w.current_temperature}°C</span>
                      <span className="text-[10px] text-slate-500 block">{w.current_viscosity} cP</span>
                    </div>

                    <div className="bg-industrial-950 p-2 rounded">
                      <span className="text-[10px] text-slate-400 uppercase block">Rod Float</span>
                      <span
                        className={`text-sm font-bold ${
                          w.current_floating_risk >= 0.60
                            ? 'text-red-400'
                            : w.current_floating_risk >= 0.30
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {Math.round(w.current_floating_risk * 100)}%
                      </span>
                      <span className="text-[10px] text-slate-500 block">{w.current_spm} SPM</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenWell(w.well_id)}
                  className="mt-3 w-full py-1.5 rounded bg-industrial-950 border border-industrial-750 hover:border-cyber-amber hover:text-cyber-amber text-xs font-mono flex items-center justify-center space-x-1.5 transition-all text-slate-300"
                >
                  <span>Open Digital Twin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-industrial-900 border border-industrial-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-industrial-950 text-slate-400 border-b border-industrial-800">
              <tr>
                <th className="p-3">Well ID</th>
                <th className="p-3">Scenario</th>
                <th className="p-3">Oil Rate</th>
                <th className="p-3">Temperature</th>
                <th className="p-3">Viscosity</th>
                <th className="p-3">SOR</th>
                <th className="p-3">SPM</th>
                <th className="p-3">Rod Load</th>
                <th className="p-3">Floating Risk</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800">
              {filteredWells.map((w) => (
                <tr key={w.well_id} className="hover:bg-industrial-850">
                  <td className="p-3 font-bold text-white">{w.well_id}</td>
                  <td className="p-3"><StatusBadge status={w.scenario_type} /></td>
                  <td className="p-3 text-emerald-400 font-semibold">{w.current_oil_rate} BOPD</td>
                  <td className="p-3">{w.current_temperature}°C</td>
                  <td className="p-3">{w.current_viscosity} cP</td>
                  <td className="p-3">{w.current_sor}</td>
                  <td className="p-3 text-cyan-300">{w.current_spm}</td>
                  <td className="p-3">{w.current_rod_load} kN</td>
                  <td className="p-3 font-bold text-amber-400">{Math.round(w.current_floating_risk * 100)}%</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleOpenWell(w.well_id)}
                      className="px-2 py-1 rounded bg-industrial-950 border border-industrial-750 hover:border-cyber-amber text-[11px]"
                    >
                      Open Twin
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
