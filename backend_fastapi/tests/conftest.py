import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import Base, get_db, engine, SessionLocal
from app.models.user import LoginAccount
from app.core.security import get_password_hash


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        existing = db.query(LoginAccount).filter(LoginAccount.username == "testadmin").first()
        if not existing:
            admin_user = LoginAccount(
                username="testadmin",
                password=get_password_hash("admin123"),
                full_name="Test Admin",
                email="admin@tulsimart.test",
                role="ADMIN",
                require_otp=False
            )
            db.add(admin_user)
            db.commit()
    yield


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c
