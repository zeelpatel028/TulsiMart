from typing import Optional, List, Tuple
from datetime import date
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_

from app.models.expense import ExpenseCategory, Expense


class ExpenseRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_categories(self) -> List[ExpenseCategory]:
        return self.db.query(ExpenseCategory).order_by(ExpenseCategory.name.asc()).all()

    def create_category(self, category: ExpenseCategory) -> ExpenseCategory:
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def list_expenses(
        self,
        category_id: Optional[int] = None,
        search: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[Expense], int]:
        offset = (page - 1) * limit
        query = self.db.query(Expense).options(joinedload(Expense.category))
        count_query = self.db.query(func.count(Expense.id))

        filters = []
        if category_id:
            filters.append(Expense.category_id == category_id)
        if search:
            pattern = f"%{search}%"
            filters.append(or_(Expense.title.ilike(pattern), Expense.paid_to.ilike(pattern), Expense.notes.ilike(pattern)))
        if start_date:
            filters.append(Expense.date >= start_date)
        if end_date:
            filters.append(Expense.date <= end_date)

        if filters:
            query = query.filter(and_(*filters))
            count_query = count_query.filter(and_(*filters))

        total = count_query.scalar() or 0
        expenses = query.order_by(Expense.date.desc(), Expense.id.desc()).offset(offset).limit(limit).all()
        return expenses, total

    def create_expense(self, expense: Expense) -> Expense:
        self.db.add(expense)
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def get_by_id(self, expense_id: int) -> Optional[Expense]:
        return self.db.query(Expense).filter(Expense.id == expense_id).first()

    def delete_expense(self, expense: Expense) -> None:
        self.db.delete(expense)
        self.db.commit()

    def get_expense_summary(self) -> dict:
        total_expenses = float(self.db.query(func.coalesce(func.sum(Expense.amount), 0)).scalar() or 0)

        cat_rows = (
            self.db.query(
                ExpenseCategory.name,
                func.coalesce(func.sum(Expense.amount), 0).label("amount")
            )
            .join(Expense, Expense.category_id == ExpenseCategory.id)
            .group_by(ExpenseCategory.name)
            .all()
        )
        category_breakdown = [{"category": row[0], "amount": float(row[1])} for row in cat_rows]

        pay_rows = (
            self.db.query(
                Expense.payment_method,
                func.coalesce(func.sum(Expense.amount), 0).label("amount")
            )
            .group_by(Expense.payment_method)
            .all()
        )
        payment_method_breakdown = [{"method": row[0], "amount": float(row[1])} for row in pay_rows]

        return {
            "total_expenses": total_expenses,
            "category_breakdown": category_breakdown,
            "payment_method_breakdown": payment_method_breakdown
        }
