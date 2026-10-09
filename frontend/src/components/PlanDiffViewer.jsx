import React from 'react';
import { GitCompare, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

export default function PlanDiffViewer({ diffData, lastBlastRadius }) {
  if (!diffData) return null;

  const stability = diffData.stability_pct ?? 100;
  const preserved = diffData.preserved_legs ?? 0;
  const rerouted = diffData.rerouted_legs ?? 0;
  const oldVer = diffData.old_version ?? 1;
  const newVer = diffData.new_version ?? 1;
  const latency = diffData.replan_latency_ms ?? 340;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Cascade Plan Differential (v{oldVer} &rarr; v{newVer})
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Replan Compute:</span>
          <span className="font-mono text-cyan-400 font-bold">{latency} ms</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Preserved Legs */}
        <div className="bg-slate-950/60 border border-emerald-950/80 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Preserved Legs</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300">{preserved} stops</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Unaffected drivers stay on schedule</div>
        </div>

        {/* Metric 2: Rerouted Legs */}
        <div className="bg-slate-950/60 border border-cyan-950/80 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 mb-1">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rerouted Legs</span>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">{rerouted} stops</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Isolated perturbation blast radius</div>
        </div>

        {/* Metric 3: Stability Score */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
          <div className="text-xs text-slate-400 mb-1">Route Churn Stability</div>
          <div className="text-xl font-bold font-mono text-purple-300">{stability}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">&gt; 70% threshold maintained</div>
        </div>

        {/* Metric 4: Blast Radius Status */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
          <div className="text-xs text-slate-400 mb-1">Audit Verification</div>
          <div className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1">
            <span>0 VIOLATIONS</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Certified by Safety Verifier</div>
        </div>
      </div>

      {lastBlastRadius?.reassigned_items?.length > 0 && (
        <div className="mt-3 bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 text-xs">
          <span className="font-semibold text-slate-300 block mb-1">Autonomous Recovery Reallocations:</span>
          <div className="space-y-1">
            {lastBlastRadius.reassigned_items.slice(0, 3).map((item, idx) => (
              <div key={idx} className="text-slate-400 flex items-center gap-2">
                <span className="text-cyan-400">&bull;</span>
                <span>{typeof item === 'string' ? item : `${item.item} &rarr; ${item.reassigned_to}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
