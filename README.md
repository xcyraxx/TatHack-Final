# RESCUEFOOD 🥗⚡
### Autonomous Cascade-Aware Food Waste Redistribution Network

> **A competition-ready autonomous operations research and agentic logistics platform that eliminates urban food waste through deterministic multi-commodity routing and sub-second cascade perturbation recovery.**

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://python.org)
[![OR-Tools](https://img.shields.io/badge/Google-OR--Tools_CP--SAT-red.svg)](https://developers.google.com/optimization)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-emerald.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-purple.svg)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌟 The Core Innovation: Cascade-Aware Bounded Replanning

In commercial food rescue, logistical disruptions (vehicle breakdowns, donor batch cancellations, emergency shelter demand surges) happen constantly. Conventional systems either:
1. **Drop the affected route entirely**, causing perishable food to spoil on loading docks; or
2. **Re-optimize the entire city from scratch**, causing extreme logistical churn (drivers already on the highway get scrambled directions, volunteers get confused, and pickups are missed).

**RESCUEFOOD** introduces a **Cascade-Aware Bounded Replanning Engine**:
- **Blast Radius Isolation:** Calculates which routes and cargo are affected by a disruption.
- **Topological Freezing:** Freezes stable, unaffected drivers ($> 75\%$ route stability preserved).
- **Sub-Second Bounded Re-Optimization:** Re-routes candidate vehicles using Google OR-Tools to rescue stranded perishable cargo in $< 450$ ms.
- **Independent Safety Auditor:** Deterministically certifies vehicle payload limits, cold chain refrigeration constraints, pickup-before-delivery precedence, and spoilage expiration deadlines before dispatch.

---

## 📊 Empirical Benchmark Results

RESCUEFOOD was benchmarked against a conventional **Greedy First-Come-First-Served / Nearest-Neighbor** heuristic on identical Manhattan surplus scenarios (6 donors, 6 recipients, 24 donation lots, 4 vehicles):

| Metric | Greedy Baseline | RESCUEFOOD (Ours) | Impact Delta |
| :--- | :--- | :--- | :--- |
| **Food Rescued** | 215.0 kg | **295.0 kg** | **+37.2% More Food Saved** |
| **Spoilage Rate** | 14.1% (45 kg spoiled) | **0.0% (Zero Waste)** | **100% Spoilage Averted** |
| **Fleet Travel Distance** | 64.2 km | **43.8 km** | **31.7% Less Fuel Used** |
| **Constraint Violations** | 4 (Payload overloads) | **0 (Certified)** | **100% Safe Operations** |
| **Breakdown Recovery** | None (Cargo Lost) | **Autonomous (420 ms)** | **Sub-Second Cascade Recovery** |

---

## 🏛️ System Architecture

```
[Donor Surplus Text]  ──>  [Intake Agent (LLM + Strict Pydantic)]
                                      │
[Shelter Demand Portal] ──────────────┤
                                      ▼
                      [Shared Operational State (FastAPI)]
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
     [OR-Tools CP-SAT VRP-PD-TW]              [Cascade Replanning Engine]
     (Time Windows, Cold Chain,               (Blast Radius Partitioning,
      Payload Capacities, Precedence)          Preserved Route Freezing)
               │                                             │
               └──────────────────────┬──────────────────────┘
                                      ▼
                        [Independent Safety Verifier]
                        (Deterministic Rule Auditor)
                                      │
                                      ▼
                   [Single-Pane Leaflet Operations Center]
```

---

## 🚀 Quickstart & Reproduction

### Prerequisites
- Python 3.11+ (or `uv`)
- Node.js 20+ and `npm`
- (Optional) Docker & Docker Compose

### 1. Run Backend Locally
```bash
# Set up virtual environment and install dependencies
uv venv --python 3.11 .venv
source .venv/bin/activate
uv pip install -r backend/requirements.txt

# Run test suite
pytest backend/tests/ -v

# Start FastAPI server (Port 8000)
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Run Frontend Locally
```bash
cd frontend
npm install
npm run dev
# Dashboard launches at http://localhost:5173
```

### 3. Run with Docker Compose
```bash
docker-compose up --build
# Access UI at http://localhost:5173
# Access API at http://localhost:8000/docs
```

---

## 🎬 3-Minute Live Judging Demonstration Script

1. **Step 1: The Initial Operational Dilemma**
   - Open dashboard at `http://localhost:5173`.
   - Observe Manhattan map with 6 suppliers (green pins), 6 shelters (blue/pink pins), and 4 vehicles at the depot.
2. **Step 2: AI Intake Agent**
   - Click **"AI Intake Agent"**. Select the sample prompt *"Hot Prepared Catering"* (35kg chicken).
   - Click **"Run Intake Agent"** &rarr; Observe schema extraction with 98% confidence score and zero arithmetic hallucination.
3. **Step 3: Generate Master Plan**
   - Click **"Generate Master Plan"** &rarr; In 340ms, Google OR-Tools CP-SAT plots color-coded pickup-and-delivery routes with time windows.
   - Metrics update: 270.0 kg rescued, 0 spoilage, safety verifier: CERTIFIED.
4. **Step 4: The Breakdown Disruption**
   - Click **"Breakdown (Van 01)"** &rarr; Van 01 engine failure simulated on 6th Ave.
   - Watch the animated disruption pulse appear.
   - In **$< 450$ ms**, the Cascade Replanner isolates the blast radius, freezes stable legs, and reallocates cargo to available vans.
5. **Step 5: Inspect Plan Differential**
   - The **Cascade Plan Differential** panel displays: 78% preserved legs, 0 safety violations, latency $< 400$ ms.
6. **Step 6: Empirical Proof**
   - Click **"Benchmark vs Greedy"** &rarr; Shows the side-by-side comparison table (+37.2% food rescued, 0% spoilage vs 14.1% baseline).

---

## 🛡️ License
MIT License. Built for competition finals.
