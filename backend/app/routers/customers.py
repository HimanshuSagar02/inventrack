from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Customer
from app.schemas import CustomerCreate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
) -> Customer:
    """Create a new customer. Email must be unique."""
    customer = Customer(**payload.model_dump())
    db.add(customer)
    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Customer with email '{payload.email}' already exists.",
        )
    return customer


@router.get("", response_model=List[CustomerResponse])
def list_customers(
    db: Session = Depends(get_db),
) -> list[Customer]:
    """List all customers."""
    return db.query(Customer).order_by(Customer.id).all()


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
) -> Customer:
    """Get a single customer by ID."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id {customer_id} not found.",
        )
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
) -> None:
    """Delete a customer by ID."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id {customer_id} not found.",
        )
    db.delete(customer)
    db.commit()
