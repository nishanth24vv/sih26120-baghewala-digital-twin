import React from 'react';
import { DynacardData } from '../../types';

interface DynacardViewProps {
  dynacard: DynacardData | null;
  title?: string;
  height?: number;
}

export const DynacardView: React.FC<DynacardViewProps> = ({
  dynacard,
  title = "Surface & Downhole Dynamometer Card (Dynacard)",
  height = 260,
}) => {
  if (!dynacard || !dynacard.surface_card || dynacard.surface_card.length === 0) {
    return (
      <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 h-64">
        <span>No dynamometer card telemetry available</span>
      </div>
    );
  }

  const {
    surface_card, downhole_card, pprl_kn, mprl_kn, stroke_length_in, spm,
    card_type, diagnostic_desc, card_area_kj, card_area_in_lbs, prhp_hp, prhp_kw, pump_fillage_pct, load_span_kn
  } = dynacard;

  // Compute SVG viewBox dimensions
  const svgWidth = 460;
  const svgHeight = height;
  const padding = { top: 25, right: 30, bottom: 40, left: 55 };

  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  // Max load scale with margin
  const maxLoad = Math.max(pprl_kn * 1.25, 120);
  const minLoad = 0;

  // Coordinate mappers
  const getX = (pos: number) => padding.left + (pos / Math.max(stroke_length_in, 1)) * innerWidth;
  const getY = (load: number) => padding.top + innerHeight - ((load - minLoad) / (maxLoad - minLoad)) * innerHeight;

  // Generate SVG path strings
  const surfacePath = surface_card.reduce((acc, pt, idx) => {
    const x = getX(pt.position_in);
    const y = getY(pt.load_kn);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "") + " Z";

  const downholePath = downhole_card && downhole_card.length > 0
    ? downhole_card.reduce((acc, pt, idx) => {
        const x = getX(pt.position_in);
        const y = getY(pt.load_kn);
        return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
      }, "") + " Z"
    : "";

  return (
    <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-industrial-800">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">{title}</h4>
          <span className="text-xs font-mono text-cyan-400 font-semibold">{card_type}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono">
          <span className="text-slate-400">PPRL: <b className="text-white">{pprl_kn} kN</b></span>
          <span className="text-slate-400">MPRL: <b className="text-white">{mprl_kn} kN</b></span>
          <span className="text-slate-400">Span: <b className="text-cyan-300">{load_span_kn || (pprl_kn - mprl_kn).toFixed(1)} kN</b></span>
          <span className="text-slate-400">Stroke: <b className="text-white">{stroke_length_in}"</b></span>
          <span className="text-slate-400">SPM: <b className="text-white">{spm}</b></span>
        </div>
      </div>

      {diagnostic_desc && (
        <div className="mb-2 px-2.5 py-1 rounded bg-industrial-950/80 border border-industrial-750 text-[11px] font-mono text-slate-300 flex items-center space-x-1.5">
          <span className="text-cyber-amber">●</span>
          <span><b>Diagnosis:</b> {diagnostic_desc}</span>
        </div>
      )}

      <div className="relative w-full overflow-hidden flex justify-center">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[540px] h-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
            const y = padding.top + innerHeight * (1 - frac);
            const loadVal = Math.round(minLoad + frac * (maxLoad - minLoad));
            return (
              <g key={`y-grid-${i}`}>
                <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-slate-500 font-mono text-[10px]">
                  {loadVal} kN
                </text>
              </g>
            );
          })}

          {[0, 0.5, 1.0].map((frac, i) => {
            const x = padding.left + innerWidth * frac;
            const posVal = Math.round(frac * stroke_length_in);
            return (
              <g key={`x-grid-${i}`}>
                <line x1={x} y1={padding.top} x2={x} y2={padding.top + innerHeight} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={x} y={padding.top + innerHeight + 16} textAnchor="middle" className="fill-slate-500 font-mono text-[10px]">
                  {posVal}"
                </text>
              </g>
            );
          })}

          {/* Safe operating envelope / limit */}
          <line
            x1={padding.left}
            y1={getY(110)}
            x2={svgWidth - padding.right}
            y2={getY(110)}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x={svgWidth - padding.right - 5} y={getY(110) - 5} textAnchor="end" className="fill-red-400 font-mono text-[9px]">
            Max Allowable Rod Stress (85% Yield)
          </text>

          {/* Downhole Card (Dashed Cyan) */}
          {downholePath && (
            <path
              d={downholePath}
              fill="rgba(6, 182, 212, 0.08)"
              stroke="#06b6d4"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Surface Dynacard Loop (Amber / Emerald) */}
          <path
            d={surfacePath}
            fill="rgba(245, 158, 11, 0.12)"
            stroke="#f59e0b"
            strokeWidth="2.5"
            className="filter drop-shadow-[0_0_8px_rgba(245,158,11,0.25)]"
          />

          {/* Axis Labels */}
          <text
            x={padding.left + innerWidth / 2}
            y={svgHeight - 8}
            textAnchor="middle"
            className="fill-slate-400 font-mono text-[11px] font-semibold"
          >
            Polished Rod Position (inches)
          </text>
        </svg>
      </div>

      {/* Numerical Card Area & Polished Rod Power Bar */}
      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-industrial-800 text-[10px] font-mono text-center">
        <div className="bg-industrial-950 p-1.5 rounded border border-industrial-800">
          <span className="text-slate-500 block">CARD WORK / AREA</span>
          <span className="text-amber-400 font-bold">
            {card_area_kj ? `${card_area_kj} kJ` : '—'}
          </span>
          <span className="text-slate-400 text-[9px] block">
            {card_area_in_lbs ? `(${card_area_in_lbs} in·lbf)` : ''}
          </span>
        </div>
        <div className="bg-industrial-950 p-1.5 rounded border border-industrial-800">
          <span className="text-slate-500 block">POLISHED ROD POWER</span>
          <span className="text-cyan-400 font-bold">
            {prhp_kw ? `${prhp_kw} kW` : '—'}
          </span>
          <span className="text-slate-400 text-[9px] block">
            {prhp_hp ? `(${prhp_hp} HP)` : ''}
          </span>
        </div>
        <div className="bg-industrial-950 p-1.5 rounded border border-industrial-800">
          <span className="text-slate-500 block">PUMP FILLAGE</span>
          <span className="text-emerald-400 font-bold">
            {pump_fillage_pct ? `${pump_fillage_pct}%` : '—'}
          </span>
          <span className="text-slate-400 text-[9px] block">Volumetric stroke</span>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-6 mt-2 pt-1.5 text-[11px] font-mono text-slate-400">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-1 bg-cyber-amber rounded-sm"></span>
          <span>Surface Dynacard</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-1 bg-cyber-cyan border-b border-dashed border-cyan-400 rounded-sm"></span>
          <span>Downhole Pump Card</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-0.5 bg-red-500"></span>
          <span>85% Yield Cap</span>
        </div>
      </div>
    </div>
  );
};
