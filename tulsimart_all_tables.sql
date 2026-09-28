-- ============================================================
-- TULSI MART - CLEAN DATABASE STRUCTURE
-- PostgreSQL
-- ============================================================

-- ============================================================
-- 1. STORE & STAFF
-- ============================================================

CREATE TABLE store_settings (
    id BIGSERIAL PRIMARY KEY,
    store_name VARCHAR(200) NOT NULL,
    tagline VARCHAR(300),
    store_logo VARCHAR(500),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(20),
    phone VARCHAR(30),
    email VARCHAR(254),
    gst_number VARCHAR(50),
    pan_number VARCHAR(50),
    invoice_prefix VARCHAR(30) DEFAULT 'INV',
    invoice_terms TEXT,
    show_logo_on_invoice BOOLEAN DEFAULT TRUE,
    auto_print_invoice BOOLEAN DEFAULT FALSE,
    tax_enabled BOOLEAN DEFAULT TRUE,
    default_gst_rate NUMERIC(10,2) DEFAULT 0,
    prices_include_tax BOOLEAN DEFAULT FALSE,
    currency_symbol VARCHAR(10) DEFAULT '₹',
    currency_code VARCHAR(10) DEFAULT 'INR',
    payment_cash_enabled BOOLEAN DEFAULT TRUE,
    payment_upi_enabled BOOLEAN DEFAULT TRUE,
    payment_card_enabled BOOLEAN DEFAULT TRUE,
    bank_name VARCHAR(150),
    account_number VARCHAR(100),
    ifsc_code VARCHAR(50),
    upi_id VARCHAR(100),
    theme_mode VARCHAR(20) DEFAULT 'light',
    primary_color VARCHAR(30),
    security_require_otp BOOLEAN DEFAULT FALSE,
    security_session_timeout INTEGER DEFAULT 30,
    home_cash_amount NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE staff (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES auth_user(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(254),
    role VARCHAR(50) NOT NULL,
    salary NUMERIC(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. CASH & BANK
-- ============================================================

CREATE TABLE bank_transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_type VARCHAR(30) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    reference_number VARCHAR(100),
    bank_name VARCHAR(100),
    notes TEXT,
    transaction_date DATE NOT NULL,
    created_by_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE cash_transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_type VARCHAR(30) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    transaction_date DATE NOT NULL,
    created_by_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 3. PRODUCT MASTER
-- ============================================================

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) UNIQUE,
    icon VARCHAR(100),
    image VARCHAR(500),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE brands (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE units (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    short_name VARCHAR(20) NOT NULL UNIQUE
);


CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,

    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    brand_id BIGINT REFERENCES brands(id) ON DELETE SET NULL,
    unit_id BIGINT REFERENCES units(id) ON DELETE SET NULL,

    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    mrp NUMERIC(12,2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,

    discount_percent NUMERIC(5,2) DEFAULT 0,
    gst_percent NUMERIC(5,2) DEFAULT 0,

    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_alert INTEGER NOT NULL DEFAULT 5,

    expiry_date DATE,
    batch_number VARCHAR(100),

    image VARCHAR(500),
    description TEXT,

    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE stock_movements (
    id BIGSERIAL PRIMARY KEY,

    product_id BIGINT NOT NULL
        REFERENCES products(id) ON DELETE CASCADE,

    movement_type VARCHAR(30) NOT NULL,

    quantity INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,

    reason VARCHAR(255),
    reference_no VARCHAR(100),

    performed_by_id INTEGER
        REFERENCES auth_user(id) ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 4. CUSTOMERS
-- ============================================================

CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(254),

    address TEXT,
    city VARCHAR(100),
    pincode VARCHAR(15),

    status VARCHAR(20) DEFAULT 'ACTIVE',

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE customer_feedback (
    id BIGSERIAL PRIMARY KEY,

    customer_id BIGINT NOT NULL
        REFERENCES customers(id) ON DELETE CASCADE,

    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),

    comment TEXT,

    order_ref VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 5. POS / ORDERS
-- ============================================================

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,

    order_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_number VARCHAR(50) UNIQUE,

    customer_id BIGINT
        REFERENCES customers(id) ON DELETE SET NULL,

    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    delivery_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

    payment_method VARCHAR(30),
    payment_status VARCHAR(30) DEFAULT 'PENDING',

    coupon_code VARCHAR(50),

    status VARCHAR(30) DEFAULT 'COMPLETED',

    notes TEXT,

    cash_tendered NUMERIC(12,2),
    change_returned NUMERIC(12,2),

    created_by_id INTEGER
        REFERENCES auth_user(id) ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,

    order_id BIGINT NOT NULL
        REFERENCES orders(id) ON DELETE CASCADE,

    product_id BIGINT
        REFERENCES products(id) ON DELETE SET NULL,

    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(50),

    unit_price NUMERIC(12,2) NOT NULL,
    quantity INTEGER NOT NULL,

    gst_percent NUMERIC(5,2) DEFAULT 0,

    subtotal NUMERIC(12,2) NOT NULL
);


CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,

    order_id BIGINT NOT NULL
        REFERENCES orders(id) ON DELETE CASCADE,

    transaction_id VARCHAR(100) NOT NULL UNIQUE,

    amount NUMERIC(12,2) NOT NULL,

    payment_method VARCHAR(30) NOT NULL,

    status VARCHAR(30) DEFAULT 'SUCCESS',

    reference_number VARCHAR(100),

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 6. SUPPLIERS
-- ============================================================

CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    company_name VARCHAR(200),

    phone VARCHAR(30) NOT NULL,
    email VARCHAR(254),

    gstin VARCHAR(30),

    address TEXT,
    city VARCHAR(100),

    bank_details TEXT,

    category VARCHAR(100),

    credit_limit NUMERIC(12,2) DEFAULT 0,

    payment_terms VARCHAR(100),

    rating INTEGER DEFAULT 0,

    notes TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE purchase_orders (
    id BIGSERIAL PRIMARY KEY,

    po_number VARCHAR(50) NOT NULL UNIQUE,

    supplier_id BIGINT NOT NULL
        REFERENCES suppliers(id) ON DELETE RESTRICT,

    order_date DATE NOT NULL,

    expected_delivery DATE,

    received_date DATE,

    status VARCHAR(30) DEFAULT 'PENDING',

    total_amount NUMERIC(12,2) DEFAULT 0,

    paid_amount NUMERIC(12,2) DEFAULT 0,

    gst_mode VARCHAR(20),

    tax_type VARCHAR(20),

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE purchase_items (
    id BIGSERIAL PRIMARY KEY,

    purchase_order_id BIGINT NOT NULL
        REFERENCES purchase_orders(id) ON DELETE CASCADE,

    product_id BIGINT
        REFERENCES products(id) ON DELETE SET NULL,

    product_name VARCHAR(255) NOT NULL,

    unit_cost NUMERIC(12,2) NOT NULL,

    quantity INTEGER NOT NULL,

    received_quantity INTEGER DEFAULT 0,

    damaged_quantity INTEGER DEFAULT 0,

    discount_rate NUMERIC(5,2) DEFAULT 0,

    tax_rate NUMERIC(5,2) DEFAULT 0,

    subtotal NUMERIC(12,2) NOT NULL,

    batch_number VARCHAR(100),

    mfg_date DATE,

    expiry_date DATE
);


CREATE TABLE goods_receipts (
    id BIGSERIAL PRIMARY KEY,

    grn_number VARCHAR(50) NOT NULL UNIQUE,

    purchase_order_id BIGINT NOT NULL
        REFERENCES purchase_orders(id) ON DELETE RESTRICT,

    supplier_id BIGINT NOT NULL
        REFERENCES suppliers(id) ON DELETE RESTRICT,

    received_date DATE NOT NULL,

    received_by_id INTEGER
        REFERENCES auth_user(id) ON DELETE SET NULL,

    total_valuation NUMERIC(12,2) DEFAULT 0,

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE supplier_payments (
    id BIGSERIAL PRIMARY KEY,

    supplier_id BIGINT NOT NULL
        REFERENCES suppliers(id) ON DELETE RESTRICT,

    purchase_order_id BIGINT
        REFERENCES purchase_orders(id) ON DELETE SET NULL,

    amount NUMERIC(12,2) NOT NULL,

    payment_method VARCHAR(30) NOT NULL,

    reference_number VARCHAR(100),

    payment_date DATE NOT NULL,

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 7. EXPENSES
-- ============================================================

CREATE TABLE expense_categories (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    icon VARCHAR(100),

    color VARCHAR(20),

    is_active BOOLEAN DEFAULT TRUE
);


CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,

    category_id BIGINT NOT NULL
        REFERENCES expense_categories(id) ON DELETE RESTRICT,

    title VARCHAR(255) NOT NULL,

    amount NUMERIC(12,2) NOT NULL,

    expense_date DATE NOT NULL,

    payment_method VARCHAR(30) NOT NULL,

    paid_to VARCHAR(150),

    receipt_url VARCHAR(500),

    notes TEXT,

    created_by_id INTEGER
        REFERENCES auth_user(id) ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 8. OFFERS & COUPONS
-- ============================================================

CREATE TABLE coupons (
    id BIGSERIAL PRIMARY KEY,

    code VARCHAR(50) NOT NULL UNIQUE,

    title VARCHAR(200) NOT NULL,

    description TEXT,

    offer_type VARCHAR(30) NOT NULL,

    discount_value NUMERIC(12,2) NOT NULL,

    min_order_amount NUMERIC(12,2) DEFAULT 0,

    max_discount_amount NUMERIC(12,2),

    valid_from DATE NOT NULL,

    valid_to DATE NOT NULL,

    usage_limit INTEGER DEFAULT 0,

    used_count INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE festival_offers (
    id BIGSERIAL PRIMARY KEY,

    title VARCHAR(200) NOT NULL,

    subtitle VARCHAR(255),

    banner_image VARCHAR(500),

    tag_text VARCHAR(100),

    discount_info VARCHAR(100),

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 9. INDEXES FOR FAST DATA FETCH
-- ============================================================

-- Products
CREATE INDEX idx_products_name
ON products(name);

CREATE INDEX idx_products_barcode
ON products(barcode);

CREATE INDEX idx_products_category
ON products(category_id);

CREATE INDEX idx_products_brand
ON products(brand_id);

CREATE INDEX idx_products_active
ON products(is_active);

CREATE INDEX idx_products_stock
ON products(stock_quantity);


-- Stock
CREATE INDEX idx_stock_product
ON stock_movements(product_id);

CREATE INDEX idx_stock_created
ON stock_movements(created_at);


-- Customers
CREATE INDEX idx_customers_name
ON customers(name);

CREATE INDEX idx_customers_phone
ON customers(phone);


-- Orders
CREATE INDEX idx_orders_customer
ON orders(customer_id);

CREATE INDEX idx_orders_created
ON orders(created_at);

CREATE INDEX idx_orders_status
ON orders(status);

CREATE INDEX idx_orders_payment_status
ON orders(payment_status);


-- Order Items
CREATE INDEX idx_order_items_order
ON order_items(order_id);

CREATE INDEX idx_order_items_product
ON order_items(product_id);


-- Payments
CREATE INDEX idx_payments_order
ON payments(order_id);

CREATE INDEX idx_payments_created
ON payments(created_at);


-- Suppliers
CREATE INDEX idx_suppliers_name
ON suppliers(name);

CREATE INDEX idx_suppliers_phone
ON suppliers(phone);


-- Purchase Orders
CREATE INDEX idx_purchase_supplier
ON purchase_orders(supplier_id);

CREATE INDEX idx_purchase_date
ON purchase_orders(order_date);


-- Expenses
CREATE INDEX idx_expenses_category
ON expenses(category_id);

CREATE INDEX idx_expenses_date
ON expenses(expense_date);


-- Activity
CREATE INDEX idx_activity_created
ON activity_logs(created_at);

CREATE INDEX idx_activity_user
ON activity_logs(user_id);