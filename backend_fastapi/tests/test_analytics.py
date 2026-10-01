from fastapi.testclient import TestClient


def test_dashboard_summary_api(client: TestClient):
    response = client.get("/api/analytics/dashboard-summary/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "kpis" in data["data"]


def test_sales_trends_api(client: TestClient):
    response = client.get("/api/analytics/sales-trends/?days=7")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], (dict, list))

