from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------

class ProductCreate(BaseModel):
    name: str
    sku: str
    price: float = Field(..., gt=0)
    quantity: int = Field(0, ge=0)


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)


class ProductResponse(BaseModel):
    id: int
    name: str
    sku: str
    price: float
    quantity: int
    image_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Customer
# ---------------------------------------------------------------------------

class CustomerCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None


class CustomerResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Order Item
# ---------------------------------------------------------------------------

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity: int
    unit_price: float
    product: ProductResponse

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Order
# ---------------------------------------------------------------------------

class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate] = Field(..., min_length=1)


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    total_amount: float
    created_at: datetime
    items: List[OrderItemResponse]
    customer: CustomerResponse

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

class DailyRevenue(BaseModel):
    date: str
    revenue: float
    orders: int


class TopProduct(BaseModel):
    name: str
    sku: str
    total_sold: int
    revenue: float


class InventoryStatus(BaseModel):
    name: str
    quantity: int


class AnalyticsResponse(BaseModel):
    daily_revenue: List[DailyRevenue]
    top_products: List[TopProduct]
    inventory_status: List[InventoryStatus]
    total_revenue: float
    revenue_this_month: float
    orders_this_month: int
