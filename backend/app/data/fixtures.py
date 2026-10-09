import math
from typing import Dict, List, Tuple
from ..models.schemas import (
    Location, DonationLot, RecipientDemand, Vehicle,
    FoodCategory, StorageRequirement, LotStatus, DemandStatus, VehicleStatus
)

# Manhattan Central Coordinates
DEPOT_LOCATION = Location(lat=40.7516, lng=-73.9998, address="Midtown West Logistics Hub (W 30th St)")

SUPPLIERS_LOCATIONS = {
    "sup-1": Location(lat=40.7247, lng=-73.9992, address="Artisan Sourdough Bakery (SoHo)"),
    "sup-2": Location(lat=40.7441, lng=-73.9982, address="Hudson Organic Market (Chelsea)"),
    "sup-3": Location(lat=40.7580, lng=-73.9855, address="Manhattan Corporate Catering (Midtown)"),
    "sup-4": Location(lat=40.7282, lng=-73.9845, address="St. Marks Gourmet Deli (East Village)"),
    "sup-5": Location(lat=40.7638, lng=-73.9928, address="Hell's Kitchen Wholesale Produce"),
    "sup-6": Location(lat=40.7075, lng=-74.0090, address="Wall St Conference Banquet Center")
}

RECIPIENTS_LOCATIONS = {
    "rec-1": Location(lat=40.7198, lng=-73.9934, address="The Bowery Mission Shelter"),
    "rec-2": Location(lat=40.7235, lng=-73.9822, address="Nazareth Supportive Family Housing"),
    "rec-3": Location(lat=40.7527, lng=-73.9772, address="Grand Central Food Program"),
    "rec-4": Location(lat=40.7480, lng=-74.0020, address="Chelsea Community Soup Kitchen"),
    "rec-5": Location(lat=40.7160, lng=-73.9880, address="Lower East Side Youth Care Pantry"),
    "rec-6": Location(lat=40.7800, lng=-73.9550, address="Harlem Senior Meal Program")
}

def haversine_distance_km(loc1: Location, loc2: Location) -> float:
    R = 6371.0 # Earth radius in km
    lat1, lon1 = math.radians(loc1.lat), math.radians(loc1.lng)
    lat2, lon2 = math.radians(loc2.lat), math.radians(loc2.lng)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    euclidean = R * c
    # Manhattan grid circuity factor ~1.35
    return euclidean * 1.35

def estimate_travel_time_minutes(loc1: Location, loc2: Location, speed_kmh: float = 22.0) -> float:
    dist_km = haversine_distance_km(loc1, loc2)
    # Travel time in minutes + 2 mins basic traffic/signal friction
    minutes = (dist_km / speed_kmh) * 60.0 + 2.0
    return round(minutes, 1)

def get_initial_vehicles() -> List[Vehicle]:
    return [
        Vehicle(
            id="veh-1",
            name="Van 01 (Refrigerated Sprinter)",
            capacity_kg=120.0,
            has_refrigeration=True,
            speed_kmh=22.0,
            current_location=DEPOT_LOCATION,
            status=VehicleStatus.AVAILABLE
        ),
        Vehicle(
            id="veh-2",
            name="Van 02 (Standard Cargo Transit)",
            capacity_kg=100.0,
            has_refrigeration=False,
            speed_kmh=24.0,
            current_location=DEPOT_LOCATION,
            status=VehicleStatus.AVAILABLE
        ),
        Vehicle(
            id="veh-3",
            name="Van 03 (Rapid Compact Van)",
            capacity_kg=80.0,
            has_refrigeration=False,
            speed_kmh=25.0,
            current_location=DEPOT_LOCATION,
            status=VehicleStatus.AVAILABLE
        ),
        Vehicle(
            id="veh-4",
            name="Van 04 (Cold-Chain Electric Stepvan)",
            capacity_kg=90.0,
            has_refrigeration=True,
            speed_kmh=20.0,
            current_location=DEPOT_LOCATION,
            status=VehicleStatus.AVAILABLE
        )
    ]

