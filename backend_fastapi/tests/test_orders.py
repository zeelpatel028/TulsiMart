import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_order_creation_and_stock_deduction(client: AsyncClient):
    # 1. Create product with 20 stock
    prod_res = await client.post("/api/inventory/products/", json={
        "name": "Basmati Rice 5kg",
        "sku": "RICE-BASMATI-5K",
        "selling_price": 450.00,
        "stock_quantity": 20.0
    })
    prod_id = prod_res.json()["data"]["id"]

    # 2. Place order for 2 units
    order_res = await client.post("/api/orders/orders/", json={
        "customer_name": "Ramesh Kumar",
        "payment_method": "CASH",
        "total_amount": 900.00,
        "items": [
            {
                "product_id": prod_id,
                "product_name": "Basmati Rice 5kg",
                "unit_price": 450.00,
                "quantity": 2.0,
                "subtotal": 900.00
            }
        ]
    })
    assert order_res.status_code == 201
    order_data = order_res.json()["data"]
    assert order_data["total_amount"] == 900.00

    # 3. Check stock was deducted to 18
    get_prod = await client.get(f"/api/inventory/products/{prod_id}/")
    assert get_prod.json()["data"]["stock_quantity"] == 18.0
