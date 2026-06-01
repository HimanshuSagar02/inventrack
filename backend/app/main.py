import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load environment variables from .env before anything else
load_dotenv()

from app.database import Base, engine  # noqa: E402
from app.routers import analytics, customers, orders, products  # noqa: E402

UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables, run safe migrations, and create upload directory on startup."""
    Base.metadata.create_all(bind=engine)

    # Safe migration: add image_url column if it doesn't exist (idempotent)
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text(
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)"
        ))
        conn.commit()

    yield


app = FastAPI(
    title="Inventory & Order Management API",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

# CORS — allow everything for development / SPA consumption
# NOTE: allow_credentials must be False when allow_origins is ["*"]
# per the CORS specification. Browsers reject credentials + wildcard.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded product images as static files at /uploads/*
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Routers
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(analytics.router)


@app.get("/health", tags=["Health"])
def health_check() -> dict:
    """Health-check endpoint."""
    return {"status": "ok"}


@app.get("/", tags=["Root"])
def root() -> dict:
    """Root endpoint with basic API information."""
    return {
        "message": "Inventory & Order Management API",
        "docs": "/docs",
    }


# Catch-all fallback route for unhandled endpoints
@app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
def fallback_route(path_name: str):
    """Fallback route returning a clean JSON 404 response for unhandled API paths."""
    from fastapi import HTTPException
    raise HTTPException(
        status_code=404, 
        detail=f"API endpoint '/{path_name}' does not exist on this server"
    )
