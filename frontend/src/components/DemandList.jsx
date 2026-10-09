import React from 'react';
import { Home, Star, Clock } from 'lucide-react';

export default function DemandList({ demands }) {
  const activeDemands = demands || [];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full max-h-[380px]">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Shelter Demands ({activeDemands.length})
          </h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Recipient Requests</span>
      </div>

      <div className="overflow-y-auto space-y-2 pr-1 flex-1">
        {activeDemands.map((dem) => {
          const isPriority3 = dem.priority_level === 3;
          return (
            <div
              key={dem.id}
              className={`p-2.5 rounded-lg border text-xs transition-all ${
                isPriority3
                  ? 'bg-pink-950/20 border-pink-800/40 text-slate-200'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-100">{dem.recipient_name}</span>
                    {isPriority3 && (
                      <span className="flex items-center text-[10px] text-pink-400 bg-pink-950 px-1.5 py-0.2 rounded border border-pink-800">
                        <Star className="w-2.5 h-2.5 fill-current mr-0.5" /> P3
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">{dem.food_category}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-blue-400 font-mono text-sm">{dem.requested_kg}kg</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5 mt-1.5 font-mono">
                <span>Window: {dem.delivery_window_start_min}m - {dem.delivery_window_end_min}m</span>
                <span className="text-emerald-400 font-semibold">{dem.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
