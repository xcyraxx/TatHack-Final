from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class FoodCategory(str, Enum):
    PREPARED_HOT = "Prepared Hot"
    CHILLED_DAIRY_MEAT = "Chilled Dairy/Meat"
    FRESH_PRODUCE = "Fresh Produce"
    SHELF_STABLE = "Shelf Stable"

class StorageRequirement(str, Enum):
    AMBIENT = "Ambient"
    CHILLED = "Chilled"
    HOT_HOLDING = "Hot Holding"

class LotStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    ALLOCATED = "ALLOCATED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class DemandStatus(str, Enum):
    PENDING = "PENDING"
    PARTIALLY_FULFILLED = "PARTIALLY_FULFILLED"
    FULFILLED = "FULFILLED"
    UNSERVED = "UNSERVED"

class VehicleStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    EN_ROUTE = "EN_ROUTE"
    MAINTENANCE = "MAINTENANCE"
    IMMOBILIZED = "IMMOBILIZED"

class Location(BaseModel):
    lat: float
    lng: float
    address: str

class DonationLot(BaseModel):
    id: str
    donor_id: str
    donor_name: str
    food_name: str
    food_category: FoodCategory
    quantity_kg: float = Field(..., gt=0)
    requires_refrigeration: bool = False
    storage_type: StorageRequirement = StorageRequirement.AMBIENT
    pickup_window_start_min: int = Field(..., ge=0, description="Minutes from epoch")
    pickup_window_end_min: int = Field(..., ge=0, description="Minutes from epoch")
    expiry_min: int = Field(..., ge=0, description="Spoilage deadline in minutes from epoch")
    dietary_tags: List[str] = Field(default_factory=list)
    location: Location
    status: LotStatus = LotStatus.AVAILABLE
    confidence_score: float = 1.0

class RecipientDemand(BaseModel):
    id: str
    recipient_id: str
    recipient_name: str
    food_category: FoodCategory
    requested_kg: float = Field(..., gt=0)
    fulfilled_kg: float = 0.0
    delivery_window_start_min: int = Field(..., ge=0)
    delivery_window_end_min: int = Field(..., ge=0)
    priority_level: int = Field(1, ge=1, le=3, description="1=Normal Pantry, 2=Kitchen, 3=Emergency Shelter")
    dietary_tags: List[str] = Field(default_factory=list)
    location: Location
    status: DemandStatus = DemandStatus.PENDING

class Vehicle(BaseModel):
    id: str
    name: str
    capacity_kg: float = Field(..., gt=0)
    current_load_kg: float = 0.0
    has_refrigeration: bool = False
    speed_kmh: float = 25.0
    current_location: Location
    status: VehicleStatus = VehicleStatus.AVAILABLE

class StopType(str, Enum):
    DEPOT = "DEPOT"
    PICKUP = "PICKUP"
    DELIVERY = "DELIVERY"
    RENDEZVOUS_TRANSFER = "RENDEZVOUS_TRANSFER"

class RouteStop(BaseModel):
    stop_sequence: int
    stop_type: StopType
    node_id: str
    location_name: str
    location: Location
    lot_id: Optional[str] = None
    demand_id: Optional[str] = None
    arrival_time_min: float
    departure_time_min: float
    load_after_stop_kg: float
    allocated_kg: float = 0.0
    item_description: str
    is_frozen: bool = False

class PlanRoute(BaseModel):
    vehicle_id: str
    vehicle_name: str
    has_refrigeration: bool
    stops: List[RouteStop]
    total_travel_minutes: float
    total_load_carried_kg: float

class VerificationIssue(BaseModel):
    rule: str
    severity: str  # ERROR, WARNING
    message: str
    entity_id: Optional[str] = None

class VerificationResult(BaseModel):
    is_valid: bool
    violations_count: int
    warnings_count: int
    issues: List[VerificationIssue] = Field(default_factory=list)
    audited_at: datetime = Field(default_factory=datetime.utcnow)

class Plan(BaseModel):
    id: str
    version: int
    trigger_event: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    routes: List[PlanRoute]
    total_food_rescued_kg: float
    total_food_available_kg: float
    total_transit_minutes: float
    spoilage_rate_pct: float
    unserved_demand_kg: float
    fairness_gini: float
    verification: VerificationResult
    status: str = "ACTIVE"

class DisruptionType(str, Enum):
    VEHICLE_BREAKDOWN = "VEHICLE_BREAKDOWN"
    DONATION_CANCELLATION = "DONATION_CANCELLATION"
    URGENT_DEMAND_SURGE = "URGENT_DEMAND_SURGE"
    TRAFFIC_DELAY = "TRAFFIC_DELAY"

class DisruptionEvent(BaseModel):
    id: str
    event_type: DisruptionType
    timestamp_min: int
    target_id: str  # vehicle_id, lot_id, or recipient_id
    payload: Dict[str, Any] = Field(default_factory=dict)
    description: str

class AuditEntry(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    stage: str
    action: str
    details: str
    plan_version: Optional[int] = None
