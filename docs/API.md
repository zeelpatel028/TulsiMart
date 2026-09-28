# Tulsi Mart REST API Documentation

## Base URL
- Local: `http://localhost:8000/api`
- Production: `https://your-domain.com/api`

## Endpoints Summary

### 1. Products & Inventory
- `GET /api/products/` - Get paginated product list (`?page=1&page_size=20&search=milk`)
- `GET /api/products/pos_search/` - Lightweight fast search for POS (`?q=...`)
- `POST /api/products/` - Add new product
- `GET /api/products/:id/` - Product details
- `PUT /api/products/:id/` - Update product
- `DELETE /api/products/:id/` - Delete product

### 2. POS & Orders
- `GET /api/orders/` - Paginated bill history (`?search=INV-001&from_date=...`)
- `POST /api/orders/` - Create new POS bill
- `GET /api/orders/:id/` - Order details & printable invoice

### 3. Collection & Cash Register (Gulla)
- `GET /api/gulla/today/` - Today's collection summary

### 4. Customers & Suppliers
- `GET /api/customers/` - Customer list & Khata balances
- `GET /api/suppliers/` - Supplier list & Purchase orders
