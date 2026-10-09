import pytest
from backend.app.data.fixtures import (
    get_initial_donation_lots, get_initial_demands, get_initial_vehicles
)
from backend.app.optimizer.solver import OptimizationEngine
from backend.app.optimizer.verifier import PlanSafetyVerifier
from backend.app.models.schemas import RouteStop, StopType, Location

def test_verifier_catches_capacity_violation():
    lots = get_initial_donation_lots()
    demands = get_initial_demands()
    vehicles = get_initial_vehicles()
    lots_map = {l.id: l for l in lots}
    demands_map = {d.id: d for d in demands}
    vehicles_map = {v.id: v for v in vehicles}

    solver = OptimizationEngine()
    plan = solver.solve(lots, demands, vehicles)

    # Artificially inject an overloaded stop on Van 03 (limit 80kg)
    v3_route = next(r for r in plan.routes if r.vehicle_id == "veh-3")
    v3_route.stops[1].allocated_kg = 150.0  # Massive overload
    v3_route.stops[1].load_after_stop_kg = 150.0

    verifier = PlanSafetyVerifier(lots_map, demands_map, vehicles_map)
    res = verifier.verify(plan)

    assert res.is_valid is False
    assert any(issue.rule == "CAPACITY_EXCEEDED" for issue in res.issues)

def test_verifier_catches_cold_chain_violation():
    lots = get_initial_donation_lots()
    demands = get_initial_demands()
    vehicles = get_initial_vehicles()
    lots_map = {l.id: l for l in lots}
    demands_map = {d.id: d for d in demands}
    vehicles_map = {v.id: v for v in vehicles}

    solver = OptimizationEngine()
    plan = solver.solve(lots, demands, vehicles)

    # Assign a refrigerated lot to a non-refrigerated van (veh-2)
    v2_route = next(r for r in plan.routes if r.vehicle_id == "veh-2")
    # lot-03 is Greek Yogurt (requires refrigeration)
    v2_route.stops[1].lot_id = "lot-03"

    verifier = PlanSafetyVerifier(lots_map, demands_map, vehicles_map)
    res = verifier.verify(plan)

    assert res.is_valid is False
    assert any(issue.rule == "COLD_CHAIN_VIOLATION" for issue in res.issues)
