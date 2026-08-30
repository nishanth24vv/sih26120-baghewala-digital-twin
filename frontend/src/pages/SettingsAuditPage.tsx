import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuditItem } from '../types';
import { OPERATING_CONSTRAINTS } from '../utils/constraints';
import { Settings, ShieldCheck, RefreshCw, Clock, User, CheckCircle2, Sliders } from 'lucide-react';

export const SettingsAuditPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAudit = () => {
    setIsLoading(true);
    api.getAuditLog()
      .then(setAuditLogs)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-slate-300" />
            <h1 className="text-lg font-bold uppercase tracking-wider text-white">
              System Configuration & Supervisory Audit Log
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Compliance and accountability trail recording every AI recommendation, operator review, and state change.
          </p>
        </div>

        <button
          onClick={fetchAudit}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-industrial-950 border border-industrial-750 text-xs font-mono text-slate-300 hover:text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Operating Constraints Reference Table */}
      <div className="bg-industrial-900 border border-industrial-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-industrial-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyber-amber" />
            <span>Central Operating Constraints & Safety Boundaries</span>
          </h3>
          <span className="text-[11px] font-mono text-emerald-400">Enforced by Optimizer & Sliders</span>
        </div>

        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-industrial-950 text-slate-400 border-b border-industrial-800">
            <tr>
              <th className="p-3">Parameter</th>
              <th className="p-3">Min Boundary</th>
              <th className="p-3">Max Boundary</th>
              <th className="p-3">Step Size</th>
              <th className="p-3">Default</th>
              <th className="p-3">Unit</th>
              <th className="p-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-800/60">
            {Object.entries(OPERATING_CONSTRAINTS).map(([k, c]) => (
              <tr key={k} className="hover:bg-industrial-850">
                <td className="p-3 font-bold text-white">{c.label}</td>
                <td className="p-3 text-cyan-400">{c.min}</td>
                <td className="p-3 text-amber-400">{c.max}</td>
                <td className="p-3">{c.step}</td>
                <td className="p-3 text-emerald-400 font-bold">{c.default}</td>
                <td className="p-3 text-slate-400">{c.unit}</td>
                <td className="p-3 text-slate-400">{c.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audit Log Chronological Timeline */}
      <div className="bg-industrial-900 border border-industrial-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-industrial-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Immutable Supervisory Audit Trail ({auditLogs.length} Records)</span>
          </h3>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            No operator approvals recorded yet. Run Joint Optimizer or Simulation to create audit entries.
          </div>
        ) : (
          <div className="divide-y divide-industrial-800">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 space-y-2 font-mono text-xs hover:bg-industrial-850 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{log.timestamp}</span>
                    </span>
                    <span className="text-white font-bold bg-industrial-950 px-2 py-0.5 rounded border border-industrial-800">
                      {log.well_id}
                    </span>
                    <span className="text-cyan-300 flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{log.user}</span>
                    </span>
                  </div>

                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold text-[10px]">
                    {log.approval_status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-industrial-950 p-2.5 rounded border border-industrial-800 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Recommended Settings:</span>
                    <span className="text-amber-300 truncate block">
                      {JSON.stringify(log.recommended_parameters)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Final Approved Settings:</span>
                    <span className="text-emerald-300 truncate block">
                      {JSON.stringify(log.final_approved_parameters)}
                    </span>
                  </div>
                </div>

                <p className="text-slate-400 text-xs italic">
                  <b>Reason:</b> {log.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
