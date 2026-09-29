from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ExpenseCategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = "Receipt"
    color: Optional[str] = "#384959"


class ExpenseCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    icon: Optional[str] = "Receipt"
    color: Optional[str] = "#384959"


class ExpenseCreate(BaseModel):
    title: str
    category_id: int
    amount: float
    date: date
    payment_method: str = "UPI"
    paid_to: Optional[str] = None
    receipt_url: Optional[str] = None
    notes: Optional[str] = None


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    category_id: int
    amount: float
    date: date
    payment_method: str
    paid_to: Optional[str] = None
    receipt_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    category: Optional[ExpenseCategoryResponse] = None


class ExpenseSummaryResponse(BaseModel):
    total_expenses: float = 0.0
    category_breakdown: List[dict] = []
    payment_method_breakdown: List[dict] = []
