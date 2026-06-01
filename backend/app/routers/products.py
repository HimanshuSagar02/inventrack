import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product
from app.schemas import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter(prefix="/products", tags=["Products"])

UPLOAD_DIR = "/app/uploads"


def _ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
) -> Product:
    """Create a new product. SKU must be unique."""
    product = Product(**payload.model_dump())
    db.add(product)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with SKU '{payload.sku}' already exists.",
        )
    return product


@router.get("", response_model=List[ProductResponse])
def list_products(
    search: Optional[str] = Query(None, description="Search by product name or SKU"),
    db: Session = Depends(get_db),
) -> list[Product]:
    """List all products with optional search by name or SKU."""
    query = db.query(Product)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            Product.name.ilike(pattern) | Product.sku.ilike(pattern)
        )
    return query.order_by(Product.id).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
) -> Product:
    """Get a single product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found.",
        )
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
) -> Product:
    """Update an existing product. Returns 404 if not found, 409 on SKU conflict."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with SKU '{payload.sku}' already exists.",
        )
    return product


@router.post("/{product_id}/upload-image", response_model=ProductResponse)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> Product:
    """Upload or replace a product image. Accepts JPEG, PNG, WebP, GIF."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found.",
        )

    # Validate MIME type
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' not supported. Use JPEG, PNG, WebP, or GIF.",
        )

    _ensure_upload_dir()

    # Delete old image if exists
    if product.image_url:
        old_filename = product.image_url.split("/uploads/")[-1]
        old_path = os.path.join(UPLOAD_DIR, old_filename)
        if os.path.exists(old_path):
            os.remove(old_path)

    # Generate unique filename preserving extension
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    product.image_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
) -> None:
    """Delete a product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found.",
        )
    # Delete associated image file if present
    if product.image_url:
        filename = product.image_url.split("/uploads/")[-1]
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
    db.delete(product)
    db.commit()
