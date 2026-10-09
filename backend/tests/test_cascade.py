import pytest
from backend.app.data.fixtures import (
    get_initial_donation_lots, get_initial_demands, get_initial_vehicles
)
from backend.app.optimizer.solver import OptimizationEngine
from backend.app.optimizer.replan import CascadeReplanningEngine
from backend.app.models.schemas import DisruptionEvent, DisruptionType

def test_cascade_vehicle_breakdown_recovery():
    lots = get_initial_donation_lots()
    demands = get_initial_demands()
    vehicles = get_initial_vehicles()

    solver = OptimizationEngine()
    plan_v1 = solver.solve(lots, demands, vehicles)

    disruption = DisruptionEvent(
        id="test-disrupt-01",
        event_type=DisruptionType.VEHICLE_BREAKDOWN,
        timestamp_min=30,
        target_id="veh-1",
        payload={"lat": 40.730, "lng": -73.990},
        description="Van 01 electrical fault"
    )

    replanner = CascadeReplanningEngine(solver)
    plan_v2, blast_info = replanner.replan(plan_v1, disruption, lots, demands, vehicles)

    assert plan_v2.version == 2
    assert plan_v2.verification.is_valid is True
    assert blast_info["replan_latency_ms"] < 3000.0  # Under 3 seconds
    assert len(blast_info["frozen_vehicles"]) >= 2   # Preserved routes

def test_cascade_donation_cancellation():
    lots = get_initial_donation_lots()
    demands = get_initial_demands()
    vehicles = get_initial_vehicles()

    solver = OptimizationEngine()
    plan_v1 = solver.solve(lots, demands, vehicles)

    disruption = DisruptionEvent(
        id="test-disrupt-02",
        event_type=DisruptionType.DONATION_CANCELLATION,
        timestamp_min=15,
        target_id="lot-01",
        description="Bakery cancelled surplus batch"
    )

    replanner = CascadeReplanningEngine(solver)
    plan_v2, blast_info = replanner.replan(plan_v1, disruption, lots, demands, vehicles)

    assert plan_v2.version == 2
    assert plan_v2.verification.is_valid is True
    # Ensure cancelled lot is purged from routes
    for r in plan_v2.routes:
        for s in r.stops:
            assert s.lot_id != "lot-01"
