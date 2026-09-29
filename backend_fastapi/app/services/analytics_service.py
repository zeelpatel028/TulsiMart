from typing import Dict, Any, List
from datetime import date, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, case, Integer
from sqlalchemy.orm import selectinload

from app.models.user import LoginAccount
from app.models.product import Product
from app.models.order import Order
from app.models.customer import Customer


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_summary(self) -> Dict[str, Any]:
        """
        Efficient aggregate query combining key metrics into minimal SQL calls
        """
        today_start = datetime.combine(date.today(), datetime.min.time())

        # 1. Total, Low Stock & Out of Stock Products
        product_stats = await self.db.execute(
            select(
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
        )
        prod_row = product_stats.first()
        total_products = int(prod_row[0]) if prod_row else 0
        low_stock_products = int(prod_row[1]) if prod_row else 0
        out_of_stock_products = int(prod_row[2]) if prod_row else 0

        # 2. Overall Orders & Revenue
        order_stats = await self.db.execute(
            select(
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
        )
        ord_row = order_stats.first()
        total_orders = int(ord_row[0]) if ord_row else 0
        total_sales = float(ord_row[1]) if ord_row else 0.0
        pending_orders = int(ord_row[2]) if ord_row else 0

        # 3. Today's Orders & Revenue
        today_order_stats = await self.db.execute(
            select(
                func.count(Order.id).label("today_orders"),
                func.coalesce(func.sum(Order.total_amount), 0).label("today_sales")
            ).where(Order.created_at >= today_start)
        )
        today_row = today_order_stats.first()
        today_orders = today_row[0] if today_row else 0
        today_sales = float(today_row[1]) if today_row else 0.0

        # 4. Total Customers
        cust_res = await self.db.execute(select(func.count(Customer.id)))
        total_customers = cust_res.scalar_one_or_none() or 0

        # 5. Low stock items list
        low_stock_res = await self.db.execute(
            select(Product)
            .where(Product.stock_quantity <= Product.min_stock_alert)
            .limit(10)
        )
        low_stock_items = [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "stock_quantity": p.stock_quantity,
                "min_stock_alert": p.min_stock_alert
            } for p in low_stock_res.scalars().all()
        ]

        # 6. Recent Orders (Last 5)
        recent_orders_res = await self.db.execute(
            select(Order)
            .order_by(Order.id.desc())
            .limit(5)
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
            } for o in recent_orders_res.scalars().all()
        ]

        # 7. Daily Trends (Last 7 days)
        daily_trends = await self.get_sales_trends(7)

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

        return {
            "kpis": kpis,
            "daily_trends": daily_trends,
            "category_breakdown": [],
            "top_products": [],
            "low_stock_items": low_stock_items,
            "recent_orders": recent_orders,
            # Top-level backward compatibility keys
            "total_products": total_products,
            "low_stock_products": low_stock_products,
            "total_orders": total_orders,
            "total_sales": total_sales,
            "pending_orders": pending_orders,
            "total_customers": total_customers
        }


    async def get_sales_trends(self, days: int = 7) -> List[Dict[str, Any]]:
        start_date = datetime.now() - timedelta(days=days)
        query = select(
            func.date(Order.created_at).label("order_date"),
            func.count(Order.id).label("order_count"),
            func.coalesce(func.sum(Order.total_amount), 0).label("total_sales")
        ).where(Order.created_at >= start_date).group_by(func.date(Order.created_at)).order_by(func.date(Order.created_at).asc())

        res = await self.db.execute(query)
        return [
            {
                "date": str(row[0]),
                "orders": row[1],
                "sales": float(row[2])
            } for row in res.all()
        ]

    async def get_reports(self) -> Dict[str, Any]:
        return {
            "summary": await self.get_dashboard_summary(),
            "trends": await self.get_sales_trends(30)
        }
