import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_staff_management(client: AsyncClient):
    # Create Staff
    res = await client.post("/api/core/staff/", json={
        "name": "Suresh Patel",
        "phone": "+91 98200 12345",
        "role": "CASHIER",
        "salary": 18000.00
    })
    assert res.status_code == 201
    staff_id = res.json()["data"]["id"]

    # List Staff
    list_res = await client.get("/api/core/staff/")
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 1

    # Toggle status
    toggle_res = await client.post(f"/api/core/staff/{staff_id}/toggle_status/")
    assert toggle_res.status_code == 200
    assert toggle_res.json()["data"]["is_active"] is False
