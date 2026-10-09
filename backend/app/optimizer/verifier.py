from typing import List, Dict, Optional
from ..models.schemas import (
    Plan, RouteStop, StopType, VerificationResult, VerificationIssue,
    DonationLot, RecipientDemand, Vehicle, FoodCategory
)

class PlanSafetyVerifier:
    """
    Independent Deterministic Constraint & Food Safety Verifier.
    Performs full mathematical and operational validation of any proposed Plan
    prior to physical dispatch. Zero reliance on probabilistic LLM logic.
    """

    def __init__(
        self,
        lots_map: Dict[str, DonationLot],
        demands_map: Dict[str, RecipientDemand],
        vehicles_map: Dict[str, Vehicle]
    ):
        self.lots = lots_map
        self.demands = demands_map
        self.vehicles = vehicles_map

    def verify(self, plan: Plan) -> VerificationResult:
        issues: List[VerificationIssue] = []

        for route in plan.routes:
            veh = self.vehicles.get(route.vehicle_id)
            if not veh:
                issues.append(VerificationIssue(
                    rule="VEHICLE_EXISTENCE",
                    severity="ERROR",
                    message=f"Vehicle {route.vehicle_id} not registered in fleet database."
                ))
                continue

            current_load = 0.0
            picked_up_lots = set()
            delivered_lots = set()
            prev_departure_time = 0.0

            for idx, stop in enumerate(route.stops):
                # 1. Monotonic Time Check
                if stop.arrival_time_min < prev_departure_time:
                    issues.append(VerificationIssue(
                        rule="TIME_CONTINUITY",
                        severity="ERROR",
                        message=f"Vehicle {veh.name}: Stop #{idx} arrival time ({stop.arrival_time_min}m) precedes previous stop departure ({prev_departure_time}m).",
                        entity_id=stop.node_id
                    ))

                # 2. Stop Processing
                if stop.stop_type == StopType.DEPOT:
                    current_load = 0.0

                elif stop.stop_type == StopType.PICKUP:
                    lot = self.lots.get(stop.lot_id)
                    if not lot:
                        issues.append(VerificationIssue(
                            rule="LOT_EXISTENCE",
                            severity="ERROR",
                            message=f"Stop references non-existent donation lot ID: {stop.lot_id}",
                            entity_id=stop.lot_id
                        ))
                    else:
                        # Cold chain enforcement
                        if lot.requires_refrigeration and not veh.has_refrigeration:
                            issues.append(VerificationIssue(
                                rule="COLD_CHAIN_VIOLATION",
                                severity="ERROR",
                                message=f"Perishable lot '{lot.food_name}' requires refrigeration, but vehicle '{veh.name}' lacks cold-chain equipment.",
                                entity_id=lot.id
                            ))

                        # Pickup time window
                        if stop.arrival_time_min < lot.pickup_window_start_min - 0.01:
                            issues.append(VerificationIssue(
                                rule="EARLY_PICKUP_ARRIVAL",
                                severity="WARNING",
                                message=f"Driver arrived at {lot.donor_name} before pickup window opens ({stop.arrival_time_min}m < {lot.pickup_window_start_min}m).",
                                entity_id=lot.id
                            ))
                        if stop.arrival_time_min > lot.pickup_window_end_min + 0.01:
                            issues.append(VerificationIssue(
                                rule="MISSED_PICKUP_WINDOW",
                                severity="ERROR",
                                message=f"Driver arrived at {lot.donor_name} after donor window closed ({stop.arrival_time_min}m > {lot.pickup_window_end_min}m).",
                                entity_id=lot.id
                            ))

                        current_load += (stop.allocated_kg if stop.allocated_kg > 0 else lot.quantity_kg)
                        picked_up_lots.add(lot.id)

                elif stop.stop_type == StopType.DELIVERY:
                    lot = self.lots.get(stop.lot_id) if stop.lot_id else None
                    demand = self.demands.get(stop.demand_id) if stop.demand_id else None

                    if lot:
                        # Precedence: Must have been picked up earlier on this or previous valid leg
                        if lot.id not in picked_up_lots and not stop.item_description.startswith("Transferred"):
                            issues.append(VerificationIssue(
                                rule="PRECEDENCE_VIOLATION",
                                severity="ERROR",
                                message=f"Lot '{lot.food_name}' scheduled for delivery at {stop.location_name} without prior recorded pickup.",
                                entity_id=lot.id
                            ))

                        # Spoilage / Expiry Check
                        if stop.arrival_time_min > lot.expiry_min:
                            issues.append(VerificationIssue(
                                rule="FOOD_SPOILED_BEFORE_DELIVERY",
                                severity="ERROR",
                                message=f"CRITICAL: Lot '{lot.food_name}' expires at t={lot.expiry_min}m, but ETA is t={stop.arrival_time_min}m. Potential foodborne hazard!",
                                entity_id=lot.id
                            ))

                        deliv_qty = stop.allocated_kg if stop.allocated_kg > 0 else lot.quantity_kg
                        current_load = max(0.0, current_load - deliv_qty)
                        delivered_lots.add(lot.id)

                    if demand:
                        # Category matching
                        if lot and lot.food_category != demand.food_category:
                            issues.append(VerificationIssue(
                                rule="CATEGORY_MISMATCH",
                                severity="WARNING",
                                message=f"Recipient requested {demand.food_category.value}, but delivering {lot.food_category.value}.",
                                entity_id=demand.id
                            ))

                        # Delivery time window
                        if stop.arrival_time_min > demand.delivery_window_end_min + 0.01:
                            issues.append(VerificationIssue(
                                rule="MISSED_DELIVERY_WINDOW",
                                severity="ERROR",
                                message=f"Delivery at {demand.recipient_name} misses recipient closing deadline ({stop.arrival_time_min}m > {demand.delivery_window_end_min}m).",
                                entity_id=demand.id
                            ))

                # 3. Payload Capacity Check
                if current_load > veh.capacity_kg + 0.01:
                    issues.append(VerificationIssue(
                        rule="CAPACITY_EXCEEDED",
                        severity="ERROR",
                        message=f"Vehicle '{veh.name}' payload of {current_load:.1f}kg exceeds physical limit of {veh.capacity_kg:.1f}kg at stop #{idx} ({stop.location_name}).",
                        entity_id=veh.id
                    ))

                prev_departure_time = stop.departure_time_min

        errors_count = sum(1 for i in issues if i.severity == "ERROR")
        warnings_count = sum(1 for i in issues if i.severity == "WARNING")

        return VerificationResult(
            is_valid=(errors_count == 0),
            violations_count=errors_count,
            warnings_count=warnings_count,
            issues=issues
        )
