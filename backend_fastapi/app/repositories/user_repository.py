from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import LoginAccount
from app.models.staff import Staff


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_username(self, username: str) -> Optional[LoginAccount]:
        return self.db.query(LoginAccount).filter(LoginAccount.username == username).first()

    def get_by_id(self, user_id: int) -> Optional[LoginAccount]:
        return self.db.query(LoginAccount).filter(LoginAccount.id == user_id).first()

    def list_accounts(self, page: int = 1, limit: int = 20) -> Tuple[List[LoginAccount], int]:
        offset = (page - 1) * limit
        total = self.db.query(func.count(LoginAccount.id)).scalar() or 0
        accounts = (
            self.db.query(LoginAccount)
            .order_by(LoginAccount.id.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return accounts, total

    def create_account(self, account: LoginAccount) -> LoginAccount:
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return account

    def list_staff(self, page: int = 1, limit: int = 20) -> Tuple[List[Staff], int]:
        offset = (page - 1) * limit
        total = self.db.query(func.count(Staff.id)).scalar() or 0
        staff_list = (
            self.db.query(Staff)
            .order_by(Staff.id.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return staff_list, total

    def get_staff_by_id(self, staff_id: int) -> Optional[Staff]:
        return self.db.query(Staff).filter(Staff.id == staff_id).first()

    def create_staff(self, staff: Staff) -> Staff:
        self.db.add(staff)
        self.db.commit()
        self.db.refresh(staff)
        return staff
