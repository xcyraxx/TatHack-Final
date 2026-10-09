import pytest
from backend.app.data.fixtures import (
    get_initial_donation_lots, get_initial_demands, get_initial_vehicles
)
from backend.app.optimizer.solver import OptimizationEngine
from backend.app.models.schemas import StopType

def test_initial_plan_generation():
    lots = get_initial_donation_lots()
    demands = get_initial_demands()
    vehicles = get_initial_vehicles()

    engine = OptimizationEngine()
    plan = engine.solve(lots, demands, vehicles)

    assert plan is not None
    assert plan.version == 1
    assert len(plan.routes) > 0
    assert plan.total_food_rescued_kg > 0
    assert plan.verification.is_valid is True
    assert plan.verification.violations_count == 0

def test_payload_capacity_never_exceeded():
    lots = get_initial_donation_lots()
    demands = get_initial_demands()
    vehicles = get_initial_vehicles()
    veh_map = {v.id: v for v in vehicles}

    engine = OptimizationEngine()
    plan = engine.solve(lots, demands, vehicles)

    for route in plan.routes:
        veh = veh_map[route.vehicle_id]
        for stop in route.stops:
            assert stop.load_after_stop_kg <= veh.capacity_kg + 0.01

def test_cold_chain_restrictions():
    lots = get_initial_donation_lots()
    demands = get_initial_demands()
    vehicles = get_initial_vehicles()
    lot_map = {l.id: l for l in lots}

    engine = OptimizationEngine()
    plan = engine.solve(lots, demands, vehicles)

    for route in plan.routes:
        if not route.has_refrigeration:
            for stop in route.stops:
                if stop.lot_id and stop.lot_id in lot_map:
                    lot = lot_map[stop.lot_id]
                    assert lot.requires_refrigeration is False, f"Non-refrigerated {route.vehicle_name} carrying refrigerated {lot.food_name}"
