from typing import List, Tuple, Optional
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repository import UserRepository
from app.models.user import LoginAccount
from app.models.staff import Staff
from app.schemas.user import LoginAccountCreate, LoginAccountUpdate, StaffCreate, StaffUpdate
from app.core.security import get_password_hash


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = UserRepository(db)

    async def list_accounts(self, page: int = 1, limit: int = 20) -> Tuple[List[LoginAccount], int]:
        return await self.repo.list_accounts(page=page, limit=limit)

    async def create_account(self, data: LoginAccountCreate) -> LoginAccount:
        existing = await self.repo.get_by_username(data.username)
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
        return await self.repo.create_account(account)

    async def update_account(self, account_id: int, data: LoginAccountUpdate) -> LoginAccount:
        account = await self.repo.get_by_id(account_id)
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

        await self.db.flush()
        return account

    async def delete_account(self, account_id: int) -> None:
        account = await self.repo.get_by_id(account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        await self.db.delete(account)
        await self.db.flush()

    async def toggle_status(self, account_id: int) -> LoginAccount:
        account = await self.repo.get_by_id(account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        account.is_active = not account.is_active
        await self.db.flush()
        return account

    async def toggle_otp(self, account_id: int) -> LoginAccount:
        account = await self.repo.get_by_id(account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        account.require_otp = not account.require_otp
        await self.db.flush()
        return account

    # Staff
    async def list_staff(self, page: int = 1, limit: int = 20) -> Tuple[List[Staff], int]:
        return await self.repo.list_staff(page=page, limit=limit)

    async def create_staff(self, data: StaffCreate) -> Staff:
        staff = Staff(
            name=data.name,
            phone=data.phone,
            email=data.email,
            role=data.role,
            salary=data.salary
        )
        return await self.repo.create_staff(staff)

    async def update_staff(self, staff_id: int, data: StaffUpdate) -> Staff:
        staff = await self.repo.get_staff_by_id(staff_id)
        if not staff:
            raise HTTPException(status_code=404, detail="Staff member not found")

        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(staff, key, value)

        await self.db.flush()
        return staff

    async def delete_staff(self, staff_id: int) -> None:
        staff = await self.repo.get_staff_by_id(staff_id)
        if not staff:
            raise HTTPException(status_code=404, detail="Staff member not found")
        await self.db.delete(staff)
        await self.db.flush()

    async def toggle_staff_status(self, staff_id: int) -> Staff:
        staff = await self.repo.get_staff_by_id(staff_id)
        if not staff:
            raise HTTPException(status_code=404, detail="Staff member not found")
        staff.is_active = not staff.is_active
        await self.db.flush()
        return staff
