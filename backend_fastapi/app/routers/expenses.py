from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import LoginAccount
from app.services.expense_service import ExpenseService
from app.schemas.expense import ExpenseCategoryCreate, ExpenseCategoryResponse, ExpenseCreate, ExpenseResponse, ExpenseSummaryResponse
from app.utils.response import success_response
from app.utils.pagination import get_pagination_meta

router = APIRouter(tags=["Expenses"])

@router.get("/expenses/categories/")
def list_expense_categories(db: Session = Depends(get_db)):
    service = ExpenseService(db)
    cats = service.list_categories()
    data = [ExpenseCategoryResponse.model_validate(c).model_dump() for c in cats]
    return success_response(data=data, message="Expense categories fetched")


@router.post("/expenses/categories/")
def create_expense_category(
    data: ExpenseCategoryCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = ExpenseService(db)
    cat = service.create_category(data)
    return success_response(data=ExpenseCategoryResponse.model_validate(cat).model_dump(), message="Expense category created", status_code=201)


@router.get("/expenses/expenses/")
def list_expenses(
    category_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    if not category_id and category:
        try:
            category_id = int(category)
        except ValueError:
            pass

    service = ExpenseService(db)
    expenses, total = service.list_expenses(
        category_id=category_id,
        search=search,
        start_date=start_date,
        end_date=end_date,
        page=page,
        limit=limit
    )
    data = [ExpenseResponse.model_validate(e).model_dump() for e in expenses]
    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Expenses fetched")


@router.post("/expenses/expenses/")
def create_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = ExpenseService(db)
    expense = service.create_expense(data, user_id=current_user.id)
    return success_response(data=ExpenseResponse.model_validate(expense).model_dump(), message="Expense recorded", status_code=201)


@router.delete("/expenses/expenses/{expense_id}/")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = ExpenseService(db)
    service.delete_expense(expense_id)
    return success_response(data=None, message="Expense deleted")


@router.get("/expenses/expenses/summary/")
def get_expense_summary(db: Session = Depends(get_db)):
    service = ExpenseService(db)
    summary = service.get_summary()
    
    # Calculate today's and monthly expenses
    today = date.today()
    today_exp, _ = service.list_expenses(start_date=today, end_date=today, limit=1000)
    month_start = date(today.year, today.month, 1)
    month_exp, _ = service.list_expenses(start_date=month_start, limit=1000)
    
    summary["today_expenses"] = sum(e.amount for e in today_exp)
    summary["monthly_expenses"] = sum(e.amount for e in month_exp)
    
    return success_response(data=summary, message="Expense summary fetched")

