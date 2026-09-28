# Tulsi Mart Database Architecture & Indexes

## Table List (24 Production Tables)
1. `store_settings`
2. `staff`
3. `activity_logs`
4. `bank_transactions`
5. `cash_transactions`
6. `categories`
7. `brands`
8. `units`
9. `products`
10. `stock_movements`
11. `customers`
12. `customer_feedback`
13. `orders`
14. `order_items`
15. `payments`
16. `suppliers`
17. `purchase_orders`
18. `purchase_items`
19. `goods_receipts`
20. `supplier_payments`
21. `expense_categories`
22. `expenses`
23. `coupons`
24. `festival_offers`

## Indexes Configured for Ultra-Fast Data Fetching
- `idx_products_name` on `products(name)`
- `idx_products_barcode` on `products(barcode)`
- `idx_products_category` on `products(category_id)`
- `idx_orders_created` on `orders(created_at)`
- `idx_orders_customer` on `orders(customer_id)`
- `idx_customers_phone` on `customers(phone)`
- `idx_payments_order` on `payments(order_id)`
