from typing import List, Tuple, Optional
import time, random
from fastapi import HTTPException
from sqlalchemy.orm import Session

from datetime import date
from app.repositories.order_repository import OrderRepository
from app.repositories.product_repository import ProductRepository
from app.models.order import Order, OrderItem, PaymentTransaction
from app.models.product import StockMovement
from app.models.store import CashRegisterEntry, BankTransaction
from app.schemas.order import OrderCreate, OrderStatusUpdate


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = OrderRepository(db)
        self.product_repo = ProductRepository(db)

    def generate_order_number(self) -> str:
        timestamp = int(time.time() * 1000)
        rnd = random.randint(100, 999)
        return f"ORD-{timestamp}-{rnd}"

    def generate_invoice_number(self) -> str:
        timestamp = int(time.time())
        return f"INV-{timestamp}"

    def create_order(self, data: OrderCreate, created_by_id: Optional[int] = None) -> Order:
        if not data.items:
            raise HTTPException(status_code=400, detail="Order must contain at least one item")

        order_number = self.generate_order_number()
        invoice_number = self.generate_invoice_number()

        # Step 1: Create Order instance
        order = Order(
            order_number=order_number,
            invoice_number=invoice_number,
            customer_id=data.customer_id,
            customer_name=data.customer_name,
            customer_phone=data.customer_phone,
            customer_address=data.customer_address,
            status=data.status or "NEW",
            payment_method=data.payment_method or "CASH",
            payment_status=data.payment_status or "PAID",
            subtotal=data.subtotal,
            tax_amount=data.tax_amount,
            discount_amount=data.discount_amount,
            delivery_charge=data.delivery_charge,
            total_amount=data.total_amount,
            cash_tendered=data.cash_tendered,
            change_returned=data.change_returned,
            tendered_notes=data.tendered_notes,
            change_notes=data.change_notes,
            coupon_applied=data.coupon_code,
            notes=data.notes,
            created_by_id=created_by_id
        )

        # Step 2: Validate and update stock for each item using FOR UPDATE row locks (Concurrency safety)
        order_items = []
        for item_data in data.items:
            product = None
            if item_data.product_id:
                product = self.repo.get_product_for_update(item_data.product_id)

            if product:
                current_stock = float(product.stock_quantity)
                req_qty = float(item_data.quantity)
                if current_stock < req_qty:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient stock for '{product.name}'. Available: {current_stock}, Requested: {req_qty}"
                    )
                # Deduct stock
                product.stock_quantity = current_stock - req_qty
                
                # Log stock movement
                movement = StockMovement(
                    product_id=product.id,
                    movement_type="POS_SALE",
                    quantity=-abs(req_qty),
                    balance_after=product.stock_quantity,
                    reason=f"Order #{order_number}",
                    reference_no=order_number,
                    performed_by_id=created_by_id
                )
                self.db.add(movement)

            order_item = OrderItem(
                product_id=item_data.product_id,
                product_name=item_data.product_name,
                sku=item_data.sku,
                unit_price=item_data.unit_price,
                quantity=item_data.quantity,
                gst_percent=item_data.gst_percent,
                subtotal=item_data.subtotal
            )
            order_items.append(order_item)

        order.items = order_items

        # Step 3: Record payment transaction & live register log
        if data.payment_status == "PAID" or data.total_amount > 0:
            transaction = PaymentTransaction(
                transaction_id=f"TXN-{order_number}",
                amount=data.total_amount,
                payment_method=data.payment_method,
                status="PAID" if data.payment_status == "PAID" else "PENDING",
                notes=f"Payment for Order #{order_number}"
            )
            order.transactions = [transaction]

            # Log to Gulla / CashRegisterEntry if CASH
            if data.payment_method == "CASH":
                cash_entry = CashRegisterEntry(
                    entry_type="BILL_SALE",
                    amount=data.total_amount,
                    date=date.today(),
                    notes=f"Counter Bill #{invoice_number} - {data.customer_name or 'Walk-in Customer'}",
                    denomination_counts=data.tendered_notes,
                    reference_id=invoice_number,
                    created_by_name=data.customer_name or "POS Cashier"
                )
                self.db.add(cash_entry)

            # Log to BankTransaction if UPI or CARD
            elif data.payment_method in ["UPI", "CARD"]:
                bank_tx = BankTransaction(
                    transaction_type="UPI_IN" if data.payment_method == "UPI" else "CARD_IN",
                    amount=data.total_amount,
                    reference_number=invoice_number,
                    notes=f"POS Digital Sale ({data.payment_method}) - Invoice #{invoice_number}",
                    date=date.today(),
                    created_by_name=data.customer_name or "POS Cashier"
                )
                self.db.add(bank_tx)

        created_order = self.repo.create_order(order)
        return self.get_order(created_order.id)

    def get_order(self, order_id: int) -> Order:
        order = self.repo.get_by_id(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order

    def list_orders(
        self,
        customer_id: Optional[int] = None,
        status: Optional[str] = None,
        payment_status: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Order], int]:
        return self.repo.list_orders(
            customer_id=customer_id,
            status=status,
            payment_status=payment_status,
            search=search,
            date_from=date_from,
            date_to=date_to,
            page=page,
            limit=limit
        )

    def update_status(self, order_id: int, status_str: Optional[str] = None, payment_status_str: Optional[str] = None) -> Order:
        order = self.get_order(order_id)
        if status_str:
            order.status = status_str
        if payment_status_str:
            order.payment_status = payment_status_str
        self.db.flush()
        return self.get_order(order_id)

    def toggle_payment_status(self, order_id: int, payment_status: str) -> Order:
        order = self.get_order(order_id)
        order.payment_status = payment_status
        self.db.flush()
        return self.get_order(order_id)

    def delete_order(self, order_id: int) -> bool:
        deleted = self.repo.delete_order(order_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Order not found")
        return True

    def list_payments(self, page: int = 1, limit: int = 20) -> Tuple[List[PaymentTransaction], int]:
        return self.repo.list_payments(page=page, limit=limit)
