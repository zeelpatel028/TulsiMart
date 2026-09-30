from typing import Optional, List, Tuple
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.store import StoreSetting, ActivityLog, CashRegisterEntry, BankTransaction, HomeCashTransaction


class StoreRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_settings(self) -> StoreSetting:
        setting = self.db.query(StoreSetting).filter(StoreSetting.id == 1).first()
        if not setting:
            setting = StoreSetting(id=1, store_name="Tulsi Mart")
            self.db.add(setting)
            self.db.commit()
            self.db.refresh(setting)
        return setting

    def update_settings(self, settings_obj: StoreSetting) -> StoreSetting:
        self.db.commit()
        self.db.refresh(settings_obj)
        return settings_obj

    def add_activity_log(self, log: ActivityLog) -> ActivityLog:
        self.db.add(log)
        self.db.commit()
        return log

    def list_activity_logs(self, page: int = 1, limit: int = 20) -> Tuple[List[ActivityLog], int]:
        offset = (page - 1) * limit
        total = self.db.query(func.count(ActivityLog.id)).scalar() or 0
        logs = (
            self.db.query(ActivityLog)
            .order_by(ActivityLog.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return logs, total

    def add_gulla_entry(self, entry: CashRegisterEntry) -> CashRegisterEntry:
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def list_gulla_entries(self, target_date: Optional[date] = None) -> List[CashRegisterEntry]:
        query = self.db.query(CashRegisterEntry)
        if target_date:
            query = query.filter(CashRegisterEntry.date == target_date)
        return query.order_by(CashRegisterEntry.created_at.desc()).all()

    def add_bank_transaction(self, tx: BankTransaction) -> BankTransaction:
        self.db.add(tx)
        self.db.commit()
        self.db.refresh(tx)
        return tx

    def list_bank_transactions(self, page: int = 1, limit: int = 20) -> Tuple[List[BankTransaction], int]:
        offset = (page - 1) * limit
        total = self.db.query(func.count(BankTransaction.id)).scalar() or 0
        txs = (
            self.db.query(BankTransaction)
            .order_by(BankTransaction.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return txs, total

    def add_home_cash(self, tx: HomeCashTransaction) -> HomeCashTransaction:
        self.db.add(tx)
        self.db.commit()
        self.db.refresh(tx)
        return tx

    def list_home_cash(self) -> List[HomeCashTransaction]:
        return self.db.query(HomeCashTransaction).order_by(HomeCashTransaction.created_at.desc()).all()
