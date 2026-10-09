import React, { useState, useEffect } from 'react';
import { Shield, Radio, Activity, RefreshCw } from 'lucide-react';
import MapView from './components/MapView';
import MetricsPanel from './components/MetricsPanel';
import DisruptionControls from './components/DisruptionControls';
import PlanDiffViewer from './components/PlanDiffViewer';
import InventoryList from './components/InventoryList';
import DemandList from './components/DemandList';
import DecisionTimeline from './components/DecisionTimeline';
import BenchmarkModal from './components/BenchmarkModal';
import IntakeModal from './components/IntakeModal';

export default function App() {
  const [state, setState] = useState({
    lots: [],
    demands: [],
    vehicles: [],
    active_plan: null,
    previous_plan: null,
    audit_logs: [],
    last_blast_radius: null
  });
  const [diffData, setDiffData] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch full state from backend
  const fetchState = async () => {
    try {
      const res = await fetch('/api/v1/state');
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error('Failed to fetch network state:', err);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // 1. Solve Master Plan
  const handleSolvePlan = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/plans/solve', { method: 'POST' });
      if (res.ok) {
        await fetchState();
        // Fetch diff if previous plan exists
        const diffRes = await fetch('/api/v1/plans/diff');
        if (diffRes.ok) setDiffData(await diffRes.json());
      }
    } catch (err) {
      console.error('Failed to solve plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Inject Disruption
  const handleInjectDisruption = async (eventType, targetId, description) => {
    setIsLoading(true);
    try {
      const payload = {
        event_type: eventType,
        target_id: targetId,
        timestamp_min: 30,
        payload: { lat: 40.735, lng: -73.995 },
        description: description
      };
      const res = await fetch('/api/v1/disruptions/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchState();
        const diffRes = await fetch('/api/v1/plans/diff');
        if (diffRes.ok) setDiffData(await diffRes.json());
      }
    } catch (err) {
      console.error('Failed to inject disruption:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Run Benchmark
  const handleOpenBenchmark = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/benchmarks/compare', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBenchmarkData(data);
        setIsBenchmarkOpen(true);
      }
    } catch (err) {
      console.error('Failed to run benchmark:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Submit Intake Report
  const handleIntakeSubmit = async (rawText) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/donations/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: rawText })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchState();
        return data;
      }
    } catch (err) {
      console.error('Failed to intake donation:', err);
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  // 5. Reset Scenario
  const handleResetScenario = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/reset', { method: 'POST' });
      if (res.ok) {
        setDiffData(null);
        await fetchState();
      }
    } catch (err) {
      console.error('Failed to reset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-[1500] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="w-5 h-5 text-slate-950 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                RESCUEFOOD <span className="text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded-full font-mono">AUTONOMOUS NETWORK</span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400">
              Cascade-Aware Multi-Commodity Food Redistribution Engine &bull; Manhattan Operations Core
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>SOLVER: OR-TOOLS CP-SAT</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Plan v{state.active_plan?.version ?? 0}</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-6 max-w-[1720px] w-full mx-auto space-y-4">
        {/* Real-time KPI Metrics Banner */}
        <MetricsPanel
          activePlan={state.active_plan}
          lastBlastRadius={state.last_blast_radius}
        />

        {/* Disruption Simulation Bar */}
        <DisruptionControls
          onSolvePlan={handleSolvePlan}
          onInjectDisruption={handleInjectDisruption}
          onOpenBenchmark={handleOpenBenchmark}
          onOpenIntake={() => setIsIntakeOpen(true)}
          onResetScenario={handleResetScenario}
          isLoading={isLoading}
        />

        {/* Plan Diff Viewer (renders when replanned) */}
        {diffData && (
          <PlanDiffViewer
            diffData={diffData}
            lastBlastRadius={state.last_blast_radius}
          />
        )}

        {/* Primary Operational View: Map & Side Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Interactive Map: 8 Cols */}
          <div className="lg:col-span-8 h-[560px]">
            <MapView
              lots={state.lots}
              demands={state.demands}
              vehicles={state.vehicles}
              activePlan={state.active_plan}
              lastBlastRadius={state.last_blast_radius}
            />
          </div>

          {/* Decision Timeline: 4 Cols */}
          <div className="lg:col-span-4 h-[560px]">
            <DecisionTimeline auditLogs={state.audit_logs} />
          </div>
        </div>

        {/* Lower Row: Inventory & Demands */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InventoryList lots={state.lots} />
          <DemandList demands={state.demands} />
        </div>
      </main>

      {/* Benchmark Modal */}
      {isBenchmarkOpen && (
        <BenchmarkModal
          benchmarkData={benchmarkData}
          onClose={() => setIsBenchmarkOpen(false)}
        />
      )}

      {/* AI Intake Modal */}
      {isIntakeOpen && (
        <IntakeModal
          onIntakeSubmit={handleIntakeSubmit}
          onClose={() => setIsIntakeOpen(false)}
          isLoading={isLoading}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-3 text-center text-xs text-slate-500 font-mono">
        RESCUEFOOD // 30-Hour Hackathon Finalist Prototype &bull; Zero Hallucination Operations Research &bull; MIT License
      </footer>
    </div>
  );
}