def get_initial_donation_lots() -> List[DonationLot]:
    return [
        DonationLot(
            id="lot-01",
            donor_id="sup-1",
            donor_name="Artisan Sourdough Bakery (SoHo)",
            food_name="Artisan Country Boules & Baguettes",
            food_category=FoodCategory.SHELF_STABLE,
            quantity_kg=25.0,
            requires_refrigeration=False,
            storage_type=StorageRequirement.AMBIENT,
            pickup_window_start_min=0,
            pickup_window_end_min=60,
            expiry_min=240,
            dietary_tags=["Vegan", "Vegetarian"],
            location=SUPPLIERS_LOCATIONS["sup-1"],
            status=LotStatus.AVAILABLE
        ),
        DonationLot(
            id="lot-02",
            donor_id="sup-1",
            donor_name="Artisan Sourdough Bakery (SoHo)",
            food_name="Almond Croissants & Brioche",
            food_category=FoodCategory.SHELF_STABLE,
            quantity_kg=15.0,
            requires_refrigeration=False,
            storage_type=StorageRequirement.AMBIENT,
            pickup_window_start_min=0,
            pickup_window_end_min=60,
            expiry_min=180,
            dietary_tags=["Vegetarian"],
            location=SUPPLIERS_LOCATIONS["sup-1"],
            status=LotStatus.AVAILABLE
        ),
        DonationLot(
            id="lot-03",
            donor_id="sup-2",
            donor_name="Hudson Organic Market (Chelsea)",
            food_name="Greek Whole Milk Yogurt & Cheeses",
            food_category=FoodCategory.CHILLED_DAIRY_MEAT,
            quantity_kg=30.0,
            requires_refrigeration=True,
            storage_type=StorageRequirement.CHILLED,
            pickup_window_start_min=10,
            pickup_window_end_min=60,
            expiry_min=120,
            dietary_tags=["Vegetarian", "Gluten-Free"],
            location=SUPPLIERS_LOCATIONS["sup-2"],
            status=LotStatus.AVAILABLE
        ),
        DonationLot(
            id="lot-04",
            donor_id="sup-2",
            donor_name="Hudson Organic Market (Chelsea)",
            food_name="Organic Spinach & Mixed Berry Clamshells",
            food_category=FoodCategory.FRESH_PRODUCE,
            quantity_kg=20.0,
            requires_refrigeration=False,
            storage_type=StorageRequirement.AMBIENT,
            pickup_window_start_min=10,
            pickup_window_end_min=75,
            expiry_min=180,
            dietary_tags=["Vegan", "Gluten-Free"],
            location=SUPPLIERS_LOCATIONS["sup-2"],
            status=LotStatus.AVAILABLE
        ),
        DonationLot(
            id="lot-05",
            donor_id="sup-3",
            donor_name="Manhattan Corporate Catering (Midtown)",
            food_name="Roasted Chicken Breast & Herb Potatoes",
            food_category=FoodCategory.PREPARED_HOT,
            quantity_kg=35.0,
            requires_refrigeration=False,
            storage_type=StorageRequirement.HOT_HOLDING,
            pickup_window_start_min=0,
            pickup_window_end_min=45,
            expiry_min=90,
            dietary_tags=["Halal", "Gluten-Free"],
            location=SUPPLIERS_LOCATIONS["sup-3"],
            status=LotStatus.AVAILABLE
        ),
        DonationLot(
            id="lot-06",
            donor_id="sup-3",
            donor_name="Manhattan Corporate Catering (Midtown)",
            food_name="Steamed Quinoa & Vegetable Curry",
            food_category=FoodCategory.PREPARED_HOT,
            quantity_kg=25.0,
            requires_refrigeration=False,
            storage_type=StorageRequirement.HOT_HOLDING,
            pickup_window_start_min=0,
            pickup_window_end_min=45,
            expiry_min=90,
            dietary_tags=["Vegan", "Halal", "Gluten-Free"],
            location=SUPPLIERS_LOCATIONS["sup-3"],
            status=LotStatus.AVAILABLE
        ),
        DonationLot(
            id="lot-07",
            donor_id="sup-4",
            donor_name="St. Marks Gourmet Deli (East Village)",
            food_name="Turkey & Cheddar Paninis",
            food_category=FoodCategory.PREPARED_HOT,
            quantity_kg=20.0,
            requires_refrigeration=False,
            storage_type=StorageRequirement.HOT_HOLDING,
            pickup_window_start_min=20,
            pickup_window_end_min=70,
            expiry_min=100,
            dietary_tags=["Nut-Free"],
            location=SUPPLIERS_LOCATIONS["sup-4"],
            status=LotStatus.AVAILABLE
        ),
        DonationLot(
            id="lot-08",
            donor_id="sup-4",
            donor_name="St. Marks Gourmet Deli (East Village)",
            food_name="Chilled Pasta Salads & Cole Slaw",
            food_category=FoodCategory.CHILLED_DAIRY_MEAT,
            quantity_kg=15.0,
            requires_refrigeration=True,
            storage_type=StorageRequirement.CHILLED,
            pickup_window_start_min=20,
            pickup_window_end_min=80,
            expiry_min=130,
            dietary_tags=["Vegetarian"],
            location=SUPPLIERS_LOCATIONS["sup-4"],
            status=LotStatus.AVAILABLE
        ),
        DonationLot(
            id="lot-09",
            donor_id="sup-5",
            donor_name="Hell's Kitchen Wholesale Produce",
            food_name="Crisp Honeycrisp Apples & Navel Oranges",
            food_category=FoodCategory.FRESH_PRODUCE,
            quantity_kg=40.0,
            requires_refrigeration=False,
            storage_type=StorageRequirement.AMBIENT,
            pickup_window_start_min=15,
            pickup_window_end_min=90,
            expiry_min=240,
            dietary_tags=["Vegan", "Gluten-Free"],
            location=SUPPLIERS_LOCATIONS["sup-5"],
            status=LotStatus.AVAILABLE
        ),
        DonationLot(
            id="lot-10",
            donor_id="sup-5",
            donor_name="Hell's Kitchen Wholesale Produce",
            food_name="Russet Potatoes & Sweet Onions",
            food_category=FoodCategory.FRESH_PRODUCE,
            quantity_kg=40.0,
            requires_refrigeration=False,
            storage_type=StorageRequirement.AMBIENT,
            pickup_window_start_min=15,
            pickup_window_end_min=90,
            expiry_min=300,
            dietary_tags=["Vegan"],
            location=SUPPLIERS_LOCATIONS["sup-5"],
            status=LotStatus.AVAILABLE
        ),
        DonationLot(
            id="lot-11",
            donor_id="sup-6",
            donor_name="Wall St Conference Banquet Center",
            food_name="Braised Beef Brisket Trays",
            food_category=FoodCategory.PREPARED_HOT,
            quantity_kg=30.0,
            requires_refrigeration=False,
            storage_type=StorageRequirement.HOT_HOLDING,
            pickup_window_start_min=30,
            pickup_window_end_min=80,
            expiry_min=110,
            dietary_tags=["Kosher-Style"],
            location=SUPPLIERS_LOCATIONS["sup-6"],
            status=LotStatus.AVAILABLE
        ),
        DonationLot(
            id="lot-12",
            donor_id="sup-6",
            donor_name="Wall St Conference Banquet Center",
            food_name="Chilled Smoked Salmon & Caviar Creams",
            food_category=FoodCategory.CHILLED_DAIRY_MEAT,
            quantity_kg=25.0,
            requires_refrigeration=True,
            storage_type=StorageRequirement.CHILLED,
            pickup_window_start_min=30,
            pickup_window_end_min=80,
            expiry_min=120,
            dietary_tags=["Pescatarian"],
            location=SUPPLIERS_LOCATIONS["sup-6"],
            status=LotStatus.AVAILABLE
        )
    ]

