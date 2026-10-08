from typing import Dict, Any, List, Optional
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, case, or_

from app.models.user import LoginAccount
from app.models.product import Product
from app.models.order import Order
from app.models.customer import Customer


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """
        Efficient aggregate query combining key metrics into minimal SQL calls
        """
        today_start = datetime.combine(date.today(), datetime.min.time())

        # 1. Total, Low Stock & Out of Stock Products
        prod_row = (
            self.db.query(
                func.count(Product.id).label("total_products"),
                func.coalesce(
                    func.sum(
                        case(
                            (Product.stock_quantity <= Product.min_stock_alert, 1),
                            else_=0
                        )
                    ),
                    0
                ).label("low_stock_products"),
                func.coalesce(
                    func.sum(
                        case(
                            (Product.stock_quantity <= 0, 1),
                            else_=0
                        )
                    ),
                    0
                ).label("out_of_stock_products")
            )
            .first()
        )
        total_products = int(prod_row[0]) if prod_row else 0
        low_stock_products = int(prod_row[1]) if prod_row else 0
        out_of_stock_products = int(prod_row[2]) if prod_row else 0

        # 2. Overall Orders & Revenue
        ord_row = (
            self.db.query(
                func.count(Order.id).label("total_orders"),
                func.coalesce(func.sum(Order.total_amount), 0).label("total_sales"),
                func.coalesce(
                    func.sum(
                        case(
                            (Order.status == "NEW", 1),
                            else_=0
                        )
                    ),
                    0
                ).label("pending_orders")
            )
            .first()
        )
        total_orders = int(ord_row[0]) if ord_row else 0
        total_sales = float(ord_row[1]) if ord_row else 0.0
        pending_orders = int(ord_row[2]) if ord_row else 0

        # 3. Today's Orders & Revenue
        today_row = (
            self.db.query(
                func.count(Order.id).label("today_orders"),
                func.coalesce(func.sum(Order.total_amount), 0).label("today_sales")
            )
            .filter(Order.created_at >= today_start)
            .first()
        )
        today_orders = today_row[0] if today_row else 0
        today_sales = float(today_row[1]) if today_row else 0.0

        # 4. Total Customers
        total_customers = self.db.query(func.count(Customer.id)).scalar() or 0

        # 5. Low stock items list
        low_stock_items_query = (
            self.db.query(Product)
            .filter(Product.stock_quantity <= Product.min_stock_alert)
            .limit(10)
            .all()
        )
        low_stock_items = [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "stock_quantity": p.stock_quantity,
                "min_stock_alert": p.min_stock_alert
            } for p in low_stock_items_query
        ]

        # 6. Recent Orders (Last 5)
        recent_orders_query = (
            self.db.query(Order)
            .order_by(Order.id.desc())
            .limit(5)
            .all()
        )
        recent_orders = [
            {
                "id": o.id,
                "order_number": o.order_number,
                "customer_name": o.customer_name,
                "total_amount": float(o.total_amount),
                "payment_method": getattr(o, "payment_method", "CASH") or "CASH",
                "payment_status": getattr(o, "payment_status", "PAID") or "PAID",
                "status": o.status,
                "created_at": o.created_at.isoformat() if o.created_at else None
            } for o in recent_orders_query
        ]

        # 7. Daily Trends (Last 7 days)
        daily_trends = self.get_sales_trends(7)

        kpis = {
            "today_sales": today_sales,
            "today_orders": today_orders,
            "total_orders": total_orders,
            "total_sales": total_sales,
            "low_stock_products": low_stock_products,
            "out_of_stock_products": out_of_stock_products,
            "total_products": total_products,
            "pending_orders": pending_orders,
            "total_customers": total_customers,
        }

        # 8. Category Breakdown from Database
        from app.models.product import Category
        cat_rows = (
            self.db.query(
                Category.name,
                func.count(Product.id).label("product_count")
            )
            .join(Product, Product.category_id == Category.id, isouter=True)
            .group_by(Category.name)
            .all()
        )
        category_breakdown = [
            {"name": row[0], "value": row[1]} for row in cat_rows if row[0]
        ]

        # 9. Top Products from Database
        top_prod_rows = (
            self.db.query(Product)
            .filter(Product.is_active == True)
            .order_by(Product.stock_quantity.desc())
            .limit(5)
            .all()
        )
        top_products = [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "price": float(p.selling_price),
                "stock": float(p.stock_quantity)
            } for p in top_prod_rows
        ]

        return {
            "kpis": kpis,
            "daily_trends": daily_trends,
            "category_breakdown": category_breakdown,
            "top_products": top_products,
            "low_stock_items": low_stock_items,
            "recent_orders": recent_orders,
            "total_products": total_products,
            "low_stock_products": low_stock_products,
            "total_orders": total_orders,
            "total_sales": total_sales,
            "pending_orders": pending_orders,
            "total_customers": total_customers
        }

    def get_sales_trends(self, days: Optional[int] = None, period: Optional[str] = "month") -> Dict[str, Any]:
        if days:
            num_days = days
        else:
            p = (period or "month").lower()
            if p == "day":
                num_days = 1
            elif p == "week":
                num_days = 7
            elif p == "year":
                num_days = 365
            else:
                num_days = 30

        start_date = datetime.now() - timedelta(days=num_days)

        # 1. Orders grouped by date
        orders_query = (
            self.db.query(
                func.date(Order.created_at).label("order_date"),
                func.count(Order.id).label("order_count"),
                func.coalesce(func.sum(Order.total_amount), 0).label("total_sales")
            )
            .filter(Order.created_at >= start_date)
            .group_by(func.date(Order.created_at))
            .order_by(func.date(Order.created_at).asc())
            .all()
        )

        # 2. Expenses grouped by date
        from app.models.expense import Expense
        expenses_query = (
            self.db.query(
                func.date(Expense.date).label("exp_date"),
                func.coalesce(func.sum(Expense.amount), 0).label("total_expense")
            )
            .filter(Expense.date >= start_date.date())
            .group_by(func.date(Expense.date))
            .all()
        )
        expense_map = {str(row[0]): float(row[1]) for row in expenses_query}

        comparison_data = []
        for row in orders_query:
            d_str = str(row[0])
            rev = float(row[2])
            exp = expense_map.get(d_str, 0.0)
            profit = max(0.0, rev - exp)
            margin = round((profit / rev * 100), 1) if rev > 0 else 0.0
            comparison_data.append({
                "label": d_str,
                "date": d_str,
                "revenue": rev,
                "expenses": exp,
                "profit": profit,
                "orders": int(row[1]),
                "margin_pct": margin
            })

        if not comparison_data:
            today_str = str(date.today())
            comparison_data.append({
                "label": today_str,
                "date": today_str,
                "revenue": 0.0,
                "expenses": 0.0,
                "profit": 0.0,
                "orders": 0,
                "margin_pct": 0.0
            })

        # 3. Payment methods breakdown
        pm_rows = (
            self.db.query(
                Order.payment_method,
                func.coalesce(func.sum(Order.total_amount), 0).label("total_amount"),
                func.count(Order.id).label("txn_count")
            )
            .filter(Order.created_at >= start_date)
            .group_by(Order.payment_method)
            .all()
        )
        payment_methods = [
            {
                "method": row[0] or "CASH",
                "amount": float(row[1]),
                "count": int(row[2])
            }
            for row in pm_rows
        ]
        if not payment_methods:
            payment_methods = [
                {"method": "CASH", "amount": 0.0, "count": 0},
                {"method": "UPI", "amount": 0.0, "count": 0},
                {"method": "CARD", "amount": 0.0, "count": 0}
            ]

        # 4. Category performance
        from app.models.product import Category, Product
        from app.models.order import OrderItem
        cat_rows = (
            self.db.query(
                Category.name,
                func.coalesce(func.sum(OrderItem.subtotal), 0).label("category_revenue")
            )
            .join(Product, Product.category_id == Category.id)
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(Order.created_at >= start_date)
            .group_by(Category.name)
            .all()
        )
        category_performance = [
            {"category": row[0], "revenue": float(row[1])} for row in cat_rows if row[0]
        ]
        if not category_performance:
            all_cats = self.db.query(Category.name).all()
            category_performance = [{"category": c[0], "revenue": 0.0} for c in all_cats if c[0]]

        return {
            "comparison_data": comparison_data,
            "monthly_comparison": comparison_data,
            "payment_methods": payment_methods,
            "category_performance": category_performance,
            "daily_trends": comparison_data
        }

    def get_reports(
        self,
        report_type: Optional[str] = "sales",
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        rtype = (report_type or "sales").lower()

        # 1. Sales Report
        if rtype == "sales":
            query = self.db.query(Order)
            if date_from:
                try:
                    query = query.filter(Order.created_at >= datetime.fromisoformat(date_from))
                except Exception:
                    pass
            if date_to:
                try:
                    query = query.filter(Order.created_at <= datetime.fromisoformat(date_to + "T23:59:59"))
                except Exception:
                    pass
            if search:
                pattern = f"%{search}%"
                query = query.filter(or_(Order.order_number.ilike(pattern), Order.customer_name.ilike(pattern)))

            orders = query.order_by(Order.created_at.desc()).all()
            data = [
                {
                    "order_number": o.order_number,
                    "date": o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else "",
                    "customer_name": o.customer_name or "Walk-in Customer",
                    "payment_method": o.payment_method or "CASH",
                    "status": o.status or "COMPLETED",
                    "total_amount": float(o.total_amount)
                }
                for o in orders
            ]
            total_rev = sum(d["total_amount"] for d in data)
            total_cnt = len(data)
            summary = {
                "total_revenue": round(total_rev, 2),
                "total_orders": total_cnt,
                "average_order_value": round(total_rev / total_cnt, 2) if total_cnt > 0 else 0.0
            }
            return {"summary": summary, "data": data}

        # 2. Bill GST Bill (Sales Bills GST)
        elif rtype in ["gst", "sales_gst", "bill_gst"]:
            query = self.db.query(Order)
            if date_from:
                try:
                    query = query.filter(Order.created_at >= datetime.fromisoformat(date_from))
                except Exception:
                    pass
            if date_to:
                try:
                    query = query.filter(Order.created_at <= datetime.fromisoformat(date_to + "T23:59:59"))
                except Exception:
                    pass
            if search:
                pattern = f"%{search}%"
                query = query.filter(or_(Order.invoice_number.ilike(pattern), Order.order_number.ilike(pattern), Order.customer_name.ilike(pattern)))

            orders = query.order_by(Order.created_at.desc()).all()
            data = [
                {
                    "bill_invoice_number": o.invoice_number or o.order_number,
                    "date": o.created_at.strftime("%Y-%m-%d") if o.created_at else "",
                    "customer_name": o.customer_name or "Walk-in Customer",
                    "payment_method": o.payment_method or "CASH",
                    "taxable_amount": float(o.subtotal),
                    "gst_tax_amount": float(o.tax_amount),
                    "total_amount": float(o.total_amount)
                }
                for o in orders
            ]
            taxable_tot = sum(d["taxable_amount"] for d in data)
            gst_tot = sum(d["gst_tax_amount"] for d in data)
            grand_tot = sum(d["total_amount"] for d in data)
            summary = {
                "total_bills": len(data),
                "taxable_subtotal": round(taxable_tot, 2),
                "output_gst_tax": round(gst_tot, 2),
                "total_billed_amount": round(grand_tot, 2)
            }
            return {"summary": summary, "data": data}

        # 3. Inventory Valuation
        elif rtype == "inventory":
            from app.models.product import Category
            query = self.db.query(Product).join(Category, Product.category_id == Category.id, isouter=True)
            if category:
                query = query.filter(Category.name.ilike(f"%{category}%"))
            if search:
                pattern = f"%{search}%"
                query = query.filter(or_(Product.name.ilike(pattern), Product.sku.ilike(pattern)))

            products = query.order_by(Product.name.asc()).all()
            data = [
                {
                    "sku": p.sku,
                    "product_name": p.name,
                    "category": p.category.name if p.category else "General",
                    "stock_quantity": float(p.stock_quantity),
                    "cost_price": float(p.cost_price),
                    "selling_price": float(p.selling_price),
                    "total_valuation": float(p.cost_price * p.stock_quantity)
                }
                for p in products
            ]
            tot_qty = sum(d["stock_quantity"] for d in data)
            tot_val = sum(d["total_valuation"] for d in data)
            summary = {
                "total_products": len(data),
                "total_stock_quantity": round(tot_qty, 2),
                "total_inventory_valuation": round(tot_val, 2)
            }
            return {"summary": summary, "data": data}

        # 4. Profit & Loss (P&L)
        elif rtype == "profit":
            from app.models.expense import Expense
            from app.models.supplier import PurchaseOrder
            sales_res = self.db.query(func.coalesce(func.sum(Order.total_amount), 0)).scalar() or 0.0
            expense_res = self.db.query(func.coalesce(func.sum(Expense.amount), 0)).scalar() or 0.0
            po_res = self.db.query(func.coalesce(func.sum(PurchaseOrder.total_amount), 0)).scalar() or 0.0

            total_revenue = float(sales_res)
            cogs = float(po_res) * 0.7 if po_res > 0 else total_revenue * 0.6
            expenses = float(expense_res)
            gross_profit = total_revenue - cogs
            net_profit = gross_profit - expenses

            trends = self.get_sales_trends(30)
            data = [
                {
                    "date": t["date"],
                    "sales_revenue": t["sales"],
                    "estimated_cogs": round(t["sales"] * 0.6, 2),
                    "estimated_expenses": round(t["sales"] * 0.15, 2),
                    "daily_net_profit": round(t["sales"] * 0.25, 2)
                }
                for t in trends
            ]
            summary = {
                "total_sales_revenue": round(total_revenue, 2),
                "total_cogs": round(cogs, 2),
                "operating_expenses": round(expenses, 2),
                "net_profit": round(net_profit, 2)
            }
            return {"summary": summary, "data": data}

        # 5. Operating Expenses
        elif rtype == "expense":
            from app.models.expense import Expense, ExpenseCategory
            query = self.db.query(Expense).join(ExpenseCategory, Expense.category_id == ExpenseCategory.id, isouter=True)
            if date_from:
                try:
                    query = query.filter(Expense.date >= datetime.fromisoformat(date_from).date())
                except Exception:
                    pass
            if date_to:
                try:
                    query = query.filter(Expense.date <= datetime.fromisoformat(date_to).date())
                except Exception:
                    pass
            if search:
                query = query.filter(Expense.title.ilike(f"%{search}%"))

            expenses = query.order_by(Expense.date.desc()).all()
            data = [
                {
                    "title": e.title,
                    "category": e.category.name if e.category else "General",
                    "expense_date": str(e.date) if e.date else "",
                    "payment_method": e.payment_method or "CASH",
                    "amount": float(e.amount)
                }
                for e in expenses
            ]
            tot_exp = sum(d["amount"] for d in data)
            summary = {
                "total_expense_amount": round(tot_exp, 2),
                "total_expense_entries": len(data)
            }
            return {"summary": summary, "data": data}

        # 6. Customer Growth
        elif rtype == "customer":
            query = self.db.query(Customer)
            if search:
                pattern = f"%{search}%"
                query = query.filter(or_(Customer.name.ilike(pattern), Customer.phone.ilike(pattern)))

            customers = query.order_by(Customer.created_at.desc()).all()
            data = [
                {
                    "customer_name": c.name,
                    "mobile": c.phone,
                    "city": c.city or "Mumbai",
                    "status": c.status or "ACTIVE",
                    "registered_on": c.created_at.strftime("%Y-%m-%d") if c.created_at else ""
                }
                for c in customers
            ]
            summary = {
                "total_registered_customers": len(data),
                "active_customers": len([c for c in data if c["status"] == "ACTIVE"])
            }
            return {"summary": summary, "data": data}

        # 7. Purchase Order GST Report
        elif rtype in ["purchase", "po_gst", "purchase_gst"]:
            from app.models.supplier import PurchaseOrder, Supplier
            query = self.db.query(PurchaseOrder).join(Supplier, PurchaseOrder.supplier_id == Supplier.id, isouter=True)
            if date_from:
                try:
                    query = query.filter(PurchaseOrder.created_at >= datetime.fromisoformat(date_from))
                except Exception:
                    pass
            if date_to:
                try:
                    query = query.filter(PurchaseOrder.created_at <= datetime.fromisoformat(date_to + "T23:59:59"))
                except Exception:
                    pass
            if search:
                pattern = f"%{search}%"
                query = query.filter(or_(PurchaseOrder.po_number.ilike(pattern), Supplier.name.ilike(pattern), Supplier.company_name.ilike(pattern)))

            pos = query.order_by(PurchaseOrder.created_at.desc()).all()
            data = []
            for po in pos:
                tot = float(po.total_amount or 0)
                taxable = round(tot / 1.18, 2)
                gst_amt = round(tot - taxable, 2)
                data.append({
                    "po_number": po.po_number,
                    "order_date": po.order_date.strftime("%Y-%m-%d") if po.order_date else (po.created_at.strftime("%Y-%m-%d") if po.created_at else ""),
                    "supplier_name": (po.supplier.company_name or po.supplier.name) if po.supplier else "N/A",
                    "supplier_gstin": po.supplier.gstin if po.supplier and po.supplier.gstin else "URP",
                    "gst_mode": po.gst_mode or "EXCLUSIVE",
                    "taxable_amount": taxable,
                    "gst_tax_amount": gst_amt,
                    "total_amount": tot,
                    "status": po.status
                })
            tot_taxable = sum(d["taxable_amount"] for d in data)
            tot_gst = sum(d["gst_tax_amount"] for d in data)
            tot_val = sum(d["total_amount"] for d in data)
            summary = {
                "total_purchase_orders": len(data),
                "taxable_subtotal": round(tot_taxable, 2),
                "input_gst_tax": round(tot_gst, 2),
                "total_purchase_value": round(tot_val, 2)
            }
            return {"summary": summary, "data": data}

        # Default fallback to Sales Report
        return self.get_reports(report_type="sales", date_from=date_from, date_to=date_to, category=category, search=search)

    def get_admin_dashboard_summary(self) -> Dict[str, Any]:
        """
        Returns super admin dashboard operational metrics:
        products, categories, low stock, out of stock, expiring soon, suppliers,
        purchase orders, inventory valuation, stock breakdown, and admin activity log.
        EXCLUDES all customer billing / user order data.
        """
        today_date = date.today()
        next_30_days = today_date + timedelta(days=30)

        # 1. Product & Inventory Aggregates
        prod_stats = (
            self.db.query(
                func.count(Product.id).label("total_products"),
                func.coalesce(
                    func.sum(
                        case(
                            (Product.stock_quantity <= Product.min_stock_alert, case((Product.stock_quantity > 0, 1), else_=0)),
                            else_=0
                        )
                    ),
                    0
                ).label("low_stock"),
                func.coalesce(
                    func.sum(
                        case(
                            (Product.stock_quantity <= 0, 1),
                            else_=0
                        )
                    ),
                    0
                ).label("out_of_stock"),
                func.coalesce(
                    func.sum(
                        case(
                            (Product.stock_quantity > Product.min_stock_alert, 1),
                            else_=0
                        )
                    ),
                    0
                ).label("in_stock"),
                func.coalesce(
                    func.sum(
                        case(
                            (Product.expiry_date != None, case((Product.expiry_date <= next_30_days, 1), else_=0)),
                            else_=0
                        )
                    ),
                    0
                ).label("expiring_soon"),
                func.coalesce(
                    func.sum(Product.cost_price * Product.stock_quantity),
                    0
                ).label("inventory_value")
            )
            .filter(Product.is_active == True)
            .first()
        )

        total_products = int(prod_stats[0]) if prod_stats and prod_stats[0] else 0
        low_stock_count = int(prod_stats[1]) if prod_stats and prod_stats[1] else 0
        out_of_stock_count = int(prod_stats[2]) if prod_stats and prod_stats[2] else 0
        in_stock_count = int(prod_stats[3]) if prod_stats and prod_stats[3] else 0
        expiring_soon_count = int(prod_stats[4]) if prod_stats and prod_stats[4] else 0
        inventory_value = float(prod_stats[5]) if prod_stats and prod_stats[5] else 0.0

        # 2. Categories Aggregates
        from app.models.product import Category
        categories_count = self.db.query(func.count(Category.id)).filter(Category.is_active == True).scalar() or 0

        cat_rows = (
            self.db.query(
                Category.id,
                Category.name,
                Category.icon,
                func.count(Product.id).label("product_count")
            )
            .join(Product, Product.category_id == Category.id, isouter=True)
            .filter(Category.is_active == True)
            .group_by(Category.id, Category.name, Category.icon)
            .all()
        )
        categories_summary = [
            {
                "id": row[0],
                "name": row[1],
                "icon": row[2] or "ShoppingBag",
                "product_count": int(row[3])
            }
            for row in cat_rows
        ]

        # 3. Supplier Aggregates
        from app.models.supplier import Supplier, PurchaseOrder
        total_suppliers = self.db.query(func.count(Supplier.id)).scalar() or 0
        active_suppliers = self.db.query(func.count(Supplier.id)).filter(Supplier.is_active == True).scalar() or 0
        pending_suppliers = max(0, total_suppliers - active_suppliers)

        supplier_rows = (
            self.db.query(
                Supplier.id,
                Supplier.name,
                Supplier.company_name,
                Supplier.is_active,
                func.count(func.distinct(Product.id)).label("products_count"),
                func.count(func.distinct(PurchaseOrder.id)).label("po_count")
            )
            .join(Product, Product.supplier_id == Supplier.id, isouter=True)
            .join(PurchaseOrder, PurchaseOrder.supplier_id == Supplier.id, isouter=True)
            .group_by(Supplier.id, Supplier.name, Supplier.company_name, Supplier.is_active)
            .limit(6)
            .all()
        )
        suppliers_summary = [
            {
                "id": row[0],
                "name": row[1],
                "company_name": row[2] or row[1],
                "status": "Active" if row[3] else "Pending",
                "products_count": int(row[4]),
                "po_count": int(row[5])
            }
            for row in supplier_rows
        ]

        # 4. Purchase Order Aggregates
        po_stats = (
            self.db.query(
                func.count(PurchaseOrder.id).label("total_pos"),
                func.coalesce(func.sum(case((PurchaseOrder.status.in_(["ORDERED", "PENDING", "NEW", "DRAFT"]), 1), else_=0)), 0).label("pending_pos"),
                func.coalesce(func.sum(case((PurchaseOrder.status.in_(["PROCESSING", "SHIPPED", "PARTIAL"]), 1), else_=0)), 0).label("processing_pos"),
                func.coalesce(func.sum(case((PurchaseOrder.status.in_(["RECEIVED", "DELIVERED", "COMPLETED"]), 1), else_=0)), 0).label("delivered_pos")
            )
            .first()
        )

        total_pos_count = int(po_stats[0]) if po_stats and po_stats[0] else 0
        pending_pos_count = int(po_stats[1]) if po_stats and po_stats[1] else 0
        processing_pos_count = int(po_stats[2]) if po_stats and po_stats[2] else 0
        delivered_pos_count = int(po_stats[3]) if po_stats and po_stats[3] else 0

        latest_pos_query = (
            self.db.query(PurchaseOrder)
            .join(Supplier, PurchaseOrder.supplier_id == Supplier.id, isouter=True)
            .order_by(PurchaseOrder.id.desc())
            .limit(6)
            .all()
        )
        latest_purchase_orders = [
            {
                "id": po.id,
                "po_number": po.po_number,
                "supplier_name": po.supplier.name if po.supplier else "N/A",
                "total_amount": float(po.total_amount or 0.0),
                "status": po.status,
                "order_date": str(po.order_date) if po.order_date else None,
                "created_at": po.created_at.isoformat() if po.created_at else None
            }
            for po in latest_pos_query
        ]

        # 5. Low Stock Products
        low_stock_query = (
            self.db.query(Product)
            .join(Category, Product.category_id == Category.id, isouter=True)
            .filter(Product.is_active == True, Product.stock_quantity <= Product.min_stock_alert)
            .order_by(Product.stock_quantity.asc())
            .limit(8)
            .all()
        )
        low_stock_products = [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "category_name": p.category.name if p.category else "General",
                "stock_quantity": float(p.stock_quantity),
                "min_stock_alert": float(p.min_stock_alert),
                "status": "Critical" if p.stock_quantity <= 3 else ("Out of Stock" if p.stock_quantity <= 0 else "Low Stock")
            }
            for p in low_stock_query
        ]

        # 6. Top Products
        top_products = []

        # 7. Recent Admin Activity
        activities = []
        recent_prods = self.db.query(Product).order_by(Product.created_at.desc()).limit(5).all()
        for p in recent_prods:
            if p.created_at:
                activities.append({
                    "id": f"prod-{p.id}",
                    "title": f'Product "{p.name}" added',
                    "type": "Product Added",
                    "timestamp": p.created_at.isoformat()
                })

        for po in latest_pos_query[:5]:
            if po.created_at:
                sup_name = po.supplier.name if po.supplier else ""
                activities.append({
                    "id": f"po-{po.id}",
                    "title": f'Purchase Order {po.po_number} created' + (f' ({sup_name})' if sup_name else ''),
                    "type": "Purchase Order Created",
                    "timestamp": po.created_at.isoformat()
                })

        recent_sups = self.db.query(Supplier).order_by(Supplier.created_at.desc()).limit(5).all()
        for s in recent_sups:
            if s.created_at:
                activities.append({
                    "id": f"sup-{s.id}",
                    "title": f'Supplier "{s.name}" added',
                    "type": "Supplier Added",
                    "timestamp": s.created_at.isoformat()
                })

        recent_cats = self.db.query(Category).order_by(Category.created_at.desc()).limit(5).all()
        for c in recent_cats:
            if c.created_at:
                activities.append({
                    "id": f"cat-{c.id}",
                    "title": f'Category "{c.name}" added',
                    "type": "Category Added",
                    "timestamp": c.created_at.isoformat()
                })

        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        recent_admin_activity = activities[:10]

        return {
            "products_count": total_products,
            "categories_count": categories_count,
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock_count,
            "expiring_soon_count": expiring_soon_count,
            "total_suppliers": total_suppliers,
            "active_suppliers": active_suppliers,
            "pending_suppliers": pending_suppliers,
            "total_pos_count": total_pos_count,
            "pending_pos_count": pending_pos_count,
            "processing_pos_count": processing_pos_count,
            "delivered_pos_count": delivered_pos_count,
            "inventory_value": inventory_value,
            "stock_overview": {
                "in_stock": in_stock_count,
                "low_stock": low_stock_count,
                "out_of_stock": out_of_stock_count
            },
            "low_stock_products": low_stock_products,
            "latest_purchase_orders": latest_purchase_orders,
            "suppliers_summary": suppliers_summary,
            "categories_summary": categories_summary,
            "top_products": top_products,
            "recent_admin_activity": recent_admin_activity
        }

