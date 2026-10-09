import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_api_state_and_solve():
    res = client.get("/api/v1/state")
    assert res.status_code == 200
    data = res.json()
    assert len(data["lots"]) > 0
    assert len(data["demands"]) > 0
    assert len(data["vehicles"]) == 4

    solve_res = client.post("/api/v1/plans/solve")
    assert solve_res.status_code == 200
    plan_data = solve_res.json()["plan"]
    assert plan_data["version"] == 1
    assert plan_data["verification"]["is_valid"] is True

def test_api_intake_donation():
    payload = {
        "raw_text": "We have 40kg of organic fresh berries ready for pickup immediately",
        "donor_id": "sup-test",
        "donor_name": "Test Market"
    }
    res = client.post("/api/v1/donations/intake", json=payload)
    assert res.status_code == 200
    lot = res.json()["lot"]
    assert lot["quantity_kg"] == 40.0
    assert lot["food_category"] == "Fresh Produce"

def test_api_disruption_and_diff():
    # Solve initial plan
    client.post("/api/v1/plans/solve")

    # Inject breakdown
    disrupt_payload = {
        "event_type": "VEHICLE_BREAKDOWN",
        "target_id": "veh-1",
        "timestamp_min": 25,
        "description": "Flat tire on Van 01"
    }
    res = client.post("/api/v1/disruptions/inject", json=disrupt_payload)
    assert res.status_code == 200
    assert res.json()["new_plan"]["version"] == 2

    # Check diff
    diff_res = client.get("/api/v1/plans/diff")
    assert diff_res.status_code == 200
    diff = diff_res.json()
    assert diff["new_version"] == 2
    assert "stability_pct" in diff

def test_api_benchmark_comparison():
    res = client.post("/api/v1/benchmarks/compare")
    assert res.status_code == 200
    bench = res.json()
    assert "rescuefood" in bench
    assert "greedy_baseline" in bench
    assert "delta" in bench
