from typing import List, Callable, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import LoginAccount

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/core/auth/login/", auto_error=False)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> LoginAccount:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub") or payload.get("user_id")
    if user_id is not None:
        try:
            uid = int(user_id)
        except (ValueError, TypeError):
            raise credentials_exception
        user = db.query(LoginAccount).filter(LoginAccount.id == uid).first()
    else:
        username = payload.get("username")
        if not username:
            raise credentials_exception
        user = db.query(LoginAccount).filter(LoginAccount.username == username).first()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive or non-existent user"
        )

    return user


def require_roles(allowed_roles: List[str]) -> Callable:
    def role_checker(current_user: LoginAccount = Depends(get_current_user)) -> LoginAccount:
        if current_user.role not in allowed_roles and current_user.role != 'ADMIN':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {allowed_roles}"
            )
        return current_user
    return role_checker


require_admin = require_roles(["ADMIN"])
require_staff = require_roles(["ADMIN", "STORE_MANAGER", "CASHIER"])
