import React from 'react';
import { Terminal, Clock, ShieldCheck, Zap } from 'lucide-react';

export default function DecisionTimeline({ auditLogs }) {
  const logs = auditLogs || [];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full max-h-[380px]">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Autonomous Decision & Audit Feed
          </h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Live Operations Log</span>
      </div>

      <div className="overflow-y-auto space-y-2.5 pr-1 flex-1 font-mono text-[11px]">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic py-4 text-center">No operational events recorded yet.</div>
        ) : (
          logs.slice().reverse().map((entry, idx) => {
            const isAlert = entry.action.includes('DISRUPTION') || entry.action.includes('SURGE');
            const isVerify = entry.stage.includes('OPTIMIZER') || entry.stage.includes('CASCADE');

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border transition-all ${
                  isAlert
                    ? 'bg-rose-950/30 border-rose-900/60 text-rose-200'
                    : isVerify
                    ? 'bg-slate-950/80 border-cyan-900/40 text-slate-300'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    {isAlert ? (
                      <span className="text-rose-400 font-sans text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-rose-950 border border-rose-800">
                        PERTURBATION
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-sans text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                        {entry.stage}
                      </span>
                    )}
                    <span className="text-slate-200 font-semibold">{entry.action}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-slate-300 leading-relaxed text-[11px] font-sans">
                  {entry.details}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
