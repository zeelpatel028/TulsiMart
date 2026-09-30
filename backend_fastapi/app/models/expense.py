from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import String, Text, Numeric, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ExpenseCategory(Base):
    __tablename__ = "expense_categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    icon: Mapped[Optional[str]] = mapped_column(String(50), default="Receipt")
    color: Mapped[Optional[str]] = mapped_column(String(20), default="#384959")

    expenses: Mapped[List["Expense"]] = relationship("Expense", back_populates="category", cascade="all, delete-orphan")


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("expense_categories.id", ondelete="RESTRICT"), index=True, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    date: Mapped[date] = mapped_column("expense_date", Date, default=date.today, index=True, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(20), default="UPI", nullable=False)
    paid_to: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    receipt_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("login.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now())

    category: Mapped["ExpenseCategory"] = relationship("ExpenseCategory", back_populates="expenses")
