import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ModelMetadata } from '../types';
import { BarChart3, RefreshCw, Cpu, CheckCircle2, ShieldCheck, Database, Calendar } from 'lucide-react';

export const ModelPerformancePage: React.FC = () => {
  const [meta, setMeta] = useState<ModelMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getModelPerformance()
      .then(setMeta)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-cyber-amber mr-2" />
        <span>Loading model evaluation metrics...</span>
      </div>
    );
  }

  if (!meta || !meta.models) {
    return (
      <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-8 text-center text-slate-400">
        No model evaluation metadata available. Run <code>python scripts/train_models.py</code> to generate.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-bold uppercase tracking-wider text-white">
              ML Model Lifecycle & Empirical Test Evaluation
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Metrics evaluated strictly on held-out temporal test dataset (zero data leakage).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-300">
          <div className="flex items-center space-x-1.5 bg-industrial-950 px-2.5 py-1 rounded border border-industrial-800">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dataset: <b>{meta.total_samples} samples</b> (Train: {meta.train_samples} | Test: {meta.test_samples})</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-industrial-950 px-2.5 py-1 rounded border border-industrial-800">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Split: <b>{meta.split_strategy}</b></span>
          </div>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.entries(meta.models).map(([key, model]) => (
          <div key={key} className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">{model.name}</h3>
                  <span className="text-[11px] font-mono text-cyan-400">{model.algorithm} • {model.version}</span>
                </div>
                {model.confidence_tier === 'HIGH_CONFIDENCE_EMPIRICAL' ? (
                  <span className="text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/40">
                    HIGH CONFIDENCE
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold bg-amber-950/80 text-amber-400 px-2 py-0.5 rounded border border-amber-500/40">
                    EARLY WARNING
                  </span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-industrial-800 space-y-2 font-mono text-xs">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Evaluated Test Metrics:</span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(model.metrics).map(([mKey, mVal]) => (
                    <div key={mKey} className="bg-industrial-950 p-2 rounded border border-industrial-800/80">
                      <span className="text-[10px] text-slate-400 uppercase block">{mKey.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-bold text-white">{mVal}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Importances */}
              {model.feature_importances && (
                <div className="mt-4 pt-3 border-t border-industrial-800 space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
                    Top Feature Importances:
                  </span>
                  <div className="space-y-1 font-mono text-[11px]">
                    {Object.entries(model.feature_importances)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4)
                      .map(([fName, fWeight]) => (
                        <div key={fName} className="flex items-center justify-between text-slate-300">
                          <span className="truncate max-w-[140px] text-slate-400">{fName}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-industrial-950 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${fWeight * 100}%` }} />
                            </div>
                            <span className="font-bold text-white text-[10px]">{(fWeight * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-industrial-800 text-[10px] font-mono text-slate-500 truncate">
              Target: {model.target}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
