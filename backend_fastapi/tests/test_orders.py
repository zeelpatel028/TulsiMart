import uuid
from fastapi.testclient import TestClient


def test_order_creation_and_stock_deduction(client: TestClient):
    # Login as admin
    login_res = client.post("/api/core/auth/login/", json={"username": "admin", "password": "admin123"})
    token = login_res.json().get("data", {}).get("access")
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    sku = f"TEST-RICE-{uuid.uuid4().hex[:6]}"
    # 1. Create product with 20 stock
    prod_res = client.post("/api/inventory/products/", json={
        "name": "Test Basmati Rice 5kg",
        "sku": sku,
        "selling_price": 450.00,
        "stock_quantity": 20.0
    }, headers=headers)
    assert prod_res.status_code == 201
    prod_id = prod_res.json()["data"]["id"]

    # 2. Place order for 2 units
    order_res = client.post("/api/orders/orders/", json={
        "customer_name": "Ramesh Kumar",
        "payment_method": "CASH",
        "total_amount": 900.00,
        "items": [
            {
                "product_id": prod_id,
                "product_name": "Test Basmati Rice 5kg",
                "unit_price": 450.00,
                "quantity": 2.0,
                "subtotal": 900.00
            }
        ]
    }, headers=headers)
    assert order_res.status_code == 201
    order_data = order_res.json()["data"]
    assert float(order_data["total_amount"]) == 900.00

    # 3. Check stock was deducted to 18
    get_prod = client.get(f"/api/inventory/products/{prod_id}/")
    assert float(get_prod.json()["data"]["stock_quantity"]) == 18.0

    # Clean up test product
    client.delete(f"/api/inventory/products/{prod_id}/", headers=headers)
