# Tulsi Mart - Modern FastAPI Backend

High-performance, async FastAPI backend replacing the legacy Django REST Framework backend for **Tulsi Mart**. Built with Python 3.13, Async SQLAlchemy 2.x, PostgreSQL (asyncpg), Pydantic v2, and JWT authentication.

---

## 🚀 Key Features & Architectural Improvements

- **Fully Asynchronous**: Async endpoints with `AsyncEngine` & `async_sessionmaker` via `asyncpg`.
- **N+1 Query Prevention**: Explicit eager loading using `selectinload` and `joinedload`.
- **Database Concurrency & Row Locking**: Row locking (`with_for_update()`) on stock deduction to eliminate race conditions.
- **Frontend Compatibility**: 100% compatible with existing React + Vite frontend REST API endpoints.
- **Consistent Response Schema**: Uniform JSON response structure `{ "success": true, "message": "...", "data": ..., "pagination": ... }`.
- **Sidebar-Based Modular Architecture**: Routers organized per module (Auth, Products, Orders, Customers, Suppliers, Expenses, Offers, Analytics, Admin).
- **Structured Error Handling & Middleware**: Centralized error responses, response-time tracking (`X-Process-Time` header), and CORS configuration.

---

## 📁 Directory Structure

```
backend_fastapi/
│
├── venv/                      # Python virtual environment
├── .env                       # Environment variables
├── .env.example               # Template environment variables
├── .gitignore
├── requirements.txt
├── pytest.ini
├── README.md
│
├── app/
│   ├── main.py                # FastAPI entry point
│   │
│   ├── core/                  # Configuration, database setup & security
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   ├── dependencies.py
│   │   └── logging_config.py
│   │
│   ├── models/                # Async SQLAlchemy 2.x ORM models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── staff.py
│   │   ├── store.py
│   │   ├── product.py
│   │   ├── customer.py
│   │   ├── order.py
│   │   ├── supplier.py
│   │   ├── expense.py
│   │   └── offer.py
│   │
│   ├── schemas/               # Pydantic v2 validation schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── customer.py
│   │   ├── order.py
│   │   ├── supplier.py
│   │   ├── expense.py
│   │   ├── offer.py
│   │   └── store.py
│   │
│   ├── repositories/          # Database query abstraction layer
│   │   ├── user_repository.py
│   │   ├── product_repository.py
│   │   ├── order_repository.py
│   │   ├── customer_repository.py
│   │   ├── supplier_repository.py
│   │   ├── expense_repository.py
│   │   ├── offer_repository.py
│   │   └── store_repository.py
│   │
│   ├── services/              # Core business logic layer
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── product_service.py
│   │   ├── order_service.py
│   │   ├── customer_service.py
│   │   ├── supplier_service.py
│   │   ├── expense_service.py
│   │   ├── offer_service.py
│   │   └── analytics_service.py
│   │
│   ├── utils/                 # Pagination, Response format & Validators
│   │   ├── pagination.py
│   │   ├── response.py
│   │   └── validators.py
│   │
│   └── middleware/            # CORS, Error handling & Request Logging
│       ├── cors.py
│       ├── error_handler.py
│       └── request_logging.py
│
├── routers/                   # Module APIRouters
│   ├── auth.py
│   ├── products.py
│   ├── orders.py
│   ├── customers.py
│   ├── suppliers.py
│   ├── expenses.py
│   ├── offers.py
│   ├── analytics.py
│   ├── admin.py
│   └── health.py
│
├── alembic/                   # Database migrations
│   ├── versions/
│   └── env.py
│
└── tests/                     # Pytest test suite
    ├── conftest.py
    ├── test_auth.py
    ├── test_products.py
    ├── test_cart.py
    ├── test_orders.py
    └── test_users.py
```

---

## ⚙️ Quick Start Setup

### 1. Virtual Environment & Dependencies

Activate virtual environment:
```powershell
# Windows PowerShell
.\venv\Scripts\activate
```

Install packages:
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create `.env` file from `.env.example`:
```ini
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/tulsimart
JWT_SECRET_KEY=tulsimart_super_secret_jwt_key_2026
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
FRONTEND_URL=http://localhost:5173,http://127.0.0.1:5173
```

### 3. Database Migration & Initialization

Run Alembic migrations:
```bash
alembic upgrade head
```

### 4. Running Local Development Server

Start uvicorn server:
```bash
uvicorn app.main:app --reload --port 8000
```

Access Interactive API Documentation:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

---

## 🧪 Running Automated Tests

Run test suite:
```bash
python -m pytest tests
```

---

## 🔐 Role-Based Access Control

Available roles:
- `ADMIN`: Full access to settings, staff, accounts, financial reports.
- `STORE_MANAGER`: Inventory management, order processing, purchase orders.
- `CASHIER`: POS billing, customer creation, order viewing.

---

## ⚡ Production Deployment Guidelines

For production deployment:
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
