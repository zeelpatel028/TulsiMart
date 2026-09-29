from typing import List, Tuple, Optional
from datetime import date
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.expense_repository import ExpenseRepository
from app.models.expense import ExpenseCategory, Expense
from app.schemas.expense import ExpenseCreate, ExpenseCategoryCreate


class ExpenseService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ExpenseRepository(db)

    async def list_categories(self) -> List[ExpenseCategory]:
        return await self.repo.list_categories()

    async def create_category(self, data: ExpenseCategoryCreate) -> ExpenseCategory:
        cat = ExpenseCategory(name=data.name, icon=data.icon or "Receipt", color=data.color or "#384959")
        return await self.repo.create_category(cat)

    async def list_expenses(
        self,
        category_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Expense], int]:
        return await self.repo.list_expenses(
            category_id=category_id,
            start_date=start_date,
            end_date=end_date,
            page=page,
            limit=limit
        )

    async def create_expense(self, data: ExpenseCreate, user_id: Optional[int] = None) -> Expense:
        expense = Expense(
            title=data.title,
            category_id=data.category_id,
            amount=data.amount,
            date=data.date,
            payment_method=data.payment_method,
            paid_to=data.paid_to,
            receipt_url=data.receipt_url,
            notes=data.notes,
            created_by_id=user_id
        )
        return await self.repo.create_expense(expense)

    async def delete_expense(self, expense_id: int) -> None:
        expense = await self.repo.get_by_id(expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        await self.repo.delete_expense(expense)

    async def get_summary(self) -> dict:
        return await self.repo.get_expense_summary()
