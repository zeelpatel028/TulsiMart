from typing import Optional, List, Tuple
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import joinedload

from app.models.expense import ExpenseCategory, Expense


class ExpenseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_categories(self) -> List[ExpenseCategory]:
        res = await self.db.execute(select(ExpenseCategory).order_by(ExpenseCategory.name.asc()))
        return list(res.scalars().all())

    async def create_category(self, category: ExpenseCategory) -> ExpenseCategory:
        self.db.add(category)
        await self.db.flush()
        await self.db.refresh(category)
        return category

    async def list_expenses(
        self,
        category_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Expense], int]:
        offset = (page - 1) * limit
        query = select(Expense).options(joinedload(Expense.category))
        count_query = select(func.count(Expense.id))

        filters = []
        if category_id:
            filters.append(Expense.category_id == category_id)
        if start_date:
            filters.append(Expense.date >= start_date)
        if end_date:
            filters.append(Expense.date <= end_date)

        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        count_res = await self.db.execute(count_query)
        total = count_res.scalar_one()

        query = query.order_by(Expense.date.desc(), Expense.id.desc()).offset(offset).limit(limit)
        res = await self.db.execute(query)
        return list(res.scalars().all()), total

    async def create_expense(self, expense: Expense) -> Expense:
        self.db.add(expense)
        await self.db.flush()
        await self.db.refresh(expense)
        return expense

    async def get_by_id(self, expense_id: int) -> Optional[Expense]:
        res = await self.db.execute(select(Expense).where(Expense.id == expense_id))
        return res.scalars().first()

    async def delete_expense(self, expense: Expense) -> None:
        await self.db.delete(expense)
        await self.db.flush()

    async def get_expense_summary(self) -> dict:
        total_res = await self.db.execute(select(func.coalesce(func.sum(Expense.amount), 0)))
        total_expenses = float(total_res.scalar_one())

        cat_query = select(
            ExpenseCategory.name,
            func.coalesce(func.sum(Expense.amount), 0).label("amount")
        ).join(Expense, Expense.category_id == ExpenseCategory.id).group_by(ExpenseCategory.name)
        cat_res = await self.db.execute(cat_query)
        category_breakdown = [{"category": row[0], "amount": float(row[1])} for row in cat_res.all()]

        pay_query = select(
            Expense.payment_method,
            func.coalesce(func.sum(Expense.amount), 0).label("amount")
        ).group_by(Expense.payment_method)
        pay_res = await self.db.execute(pay_query)
        payment_method_breakdown = [{"method": row[0], "amount": float(row[1])} for row in pay_res.all()]

        return {
            "total_expenses": total_expenses,
            "category_breakdown": category_breakdown,
            "payment_method_breakdown": payment_method_breakdown
        }
