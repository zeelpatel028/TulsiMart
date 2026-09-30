from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin, require_staff
from app.models.user import LoginAccount
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.repositories.store_repository import StoreRepository
from app.schemas.user import (
    LoginRequest, OTPVerifyRequest, LoginAccountCreate, LoginAccountUpdate,
    LoginAccountResponse, StaffCreate, StaffUpdate, StaffResponse
)
from app.utils.response import success_response, error_response
from app.utils.pagination import PaginationParams, get_pagination_meta

router = APIRouter(tags=["Auth & User Management"])

# --- AUTH ENDPOINTS ---

@router.post("/core/auth/login/")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    res = service.login(username=data.username, password=data.password)
    return success_response(data=res, message="Login evaluated")


@router.post("/core/auth/verify-otp/")
def verify_otp(data: OTPVerifyRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    res = service.verify_otp(username=data.username, otp=data.otp)
    return success_response(data=res, message="OTP verified successfully")


@router.post("/core/auth/refresh/")
def refresh_token(db: Session = Depends(get_db)):
    return success_response(data={"refreshed": True}, message="Token refreshed")


@router.get("/core/auth/me/")
def get_me(current_user: LoginAccount = Depends(get_current_user)):
    user_data = {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "require_otp": current_user.require_otp
    }
    return success_response(data=user_data, message="Current user profile fetched")


# --- LOGIN ACCOUNTS ENDPOINTS ---

@router.get("/core/login-accounts/")
def list_accounts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = UserService(db)
    accounts, total = service.list_accounts(page=page, limit=limit)
    data = [LoginAccountResponse.model_validate(a).model_dump() for a in accounts]
    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Login accounts fetched")


@router.post("/core/login-accounts/")
def create_account(
    data: LoginAccountCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = UserService(db)
    account = service.create_account(data)
    res_data = LoginAccountResponse.model_validate(account).model_dump()
    return success_response(data=res_data, message="Account created successfully", status_code=status.HTTP_201_CREATED)


@router.put("/core/login-accounts/{account_id}/")
def update_account(
    account_id: int,
    data: LoginAccountUpdate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = UserService(db)
    account = service.update_account(account_id, data)
    res_data = LoginAccountResponse.model_validate(account).model_dump()
    return success_response(data=res_data, message="Account updated successfully")


@router.delete("/core/login-accounts/{account_id}/")
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = UserService(db)
    service.delete_account(account_id)
    return success_response(data=None, message="Account deleted successfully")


@router.post("/core/login-accounts/{account_id}/toggle_status/")
def toggle_account_status(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = UserService(db)
    account = service.toggle_status(account_id)
    return success_response(data=LoginAccountResponse.model_validate(account).model_dump(), message="Status toggled")


@router.post("/core/login-accounts/{account_id}/toggle_otp/")
def toggle_account_otp(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = UserService(db)
    account = service.toggle_otp(account_id)
    return success_response(data=LoginAccountResponse.model_validate(account).model_dump(), message="OTP requirement toggled")


# --- STAFF ENDPOINTS ---

@router.get("/core/staff/")
def list_staff(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = UserService(db)
    staff_list, total = service.list_staff(page=page, limit=limit)
    data = [StaffResponse.model_validate(s).model_dump() for s in staff_list]
    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Staff list fetched")


@router.post("/core/staff/")
def create_staff(
    data: StaffCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = UserService(db)
    staff = service.create_staff(data)
    return success_response(data=StaffResponse.model_validate(staff).model_dump(), message="Staff created", status_code=201)


@router.put("/core/staff/{staff_id}/")
def update_staff(
    staff_id: int,
    data: StaffUpdate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = UserService(db)
    staff = service.update_staff(staff_id, data)
    return success_response(data=StaffResponse.model_validate(staff).model_dump(), message="Staff updated")


@router.delete("/core/staff/{staff_id}/")
def delete_staff(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = UserService(db)
    service.delete_staff(staff_id)
    return success_response(data=None, message="Staff deleted")


@router.post("/core/staff/{staff_id}/toggle_status/")
def toggle_staff_status(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = UserService(db)
    staff = service.toggle_staff_status(staff_id)
    return success_response(data=StaffResponse.model_validate(staff).model_dump(), message="Staff status toggled")


@router.post("/core/staff/{staff_id}/update_attendance/")
def update_staff_attendance(
    staff_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = UserService(db)
    staff = service.repo.get_staff_by_id(staff_id)
    if not staff:
        return error_response(message="Staff not found", status_code=404)
    staff.attendance_data = payload.get("attendance_data", {})
    db.flush()
    return success_response(data=StaffResponse.model_validate(staff).model_dump(), message="Attendance updated")


# --- LOGS ---

@router.get("/core/logs/")
def list_activity_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    repo = StoreRepository(db)
    logs, total = repo.list_activity_logs(page=page, limit=limit)
    data = [
        {
            "id": l.id,
            "user_name": l.user_name,
            "action": l.action,
            "module": l.module,
            "details": l.details,
            "created_at": l.created_at.isoformat() if l.created_at else None
        } for l in logs
    ]
    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Activity logs fetched")