def get_initial_demands() -> List[RecipientDemand]:
    return [
        RecipientDemand(
            id="dem-01",
            recipient_id="rec-1",
            recipient_name="The Bowery Mission Shelter",
            food_category=FoodCategory.PREPARED_HOT,
            requested_kg=45.0,
            delivery_window_start_min=20,
            delivery_window_end_min=100,
            priority_level=3,
            dietary_tags=["Halal"],
            location=RECIPIENTS_LOCATIONS["rec-1"],
            status=DemandStatus.PENDING
        ),
        RecipientDemand(
            id="dem-02",
            recipient_id="rec-1",
            recipient_name="The Bowery Mission Shelter",
            food_category=FoodCategory.FRESH_PRODUCE,
            requested_kg=25.0,
            delivery_window_start_min=30,
            delivery_window_end_min=120,
            priority_level=3,
            dietary_tags=[],
            location=RECIPIENTS_LOCATIONS["rec-1"],
            status=DemandStatus.PENDING
        ),
        RecipientDemand(
            id="dem-03",
            recipient_id="rec-2",
            recipient_name="Nazareth Supportive Family Housing",
            food_category=FoodCategory.SHELF_STABLE,
            requested_kg=35.0,
            delivery_window_start_min=30,
            delivery_window_end_min=150,
            priority_level=2,
            dietary_tags=["Vegetarian"],
            location=RECIPIENTS_LOCATIONS["rec-2"],
            status=DemandStatus.PENDING
        ),
        RecipientDemand(
            id="dem-04",
            recipient_id="rec-2",
            recipient_name="Nazareth Supportive Family Housing",
            food_category=FoodCategory.CHILLED_DAIRY_MEAT,
            requested_kg=25.0,
            delivery_window_start_min=30,
            delivery_window_end_min=120,
            priority_level=2,
            dietary_tags=[],
            location=RECIPIENTS_LOCATIONS["rec-2"],
            status=DemandStatus.PENDING
        ),
        RecipientDemand(
            id="dem-05",
            recipient_id="rec-3",
            recipient_name="Grand Central Food Program",
            food_category=FoodCategory.PREPARED_HOT,
            requested_kg=40.0,
            delivery_window_start_min=40,
            delivery_window_end_min=110,
            priority_level=3,
            dietary_tags=[],
            location=RECIPIENTS_LOCATIONS["rec-3"],
            status=DemandStatus.PENDING
        ),
        RecipientDemand(
            id="dem-06",
            recipient_id="rec-3",
            recipient_name="Grand Central Food Program",
            food_category=FoodCategory.FRESH_PRODUCE,
            requested_kg=35.0,
            delivery_window_start_min=45,
            delivery_window_end_min=180,
            priority_level=3,
            dietary_tags=[],
            location=RECIPIENTS_LOCATIONS["rec-3"],
            status=DemandStatus.PENDING
        ),
        RecipientDemand(
            id="dem-07",
            recipient_id="rec-4",
            recipient_name="Chelsea Community Soup Kitchen",
            food_category=FoodCategory.CHILLED_DAIRY_MEAT,
            requested_kg=30.0,
            delivery_window_start_min=25,
            delivery_window_end_min=120,
            priority_level=2,
            dietary_tags=[],
            location=RECIPIENTS_LOCATIONS["rec-4"],
            status=DemandStatus.PENDING
        ),
        RecipientDemand(
            id="dem-08",
            recipient_id="rec-4",
            recipient_name="Chelsea Community Soup Kitchen",
            food_category=FoodCategory.PREPARED_HOT,
            requested_kg=20.0,
            delivery_window_start_min=30,
            delivery_window_end_min=95,
            priority_level=2,
            dietary_tags=[],
            location=RECIPIENTS_LOCATIONS["rec-4"],
            status=DemandStatus.PENDING
        ),
        RecipientDemand(
            id="dem-09",
            recipient_id="rec-5",
            recipient_name="Lower East Side Youth Care Pantry",
            food_category=FoodCategory.FRESH_PRODUCE,
            requested_kg=20.0,
            delivery_window_start_min=50,
            delivery_window_end_min=200,
            priority_level=1,
            dietary_tags=[],
            location=RECIPIENTS_LOCATIONS["rec-5"],
            status=DemandStatus.PENDING
        ),
        RecipientDemand(
            id="dem-10",
            recipient_id="rec-6",
            recipient_name="Harlem Senior Meal Program",
            food_category=FoodCategory.CHILLED_DAIRY_MEAT,
            requested_kg=15.0,
            delivery_window_start_min=60,
            delivery_window_end_min=180,
            priority_level=1,
            dietary_tags=[],
            location=RECIPIENTS_LOCATIONS["rec-6"],
            status=DemandStatus.PENDING
        )
    ]
