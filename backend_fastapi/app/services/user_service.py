from typing import List, Tuple, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository
from app.models.user import LoginAccount
from app.models.staff import Staff
from app.schemas.user import LoginAccountCreate, LoginAccountUpdate, StaffCreate, StaffUpdate
from app.core.security import get_password_hash


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)

    def list_accounts(self, page: int = 1, limit: int = 20) -> Tuple[List[LoginAccount], int]:
        return self.repo.list_accounts(page=page, limit=limit)

    def create_account(self, data: LoginAccountCreate) -> LoginAccount:
        existing = self.repo.get_by_username(data.username)
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")

        account = LoginAccount(
            username=data.username,
            password=get_password_hash(data.password),
            full_name=data.full_name,
            email=data.email,
            role=data.role,
            require_otp=data.require_otp
        )
        return self.repo.create_account(account)

    def update_account(self, account_id: int, data: LoginAccountUpdate) -> LoginAccount:
        account = self.repo.get_by_id(account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        if data.full_name is not None:
            account.full_name = data.full_name
        if data.email is not None:
            account.email = data.email
        if data.role is not None:
            account.role = data.role
        if data.is_active is not None:
            account.is_active = data.is_active
        if data.require_otp is not None:
            account.require_otp = data.require_otp
        if data.password:
            account.password = get_password_hash(data.password)

        self.db.flush()
        return account

    def delete_account(self, account_id: int) -> None:
        account = self.repo.get_by_id(account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        self.db.delete(account)
        self.db.flush()

    def toggle_status(self, account_id: int) -> LoginAccount:
        account = self.repo.get_by_id(account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        account.is_active = not account.is_active
        self.db.flush()
        return account

    def toggle_otp(self, account_id: int) -> LoginAccount:
        account = self.repo.get_by_id(account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        account.require_otp = not account.require_otp
        self.db.flush()
        return account

    # Staff
    def list_staff(self, page: int = 1, limit: int = 20) -> Tuple[List[Staff], int]:
        return self.repo.list_staff(page=page, limit=limit)

    def create_staff(self, data: StaffCreate) -> Staff:
        staff = Staff(
            name=data.name,
            phone=data.phone,
            email=data.email,
            role=data.role,
            salary=data.salary
        )
        return self.repo.create_staff(staff)

    def update_staff(self, staff_id: int, data: StaffUpdate) -> Staff:
        staff = self.repo.get_staff_by_id(staff_id)
        if not staff:
            raise HTTPException(status_code=404, detail="Staff member not found")

        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(staff, key, value)

        self.db.flush()
        return staff

    def delete_staff(self, staff_id: int) -> None:
        staff = self.repo.get_staff_by_id(staff_id)
        if not staff:
            raise HTTPException(status_code=404, detail="Staff member not found")
        self.db.delete(staff)
        self.db.flush()

    def toggle_staff_status(self, staff_id: int) -> Staff:
        staff = self.repo.get_staff_by_id(staff_id)
        if not staff:
            raise HTTPException(status_code=404, detail="Staff member not found")
        staff.is_active = not staff.is_active
        self.db.flush()
        return staff
