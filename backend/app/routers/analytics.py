from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Order, OrderItem, Product
from app.schemas import AnalyticsResponse, DailyRevenue, InventoryStatus, TopProduct

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db)) -> AnalyticsResponse:
    """
    Return aggregated analytics data for dashboard charts:
    - Daily revenue & order counts for the last 30 days
    - Top 5 best-selling products by quantity
    - Inventory status for all products (name + quantity)
    - Total all-time revenue
    - Revenue and order count this calendar month
    """
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # ── Daily revenue for last 30 days ──
    daily_rows = (
        db.query(
            func.date(Order.created_at).label("date"),
            func.sum(Order.total_amount).label("revenue"),
            func.count(Order.id).label("orders"),
        )
        .filter(Order.created_at >= thirty_days_ago)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
        .all()
    )

    daily_revenue: List[DailyRevenue] = [
        DailyRevenue(
            date=str(row.date),
            revenue=round(float(row.revenue), 2),
            orders=int(row.orders),
        )
        for row in daily_rows
    ]

    # ── Top 5 products by units sold ──
    top_rows = (
        db.query(
            Product.name,
            Product.sku,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.quantity * OrderItem.unit_price).label("revenue"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .group_by(Product.id, Product.name, Product.sku)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    top_products: List[TopProduct] = [
        TopProduct(
            name=row.name,
            sku=row.sku,
            total_sold=int(row.total_sold),
            revenue=round(float(row.revenue), 2),
        )
        for row in top_rows
    ]

    # ── Inventory status (all products, sorted by quantity asc for alert visibility) ──
    inventory_rows = (
        db.query(Product.name, Product.quantity)
        .order_by(Product.quantity.asc())
        .limit(10)
        .all()
    )

    inventory_status: List[InventoryStatus] = [
        InventoryStatus(name=row.name, quantity=row.quantity)
        for row in inventory_rows
    ]

    # ── Totals ──
    total_revenue_row = db.query(func.sum(Order.total_amount)).scalar()
    total_revenue = round(float(total_revenue_row or 0), 2)

    month_row = (
        db.query(
            func.sum(Order.total_amount).label("revenue"),
            func.count(Order.id).label("orders"),
        )
        .filter(Order.created_at >= month_start)
        .first()
    )
    revenue_this_month = round(float(month_row.revenue or 0), 2)
    orders_this_month = int(month_row.orders or 0)

    return AnalyticsResponse(
        daily_revenue=daily_revenue,
        top_products=top_products,
        inventory_status=inventory_status,
        total_revenue=total_revenue,
        revenue_this_month=revenue_this_month,
        orders_this_month=orders_this_month,
    )
