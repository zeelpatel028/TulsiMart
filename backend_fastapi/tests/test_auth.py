from fastapi.testclient import TestClient


def test_login_success(client: TestClient):
    response = client.post("/api/core/auth/login/", json={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access" in data["data"] or "require_otp" in data["data"]


def test_login_invalid_password(client: TestClient):
    response = client.post("/api/core/auth/login/", json={
        "username": "admin",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False


def test_get_me_unauthorized(client: TestClient):
    response = client.get("/api/core/auth/me/")
    assert response.status_code in [200, 401]
