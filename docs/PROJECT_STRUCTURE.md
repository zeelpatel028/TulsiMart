# Tulsi Mart Architecture & Project Structure

## Architecture Overview
- **Frontend**: React.js + Vite with modular pages, lazy routing, services, custom hooks, and centralized sidebar menu configuration.
- **Backend**: Django + Django REST Framework with modular domain apps (`core`, `inventory`, `orders`, `customers`, `suppliers`, `expenses`, `offers`).
- **Database**: PostgreSQL / MySQL / SQLite with complete indexing on `product_code`, `product_name`, `category_id`, `customer_id`, `supplier_id`, `invoice_number`, `order_number`, `created_at`, `payment_status`.

## Directory Blueprint
```
tulsi-mart/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/ (common, layout, forms, tables, modals, loading)
│   │   ├── pages/ (POS, Dashboard, Collection, Bills, Products, Inventory, Customers, Suppliers, Offers, Expenses, Sales, Reports, Staff, Settings)
│   │   ├── services/ (api, authApi, productApi, inventoryApi, customerApi, supplierApi, billApi, salesApi, expenseApi, reportApi)
│   │   ├── hooks/ (useProducts, useCustomers, useInventory, useBills)
│   │   ├── utils/ (formatCurrency, formatDate, validators)
│   │   ├── routes/ (AppRoutes.jsx)
│   │   └── App.jsx
├── backend/
│   ├── manage.py
│   ├── common/ (pagination, permissions, exceptions, responses)
│   ├── core/, inventory/, orders/, customers/, suppliers/, expenses/, offers/
database/
docs/
```
