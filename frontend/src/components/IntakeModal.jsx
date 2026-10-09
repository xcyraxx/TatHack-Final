import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowRight } from 'lucide-react';

const SAMPLE_PROMPTS = [
  {
    label: "Hot Prepared Catering",
    text: "We have 35kg of hot roasted chicken breast and herb potatoes leftover from an executive lunch. Hot holding containers, ready for pickup now until 1:45pm today."
  },
  {
    label: "Chilled Dairy Surplus",
    text: "40kg organic Greek yogurt and artisan cheeses expiring this evening. Packaged in cold crates, strictly requires refrigerated transport. Available now."
  },
  {
    label: "Bakery Sourdough",
    text: "50 loaves of fresh artisan sourdough boules (approx 30kg). Ambient storage, shelf stable for 24 hours. Must be collected before 4:00pm."
  }
];

export default function IntakeModal({ onIntakeSubmit, onClose, isLoading }) {
  const [text, setText] = useState(SAMPLE_PROMPTS[0].text);
  const [parsedLot, setParsedLot] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await onIntakeSubmit(text);
    if (res && res.lot) {
      setParsedLot(res.lot);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white tracking-wide">
            Surplus Intake Agent (LLM Schema Parser)
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Ingests messy natural language donor reports and translates them into verified Pydantic inventory schemas with confidence scoring.
        </p>

        {/* Preset Samples */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-[11px] text-slate-400 self-center">Try Sample:</span>
          {SAMPLE_PROMPTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { setText(sample.text); setParsedLot(null); }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded border border-slate-700 transition-all cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 mb-4 font-mono"
            placeholder="Paste donor surplus description here..."
          />

          <div className="flex justify-between items-center mb-4">
            <span className="text-[11px] text-slate-500">
              Deterministic Schema Extraction &bull; Zero Arithmetic Hallucination
            </span>
            <button
              type="submit"
              disabled={isLoading || !text.trim()}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Processing...' : 'Run Intake Agent'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {parsedLot && (
          <div className="bg-slate-950/80 border border-cyan-900/60 rounded-xl p-3.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Validated Inventory Record Created
              </span>
              <span className="text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded font-mono">
                Confidence: {(parsedLot.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
              <div><span className="text-slate-500 font-sans">Food:</span> {parsedLot.food_name}</div>
              <div><span className="text-slate-500 font-sans">Quantity:</span> {parsedLot.quantity_kg} kg</div>
              <div><span className="text-slate-500 font-sans">Category:</span> {parsedLot.food_category}</div>
              <div><span className="text-slate-500 font-sans">Storage:</span> {parsedLot.storage_type} {parsedLot.requires_refrigeration ? '❄️' : '☀️'}</div>
              <div><span className="text-slate-500 font-sans">Pickup:</span> 0m - {parsedLot.pickup_window_end_min}m</div>
              <div><span className="text-slate-500 font-sans">Expiry:</span> t = {parsedLot.expiry_min}m</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
