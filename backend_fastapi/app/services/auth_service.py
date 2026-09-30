from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, create_access_token, create_refresh_token


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)

    def login(self, username: str, password: str) -> Dict[str, Any]:
        user = self.repo.get_by_username(username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is disabled"
            )

        if not verify_password(password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )

        # Check if OTP is required for this user
        if user.require_otp:
            return {
                "require_otp": True,
                "message": "OTP verification required"
            }

        access_token = create_access_token({"sub": str(user.id), "username": user.username, "role": user.role})
        refresh_token = create_refresh_token({"sub": str(user.id), "username": user.username})

        return {
            "access": access_token,
            "refresh": refresh_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role
            },
            "permissions": ["all"] if user.role == "ADMIN" else ["view", "pos"]
        }

    def verify_otp(self, username: str, otp: str) -> Dict[str, Any]:
        user = self.repo.get_by_username(username)
        if not user:
            raise HTTPException(status_code=400, detail="User not found")

        # Static / Demo OTP verification (e.g. '123456' or '000000')
        if otp not in ["123456", "000000", "111111"]:
            raise HTTPException(status_code=400, detail="Invalid OTP code")

        access_token = create_access_token({"sub": str(user.id), "username": user.username, "role": user.role})
        refresh_token = create_refresh_token({"sub": str(user.id), "username": user.username})

        return {
            "access": access_token,
            "refresh": refresh_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role
            },
            "permissions": ["all"] if user.role == "ADMIN" else ["view", "pos"]
        }
