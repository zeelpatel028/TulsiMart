from typing import Optional, List, Tuple
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.store import StoreSetting, ActivityLog, CashRegisterEntry, BankTransaction, HomeCashTransaction


class StoreRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_settings(self) -> StoreSetting:
        res = await self.db.execute(select(StoreSetting).where(StoreSetting.id == 1))
        setting = res.scalars().first()
        if not setting:
            setting = StoreSetting(id=1, store_name="Tulsi Mart")
            self.db.add(setting)
            await self.db.flush()
            await self.db.refresh(setting)
        return setting

    async def update_settings(self, settings_obj: StoreSetting) -> StoreSetting:
        await self.db.flush()
        await self.db.refresh(settings_obj)
        return settings_obj

    async def add_activity_log(self, log: ActivityLog) -> ActivityLog:
        self.db.add(log)
        await self.db.flush()
        return log

    async def list_activity_logs(self, page: int = 1, limit: int = 20) -> Tuple[List[ActivityLog], int]:
        offset = (page - 1) * limit
        count_res = await self.db.execute(select(func.count(ActivityLog.id)))
        total = count_res.scalar_one()

        query = select(ActivityLog).order_by(ActivityLog.created_at.desc()).offset(offset).limit(limit)
        res = await self.db.execute(query)
        return list(res.scalars().all()), total

    async def add_gulla_entry(self, entry: CashRegisterEntry) -> CashRegisterEntry:
        self.db.add(entry)
        await self.db.flush()
        await self.db.refresh(entry)
        return entry

    async def list_gulla_entries(self, target_date: Optional[date] = None) -> List[CashRegisterEntry]:
        query = select(CashRegisterEntry)
        if target_date:
            query = query.where(CashRegisterEntry.date == target_date)
        query = query.order_by(CashRegisterEntry.created_at.desc())
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def add_bank_transaction(self, tx: BankTransaction) -> BankTransaction:
        self.db.add(tx)
        await self.db.flush()
        await self.db.refresh(tx)
        return tx

    async def list_bank_transactions(self, page: int = 1, limit: int = 20) -> Tuple[List[BankTransaction], int]:
        offset = (page - 1) * limit
        count_res = await self.db.execute(select(func.count(BankTransaction.id)))
        total = count_res.scalar_one()

        query = select(BankTransaction).order_by(BankTransaction.created_at.desc()).offset(offset).limit(limit)
        res = await self.db.execute(query)
        return list(res.scalars().all()), total

    async def add_home_cash(self, tx: HomeCashTransaction) -> HomeCashTransaction:
        self.db.add(tx)
        await self.db.flush()
        await self.db.refresh(tx)
        return tx

    async def list_home_cash(self) -> List[HomeCashTransaction]:
        query = select(HomeCashTransaction).order_by(HomeCashTransaction.created_at.desc())
        res = await self.db.execute(query)
        return list(res.scalars().all())
