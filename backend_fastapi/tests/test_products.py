import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_list_category(client: AsyncClient):
    response = await client.post("/api/inventory/categories/", json={
        "name": "Dairy & Milk",
        "description": "Fresh Milk, Cheese and Curd"
    })
    assert response.status_code == 201
    cat_id = response.json()["data"]["id"]

    list_res = await client.get("/api/inventory/categories/")
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 1


@pytest.mark.asyncio
async def test_create_and_list_product(client: AsyncClient):
    # Create product
    response = await client.post("/api/inventory/products/", json={
        "name": "Amul Taza Milk 1L",
        "sku": "MILK-001",
        "selling_price": 68.00,
        "mrp": 70.00,
        "stock_quantity": 50.0
    })
    assert response.status_code == 201
    product = response.json()["data"]
    assert product["name"] == "Amul Taza Milk 1L"
    assert product["stock_quantity"] == 50.0

    # List products with pagination
    list_res = await client.get("/api/inventory/products/?page=1&limit=10")
    assert list_res.status_code == 200
    res_data = list_res.json()
    assert res_data["success"] is True
    assert "pagination" in res_data
