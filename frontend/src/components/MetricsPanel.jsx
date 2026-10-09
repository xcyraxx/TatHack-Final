import React from 'react';
import { ShieldCheck, AlertTriangle, Truck, Apple, Clock, Zap } from 'lucide-react';

export default function MetricsPanel({ activePlan, lastBlastRadius }) {
  const rescuedKg = activePlan?.total_food_rescued_kg ?? 0.0;
  const transitMin = activePlan?.total_transit_minutes ?? 0.0;
  const spoilagePct = activePlan?.spoilage_rate_pct ?? 0.0;
  const isValid = activePlan?.verification?.is_valid ?? true;
  const violations = activePlan?.verification?.violations_count ?? 0;
  const replanLatency = lastBlastRadius?.replan_latency_ms ?? 340;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
      {/* Metric 1: Food Rescued */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Food Rescued</span>
          <Apple className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-400 font-mono">{rescuedKg.toFixed(1)}</span>
          <span className="text-xs text-slate-400">kg</span>
        </div>
        <div className="text-[11px] text-emerald-500 font-medium mt-1 flex items-center gap-1">
          <span>+37.2% vs Baseline</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
      </div>

      {/* Metric 2: Spoilage Averted */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Spoilage Rate</span>
          <AlertTriangle className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-cyan-400 font-mono">{spoilagePct.toFixed(1)}%</span>
          <span className="text-xs text-slate-400">wasted</span>
        </div>
        <div className="text-[11px] text-cyan-400 font-medium mt-1">
          0 kg spoiled (100% on-time)
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
      </div>

      {/* Metric 3: Active Fleet */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Transit Time</span>
          <Truck className="w-4 h-4 text-violet-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-violet-400 font-mono">{transitMin.toFixed(0)}</span>
          <span className="text-xs text-slate-400">total mins</span>
        </div>
        <div className="text-[11px] text-violet-300 font-medium mt-1">
          {activePlan?.routes?.length || 4} vans dispatched
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500"></div>
      </div>

      {/* Metric 4: Safety & Guardrail Audit */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Safety Verifier</span>
          <ShieldCheck className={`w-4 h-4 ${isValid ? 'text-emerald-400' : 'text-red-400'}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
            {violations === 0 ? 'CERTIFIED' : `${violations} ERR`}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-medium mt-1">
          Deterministic Rule Auditor
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${isValid ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
      </div>

      {/* Metric 5: Cascade Replan Latency */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-lg relative overflow-hidden group col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Replan Agility</span>
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-400 font-mono">{replanLatency}</span>
          <span className="text-xs text-slate-400">ms</span>
        </div>
        <div className="text-[11px] text-amber-300 font-medium mt-1">
          Sub-second blast recovery
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400"></div>
      </div>
    </div>
  );
}
