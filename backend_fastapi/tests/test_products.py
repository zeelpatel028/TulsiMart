import uuid
from fastapi.testclient import TestClient


def test_create_and_list_category(client: TestClient):
    login_res = client.post("/api/core/auth/login/", json={"username": "admin", "password": "admin123"})
    token = login_res.json().get("data", {}).get("access")
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    cat_name = f"Test Category {uuid.uuid4().hex[:6]}"
    response = client.post("/api/inventory/categories/", json={
        "name": cat_name,
        "description": "Fresh Milk, Cheese and Curd"
    }, headers=headers)
    assert response.status_code == 201

    list_res = client.get("/api/inventory/categories/")
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 1


def test_create_and_list_product(client: TestClient):
    login_res = client.post("/api/core/auth/login/", json={"username": "admin", "password": "admin123"})
    token = login_res.json().get("data", {}).get("access")
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    sku = f"TEST-MILK-{uuid.uuid4().hex[:6]}"
    # Create product
    response = client.post("/api/inventory/products/", json={
        "name": "Test Milk 1L",
        "sku": sku,
        "selling_price": 68.00,
        "mrp": 70.00,
        "stock_quantity": 50.0
    }, headers=headers)
    assert response.status_code == 201
    product = response.json()["data"]
    assert product["name"] == "Test Milk 1L"
    assert float(product["stock_quantity"]) == 50.0

    # List products with pagination
    list_res = client.get("/api/inventory/products/?page=1&limit=10")
    assert list_res.status_code == 200
    res_data = list_res.json()
    assert res_data["success"] is True
    assert "pagination" in res_data

    # Clean up test product
    client.delete(f"/api/inventory/products/{product['id']}/", headers=headers)
