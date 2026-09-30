import uuid
from fastapi.testclient import TestClient


def test_staff_management(client: TestClient):
    login_res = client.post("/api/core/auth/login/", json={"username": "admin", "password": "admin123"})
    token = login_res.json().get("data", {}).get("access")
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    unique_num = uuid.uuid4().hex[:6]
    # Create Staff
    res = client.post("/api/core/staff/", json={
        "name": f"Test Suresh {unique_num}",
        "phone": f"+91 98200 {unique_num[:5]}",
        "role": "CASHIER",
        "salary": 18000.00
    }, headers=headers)
    assert res.status_code == 201
    staff_id = res.json()["data"]["id"]

    # List Staff
    list_res = client.get("/api/core/staff/", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 1

    # Toggle status
    toggle_res = client.post(f"/api/core/staff/{staff_id}/toggle_status/", headers=headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["data"]["is_active"] is False

    # Clean up test staff
    client.delete(f"/api/core/staff/{staff_id}/", headers=headers)
