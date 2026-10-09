import React from 'react';
import { Play, AlertOctagon, XCircle, TrendingUp, BarChart2, PlusCircle, RotateCcw } from 'lucide-react';

export default function DisruptionControls({
  onSolvePlan,
  onInjectDisruption,
  onOpenBenchmark,
  onOpenIntake,
  onResetScenario,
  isLoading
}) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 mb-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Live Operational Controls</span>
          <span className="text-sm font-semibold text-slate-200">Inject Disruptions & Trigger Cascade Replanning</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action 1: Solve Initial Plan */}
          <button
            onClick={onSolvePlan}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Generate Master Plan</span>
          </button>

          {/* Action 2: Vehicle Breakdown */}
          <button
            onClick={() => onInjectDisruption('VEHICLE_BREAKDOWN', 'veh-1', 'Reefer Van 01 engine failure on 6th Ave')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-rose-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Breakdown (Van 01)</span>
          </button>

          {/* Action 3: Donor Cancellation */}
          <button
            onClick={() => onInjectDisruption('DONATION_CANCELLATION', 'lot-01', 'Bakery cancelled 25kg bread batch')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel Lot (Lot 01)</span>
          </button>

          {/* Action 4: Urgent Surge */}
          <button
            onClick={() => onInjectDisruption('URGENT_DEMAND_SURGE', 'rec-1', 'Bowery Mission +30kg emergency meal surge')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-purple-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Urgent Surge</span>
          </button>

          {/* Action 5: Benchmark modal */}
          <button
            onClick={onOpenBenchmark}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Benchmark vs Greedy</span>
          </button>

          {/* Action 6: Natural Language Intake */}
          <button
            onClick={onOpenIntake}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Intake Agent</span>
          </button>

          {/* Action 7: Reset */}
          <button
            onClick={onResetScenario}
            disabled={isLoading}
            title="Reset to clean Manhattan scenario"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
