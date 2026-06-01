from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id: int = Column(Integer, primary_key=True, index=True)
    name: str = Column(String(255), nullable=False)
    sku: str = Column(String(100), unique=True, nullable=False, index=True)
    price: float = Column(Float, nullable=False)
    quantity: int = Column(Integer, nullable=False, default=0)
    image_url: str | None = Column(String(500), nullable=True)
    created_at: datetime = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    order_items = relationship("OrderItem", back_populates="product")

    def __repr__(self) -> str:
        return f"<Product(id={self.id}, name='{self.name}', sku='{self.sku}')>"


class Customer(Base):
    __tablename__ = "customers"

    id: int = Column(Integer, primary_key=True, index=True)
    full_name: str = Column(String(255), nullable=False)
    email: str = Column(String(255), unique=True, nullable=False, index=True)
    phone: str | None = Column(String(50), nullable=True)
    created_at: datetime = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    orders = relationship("Order", back_populates="customer")

    def __repr__(self) -> str:
        return f"<Customer(id={self.id}, full_name='{self.full_name}', email='{self.email}')>"


class Order(Base):
    __tablename__ = "orders"

    id: int = Column(Integer, primary_key=True, index=True)
    customer_id: int = Column(Integer, ForeignKey("customers.id"), nullable=False)
    total_amount: float = Column(Float, nullable=False)
    created_at: datetime = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    customer = relationship("Customer", back_populates="orders")
    items = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Order(id={self.id}, customer_id={self.customer_id}, total={self.total_amount})>"


class OrderItem(Base):
    __tablename__ = "order_items"

    id: int = Column(Integer, primary_key=True, index=True)
    order_id: int = Column(
        Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    product_id: int = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity: int = Column(Integer, nullable=False)
    unit_price: float = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

    def __repr__(self) -> str:
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, product_id={self.product_id})>"
