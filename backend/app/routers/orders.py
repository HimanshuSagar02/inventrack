from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Customer, Order, OrderItem, Product
from app.schemas import OrderCreate, OrderResponse

router = APIRouter(prefix="/orders", tags=["Orders"])


def _load_order_with_relations(db: Session, order_id: int) -> Order | None:
    """Load an order with eagerly-loaded items, products, and customer."""
    return (
        db.query(Order)
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.customer),
        )
        .filter(Order.id == order_id)
        .first()
    )


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
) -> Order:
    """
    Create a new order.

    1. Validates customer exists.
    2. Validates each product exists and has sufficient stock.
    3. Reduces product quantities.
    4. Calculates total amount from unit prices at order time.
    5. Returns the full order with items and customer.
    """
    # 1. Validate customer
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id {payload.customer_id} not found.",
        )

    total_amount: float = 0.0
    order_items: list[OrderItem] = []

    for item in payload.items:
        # 2. Validate product
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {item.product_id} not found.",
            )

        # 3. Check stock
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product: {product.name}",
            )

        # 4. Reduce stock
        product.quantity -= item.quantity

        # 5. Build order item with price snapshot
        unit_price = product.price
        total_amount += item.quantity * unit_price

        order_items.append(
            OrderItem(
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=unit_price,
            )
        )

    # 6. Create order
    order = Order(
        customer_id=payload.customer_id,
        total_amount=total_amount,
        items=order_items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Reload with relationships
    loaded_order = _load_order_with_relations(db, order.id)
    return loaded_order  # type: ignore[return-value]


@router.get("", response_model=List[OrderResponse])
def list_orders(
    db: Session = Depends(get_db),
) -> list[Order]:
    """List all orders with items and customer information."""
    return (
        db.query(Order)
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.customer),
        )
        .order_by(Order.id)
        .all()
    )


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
) -> Order:
    """Get a single order with items and customer by ID."""
    order = _load_order_with_relations(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found.",
        )
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
) -> None:
    """
    Delete an order and restore product stock for each item.
    Cascade deletes the associated order items.
    """
    order = _load_order_with_relations(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found.",
        )

    # Restore stock for each item
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.quantity += item.quantity

    db.delete(order)
    db.commit()
