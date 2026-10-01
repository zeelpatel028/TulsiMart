from fastapi.testclient import TestClient


def test_list_customers_api(client: TestClient):
    response = client.get("/api/customers/customers/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)


def test_create_and_get_customer_api(client: TestClient):
    # Login as admin to get auth headers
    login_res = client.post("/api/core/auth/login/", json={"username": "admin", "password": "admin123"})
    token = login_res.json().get("data", {}).get("access")
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    # 1. Create Customer
    payload = {
        "name": "Fast Test Customer",
        "phone": "9988776655",
        "email": "fasttest@example.com",
        "address": "123 Main St",
        "city": "Mumbai",
        "pincode": "400001"
    }
    create_res = client.post("/api/customers/customers/", json=payload, headers=headers)
    assert create_res.status_code in [200, 201]
    cust_data = create_res.json()["data"]
    cust_id = cust_data["id"]

    # 2. Get Single Customer
    get_res = client.get(f"/api/customers/customers/{cust_id}/")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["name"] == "Fast Test Customer"

    # 3. Get Purchase History
    hist_res = client.get(f"/api/customers/customers/{cust_id}/purchase_history/")
    assert hist_res.status_code == 200
    assert hist_res.json()["success"] is True

