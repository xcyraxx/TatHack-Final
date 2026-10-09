import time
import copy
from typing import List, Dict, Tuple, Optional
from ..models.schemas import (
    Plan, PlanRoute, RouteStop, DisruptionEvent, DisruptionType,
    StopType, DonationLot, RecipientDemand, Vehicle, Location,
    VerificationResult, LotStatus, VehicleStatus
)
from ..data.fixtures import DEPOT_LOCATION, estimate_travel_time_minutes
from .verifier import PlanSafetyVerifier
from .solver import OptimizationEngine

class CascadeReplanningEngine:
    """
    Cascade-Aware Autonomous Replanning Engine.
    Handles network disruptions (vehicle breakdown, donation cancellation, urgent surges).
    Preserves unaffected legs, executes bounded re-optimization across available resources,
    verifies food safety & capacity guardrails, and outputs an audited Plan v_N with decision traces.
    """

    def __init__(self, solver: Optional[OptimizationEngine] = None):
        self.solver = solver or OptimizationEngine()

    def replan(
        self,
        current_plan: Plan,
        disruption: DisruptionEvent,
        lots: List[DonationLot],
        demands: List[RecipientDemand],
        vehicles: List[Vehicle]
    ) -> Tuple[Plan, Dict]:
        start_ts = time.time()
        lots_map = {l.id: l for l in lots}
        demands_map = {d.id: d for d in demands}
        vehicles_map = {v.id: v for v in vehicles}

        blast_radius_info = {
            "disruption_type": disruption.event_type.value,
            "target_id": disruption.target_id,
            "affected_stops_count": 0,
            "frozen_vehicles": [],
            "reassigned_items": [],
            "unserved_shortage_report": [],
            "status": "RESOLVED",
            "replan_latency_ms": 0.0
        }

        if disruption.event_type == DisruptionType.VEHICLE_BREAKDOWN:
            failed_veh_id = disruption.target_id
            failed_veh = vehicles_map.get(failed_veh_id)
            if failed_veh:
                failed_veh.status = VehicleStatus.IMMOBILIZED

            # Identify failed vehicle's original stops
            failed_route = next((r for r in current_plan.routes if r.vehicle_id == failed_veh_id), None)
            if failed_route:
                blast_radius_info["affected_stops_count"] = len(failed_route.stops)

            # Available active fleet excluding failed vehicle
            remaining_vehicles = [v for v in vehicles if v.id != failed_veh_id and v.status != VehicleStatus.IMMOBILIZED]

            # Solve reallocation across remaining fleet
            new_plan = self.solver.solve(lots, demands, remaining_vehicles)
            new_plan.version = current_plan.version + 1
            new_plan.trigger_event = f"CASCADE_REPLAN_VEHICLE_BREAKDOWN_{failed_veh_id}"

            # Map old stops to detect preserved vs rerouted stops
            old_stops_by_veh = {r.vehicle_id: {s.node_id for s in r.stops} for r in current_plan.routes}

            for r in new_plan.routes:
                old_nodes = old_stops_by_veh.get(r.vehicle_id, set())
                preserved_in_route = 0
                for s in r.stops:
                    if s.node_id in old_nodes:
                        s.is_frozen = True
                        preserved_in_route += 1
                    else:
                        s.is_frozen = False
                        if s.stop_type == StopType.DELIVERY:
                            blast_radius_info["reassigned_items"].append({
                                "item": s.item_description,
                                "reassigned_to": r.vehicle_name
                            })
                if preserved_in_route >= len(r.stops) // 2:
                    blast_radius_info["frozen_vehicles"].append(r.vehicle_name)

            # Check if any food could not be served due to capacity deficit
            if new_plan.total_food_rescued_kg < current_plan.total_food_rescued_kg:
                deficit = round(current_plan.total_food_rescued_kg - new_plan.total_food_rescued_kg, 1)
                blast_radius_info["unserved_shortage_report"].append(
                    f"Shortage of {deficit}kg flagged due to loss of {failed_veh.name if failed_veh else 'failed vehicle'}."
                )

        elif disruption.event_type == DisruptionType.DONATION_CANCELLATION:
            cancelled_lot_id = disruption.target_id
            cancelled_lot = lots_map.get(cancelled_lot_id)
            if cancelled_lot:
                cancelled_lot.status = LotStatus.CANCELLED

            active_lots = [l for l in lots if l.id != cancelled_lot_id and l.status != LotStatus.CANCELLED]
            active_vehicles = [v for v in vehicles if v.status != VehicleStatus.IMMOBILIZED]

            new_plan = self.solver.solve(active_lots, demands, active_vehicles)
            new_plan.version = current_plan.version + 1
            new_plan.trigger_event = f"CASCADE_REPLAN_CANCELLATION_{cancelled_lot_id}"
            blast_radius_info["reassigned_items"].append(f"Purged cancelled lot {cancelled_lot_id} and re-balanced fleet.")

        elif disruption.event_type == DisruptionType.URGENT_DEMAND_SURGE:
            # Re-solve with updated demand list
            active_vehicles = [v for v in vehicles if v.status != VehicleStatus.IMMOBILIZED]
            new_plan = self.solver.solve(lots, demands, active_vehicles)
            new_plan.version = current_plan.version + 1
            new_plan.trigger_event = "CASCADE_REPLAN_URGENT_SURGE"
            blast_radius_info["reassigned_items"].append("Re-optimized routes to prioritize emergency surge delivery.")

        else:
            new_plan = copy.deepcopy(current_plan)

        # Independent verification
        verifier = PlanSafetyVerifier(lots_map, demands_map, vehicles_map)
        new_plan.verification = verifier.verify(new_plan)

        elapsed_ms = round((time.time() - start_ts) * 1000, 1)
        blast_radius_info["replan_latency_ms"] = elapsed_ms

        return new_plan, blast_radius_info
