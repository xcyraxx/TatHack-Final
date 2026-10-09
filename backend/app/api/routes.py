import time
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..models.schemas import (
    DonationLot, RecipientDemand, Vehicle, Plan, DisruptionEvent,
    DisruptionType, AuditEntry, Location
)
from ..data.fixtures import (
    get_initial_donation_lots, get_initial_demands, get_initial_vehicles,
    DEPOT_LOCATION, SUPPLIERS_LOCATIONS, RECIPIENTS_LOCATIONS
)
from ..optimizer.solver import OptimizationEngine
from ..optimizer.replan import CascadeReplanningEngine
from ..optimizer.verifier import PlanSafetyVerifier
from ..benchmark.baseline import GreedyBaselineEngine, compare_engines
from ..agents.intake_agent import IntakeAgent

router = APIRouter(prefix="/api/v1", tags=["operations"])

# In-Memory State Store for Hackathon Prototype
class NetworkState:
    def __init__(self):
        self.reset()

    def reset(self):
        self.lots: List[DonationLot] = get_initial_donation_lots()
        self.demands: List[RecipientDemand] = get_initial_demands()
        self.vehicles: List[Vehicle] = get_initial_vehicles()
        self.active_plan: Optional[Plan] = None
        self.previous_plan: Optional[Plan] = None
        self.plan_history: List[Plan] = []
        self.audit_logs: List[AuditEntry] = [
            AuditEntry(
                stage="SYSTEM_INIT",
                action="INITIALIZE_NETWORK",
                details="Loaded Manhattan logistics graph with 6 suppliers, 6 recipients, and 4 fleet vehicles."
            )
        ]
        self.last_blast_radius: Dict[str, Any] = {}

state = NetworkState()
solver_engine = OptimizationEngine()
cascade_engine = CascadeReplanningEngine(solver_engine)
intake_agent = IntakeAgent()
greedy_engine = GreedyBaselineEngine()

class IntakeRequest(BaseModel):
    raw_text: str
    donor_id: Optional[str] = "sup-custom"
    donor_name: Optional[str] = "Gourmet Kitchen (Midtown)"
    lat: Optional[float] = 40.753
    lng: Optional[float] = -73.987
    address: Optional[str] = "420 Lexington Ave, New York, NY"

class DisruptionRequest(BaseModel):
    event_type: DisruptionType
    target_id: str
    timestamp_min: int = 30
    payload: Dict[str, Any] = {}
    description: str

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RESCUEFOOD Autonomous Logistics Engine",
        "version": "1.0.0",
        "timestamp": time.time()
    }

@router.get("/state")
def get_current_state():
    return {
        "lots": state.lots,
        "demands": state.demands,
        "vehicles": state.vehicles,
        "active_plan": state.active_plan,
        "previous_plan": state.previous_plan,
        "audit_logs": state.audit_logs[-15:], # Last 15 logs
        "last_blast_radius": state.last_blast_radius
    }

@router.post("/reset")
def reset_network_state():
    state.reset()
    return {"status": "success", "message": "Network reset to initial Manhattan scenario."}

@router.post("/donations/intake")
def intake_donation(req: IntakeRequest):
    loc = Location(lat=req.lat, lng=req.lng, address=req.address)
    lot = intake_agent.parse_report(
        raw_text=req.raw_text,
        donor_id=req.donor_id,
        donor_name=req.donor_name,
        location=loc
    )
    state.lots.append(lot)
    state.audit_logs.append(AuditEntry(
        stage="INTAKE_AGENT",
        action="SURPLUS_REGISTERED",
        details=f"Parsed {lot.quantity_kg}kg of '{lot.food_name}' ({lot.food_category.value}) with confidence {lot.confidence_score * 100:.0f}%."
    ))
    return {"status": "success", "lot": lot}

@router.post("/plans/solve")
def solve_master_plan():
    plan = solver_engine.solve(state.lots, state.demands, state.vehicles)
    state.previous_plan = state.active_plan
    state.active_plan = plan
    state.plan_history.append(plan)

    state.audit_logs.append(AuditEntry(
        stage="OPTIMIZER",
        action="PLAN_DISPATCHED",
        details=f"Generated Plan v{plan.version}: Rescued {plan.total_food_rescued_kg}kg across {len(plan.routes)} routes in {plan.total_transit_minutes} transit mins.",
        plan_version=plan.version
    ))
    return {"status": "success", "plan": plan}

@router.post("/disruptions/inject")
def inject_disruption(req: DisruptionRequest):
    if not state.active_plan:
        # Solve initial first if not present
        state.active_plan = solver_engine.solve(state.lots, state.demands, state.vehicles)

    event = DisruptionEvent(
        id=f"disrupt-{int(time.time())}",
        event_type=req.event_type,
        timestamp_min=req.timestamp_min,
        target_id=req.target_id,
        payload=req.payload,
        description=req.description
    )

    # Execute Cascade Replanning
    new_plan, blast_info = cascade_engine.replan(
        current_plan=state.active_plan,
        disruption=event,
        lots=state.lots,
        demands=state.demands,
        vehicles=state.vehicles
    )

    state.previous_plan = state.active_plan
    state.active_plan = new_plan
    state.plan_history.append(new_plan)
    state.last_blast_radius = blast_info

    state.audit_logs.append(AuditEntry(
        stage="CASCADE_REPLANNER",
        action=f"DISRUPTION_{req.event_type.value}",
        details=f"{req.description}. Blast radius isolated: {blast_info.get('affected_stops_count', 0)} stops affected. Recomputed Plan v{new_plan.version} in {blast_info.get('replan_latency_ms', 0)}ms with {new_plan.verification.violations_count} violations.",
        plan_version=new_plan.version
    ))

    return {
        "status": "success",
        "event": event,
        "blast_radius": blast_info,
        "new_plan": new_plan
    }

@router.get("/plans/diff")
def get_plan_differential():
    if not state.active_plan:
        raise HTTPException(status_code=400, detail="No active plan exists.")

    v_new = state.active_plan
    v_old = state.previous_plan or v_new

    # Count preserved stops vs rerouted stops
    old_stops_map = {}
    for r in v_old.routes:
        for s in r.stops:
            old_stops_map[(r.vehicle_id, s.node_id)] = s

    preserved = 0
    rerouted = 0
    for r in v_new.routes:
        for s in r.stops:
            key = (r.vehicle_id, s.node_id)
            if key in old_stops_map and abs(old_stops_map[key].arrival_time_min - s.arrival_time_min) < 5.0:
                preserved += 1
            else:
                rerouted += 1

    total_stops = preserved + rerouted
    stability_pct = round((preserved / max(1, total_stops)) * 100, 1)

    return {
        "old_version": v_old.version,
        "new_version": v_new.version,
        "food_rescued_delta_kg": round(v_new.total_food_rescued_kg - v_old.total_food_rescued_kg, 1),
        "transit_delta_minutes": round(v_new.total_transit_minutes - v_old.total_transit_minutes, 1),
        "preserved_legs": preserved,
        "rerouted_legs": rerouted,
        "stability_pct": stability_pct,
        "replan_latency_ms": state.last_blast_radius.get("replan_latency_ms", 350.0),
        "violations": v_new.verification.violations_count
    }

@router.post("/benchmarks/compare")
def run_benchmark_comparison():
    if not state.active_plan:
        state.active_plan = solver_engine.solve(state.lots, state.demands, state.vehicles)

    greedy_res = greedy_engine.solve(state.lots, state.demands, state.vehicles)
    comparison = compare_engines(state.active_plan, greedy_res)
    return comparison
