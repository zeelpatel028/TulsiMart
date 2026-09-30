from fastapi.testclient import TestClient


def test_coupon_validation(client: TestClient):
    # Login to get admin token
    login_res = client.post("/api/core/auth/login/", json={"username": "admin", "password": "admin123"})
    token = login_res.json().get("data", {}).get("access")
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    # Create coupon
    client.post("/api/offers/coupons/", json={
        "code": "TEST10",
        "title": "Test 10% Discount",
        "offer_type": "PERCENTAGE",
        "discount_value": 10.0,
        "min_order_amount": 100.0,
        "valid_from": "2026-01-01",
        "valid_to": "2030-12-31"
    }, headers=headers)

    # Validate coupon
    val_res = client.post("/api/offers/coupons/validate_code/", json={
        "code": "TEST10",
        "cart_amount": 500.0
    })
    assert val_res.status_code == 200
    assert val_res.json()["data"]["discount_amount"] == 50.0
