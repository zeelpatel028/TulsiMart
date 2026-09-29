from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, delete
from app.models.user import LoginAccount
from app.models.staff import Staff


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_username(self, username: str) -> Optional[LoginAccount]:
        result = await self.db.execute(select(LoginAccount).where(LoginAccount.username == username))
        return result.scalars().first()

    async def get_by_id(self, user_id: int) -> Optional[LoginAccount]:
        result = await self.db.execute(select(LoginAccount).where(LoginAccount.id == user_id))
        return result.scalars().first()

    async def list_accounts(self, page: int = 1, limit: int = 20) -> Tuple[List[LoginAccount], int]:
        offset = (page - 1) * limit
        count_res = await self.db.execute(select(func.count(LoginAccount.id)))
        total = count_res.scalar_one()

        query = select(LoginAccount).order_by(LoginAccount.id.desc()).offset(offset).limit(limit)
        res = await self.db.execute(query)
        return list(res.scalars().all()), total

    async def create_account(self, account: LoginAccount) -> LoginAccount:
        self.db.add(account)
        await self.db.flush()
        await self.db.refresh(account)
        return account

    async def list_staff(self, page: int = 1, limit: int = 20) -> Tuple[List[Staff], int]:
        offset = (page - 1) * limit
        count_res = await self.db.execute(select(func.count(Staff.id)))
        total = count_res.scalar_one()

        query = select(Staff).order_by(Staff.id.desc()).offset(offset).limit(limit)
        res = await self.db.execute(query)
        return list(res.scalars().all()), total

    async def get_staff_by_id(self, staff_id: int) -> Optional[Staff]:
        result = await self.db.execute(select(Staff).where(Staff.id == staff_id))
        return result.scalars().first()

    async def create_staff(self, staff: Staff) -> Staff:
        self.db.add(staff)
        await self.db.flush()
        await self.db.refresh(staff)
        return staff
