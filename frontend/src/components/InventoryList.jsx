import React from 'react';
import { Package, Clock, Snowflake, Sun } from 'lucide-react';

export default function InventoryList({ lots }) {
  const activeLots = lots || [];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full max-h-[380px]">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Surplus Lots ({activeLots.length})
          </h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Available Inventory</span>
      </div>

      <div className="overflow-y-auto space-y-2 pr-1 flex-1">
        {activeLots.map((lot) => {
          const isUrgent = lot.expiry_min <= 120;
          return (
            <div
              key={lot.id}
              className={`p-2.5 rounded-lg border text-xs transition-all ${
                lot.status === 'CANCELLED'
                  ? 'bg-slate-950/30 border-slate-800/40 opacity-40 line-through'
                  : isUrgent
                  ? 'bg-amber-950/20 border-amber-800/40 text-slate-200'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <div>
                  <span className="font-semibold text-slate-100 block">{lot.food_name}</span>
                  <span className="text-[10px] text-slate-400">{lot.donor_name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-400 font-mono text-sm">{lot.quantity_kg}kg</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {lot.food_category}
                  </span>
                  {lot.requires_refrigeration ? (
                    <span className="flex items-center gap-0.5 text-cyan-400">
                      <Snowflake className="w-3 h-3" /> Cold
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-amber-400">
                      <Sun className="w-3 h-3" /> Dry
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className={isUrgent ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                    Exp: {lot.expiry_min}m
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
