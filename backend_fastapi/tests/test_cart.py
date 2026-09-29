import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_coupon_validation(client: AsyncClient):
    # Create coupon
    await client.post("/api/offers/coupons/", json={
        "code": "WELCOME10",
        "title": "Welcome 10% Discount",
        "offer_type": "PERCENTAGE",
        "discount_value": 10.0,
        "min_order_amount": 100.0,
        "valid_from": "2026-01-01",
        "valid_to": "2030-12-31"
    })

    # Validate coupon
    val_res = await client.post("/api/offers/coupons/validate_code/", json={
        "code": "WELCOME10",
        "cart_amount": 500.0
    })
    assert val_res.status_code == 200
    assert val_res.json()["data"]["discount_amount"] == 50.0
