import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard_summary_api(client: AsyncClient):
    response = await client.get("/api/analytics/dashboard-summary/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "total_products" in data["data"]
    assert "total_orders" in data["data"]
    assert "total_sales" in data["data"]


@pytest.mark.asyncio
async def test_sales_trends_api(client: AsyncClient):
    response = await client.get("/api/analytics/sales-trends/?days=7")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
