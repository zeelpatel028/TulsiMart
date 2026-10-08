import os
import sys

# Ensure root directory is on sys.path so 'app' imports work from any working directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.config import settings
from app.core.logging_config import setup_logging, logger
from app.core.database import engine
from app.middleware.cors import setup_cors
from app.middleware.error_handler import setup_exception_handlers
from app.middleware.request_logging import RequestLoggingMiddleware

from app.core.init_db import init_db

# Import routers
from app.routers import (
    auth,
    products,
    orders,
    customers,
    suppliers,
    expenses,
    offers,
    analytics,
    admin,
    health
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    setup_logging()
    logger.info("Initializing Tulsi Mart FastAPI Backend...")

    # Safely attempt database table initialization & seeding
    init_db()

    yield

    # Shutdown tasks
    logger.info("Shutting down Tulsi Mart FastAPI Backend...")
    try:
        engine.dispose()
    except Exception:
        pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Setup Middlewares & Exceptions
setup_cors(app)
app.add_middleware(RequestLoggingMiddleware)
setup_exception_handlers(app)

# Include Routers under /api
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(products.router, prefix=api_prefix)
app.include_router(orders.router, prefix=api_prefix)
app.include_router(customers.router, prefix=api_prefix)
app.include_router(suppliers.router, prefix=api_prefix)
app.include_router(expenses.router, prefix=api_prefix)
app.include_router(offers.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(admin.router, prefix=api_prefix)
app.include_router(health.router, prefix=api_prefix)


@app.get("/health", tags=["Health Check"])
@app.get("/health/", tags=["Health Check"])
def root_health_check():
    """
    Root /health endpoint for external uptime monitors and Render health check.
    Returns status: ok
    """
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "success": True,
        "message": "Welcome to Tulsi Mart FastAPI Backend Service",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)


