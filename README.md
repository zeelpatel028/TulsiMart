<div align="center">
  <img src="frontend/public/logo.png" alt="Tulsi Mart Logo" width="180" style="border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);" />
  
  # 🌿 Tulsi Mart (તુલસી માર્ટ) 🛒
  
  **Next-Gen Retail POS, Live Gulla Drawer Currency Management & Supermarket ERP**
  
  [![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
  [![Django](https://img.shields.io/badge/Django-5.0.2-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
  [![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
  [![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Overview

**Tulsi Mart** is a state-of-the-art, enterprise-grade **Supermarket Management & Point of Sale (POS) Ecosystem** specifically engineered for high-speed retail operations, physical currency note tracking, live cash register audits, and reliable SQL database integration (MySQL / SQLite).

Built using **Django REST Framework** on the backend and **React 19 + Vite** on the frontend, Tulsi Mart solves critical real-world retail challenges like missing cash float denominations, unrecorded cashier drawer withdrawals, complex change calculations, and real-time inventory management.

---

## ✨ Core Features & Highlights

### 🛒 1. Smart POS Billing Terminal
- **Ultra-Fast Barcode Scanning & Search**: Instant product lookup via barcode or name keywords with real-time price & MRP savings indicators.
- **Multi-Cart Hold/Resume**: Support for active customer cart tabs (`Cart 1`, `Cart 2`, `Cart 3`) allowing cashiers to hold pending bills seamlessly.
- **Greedy Currency Denominations Algorithm**:
  - Automatically calculates optimal physical note/coin breakdown (`₹500`, `₹200`, `₹100`, `₹50`, `₹20`, `₹10`, `₹5`, `₹2`, `₹1`) for tendered cash and change.
  - **Gulla Live Drawer Note Availability Check**: Skips 0-count drawer notes automatically when calculating customer change.
  - **Change Note Amount & Fit Validation**: Automatically disables note buttons larger than the remaining change needed to prevent cashier error.
  - **Out-of-Stock Note Warning**: Displays red `⚠️ Out of Stock (નોટ નથી)` badges and triggers `GullaAlertModal` alerts.
- **GST & Discount Engine**: Automatic extraction of inclusive retail GST (CGST + SGST) and promotional coupon code validation.
- **Thermal Printing & OTP Email Receipts**: Instant browser receipt printing and automated Nodemailer / Django email delivery.

### 💰 2. Gulla (Cash Register Drawer) Management
- **Live Cash Register Tracking**: Real-time monitoring of Opening Float, Total Sales Inflow, Cash In (Deposits), Cash Out (Withdrawals), Supplier Payouts, and Expense Outflows.
- **Physical Note Breakdown Grid**: Live 9-denomination matrix displaying exact note counts currently inside the cash register.
- **Day-End Auto Cash Sweep (`EOD_SWEEP`)**: One-click Day-End closing action that sweeps net register cash to the **Home Safe Vault** while maintaining desired float for tomorrow.

### 🏡 3. Home Safe Cash Vault (ઘરે રાખેલ તિજોરી કેશ)
- **Centralized Home Safe Balance**: Real-time tracking of `StoreSetting.home_cash_amount`.
- **Manual Deposits & Withdrawals**: Modals with physical note counters (`₹500`, `₹200`, `₹100`, `₹50`, `₹20`, `₹10`, `₹5`, `₹1`).
- **Complete Audit History Ledger**: Comprehensive transaction log displaying Date, Entry Type (`DEPOSIT`, `WITHDRAWAL`, `SWEEP`), Note Breakdown (`2×₹500 + 5×₹200`), Balance After, User Name, and Reference Notes.

### 📦 4. Inventory & Barcode Management
- **Catalog Control**: Full management of Products, Categories, Brands, and Measuring Units.
- **Stock Audit Trail**: Stock movement tracking (Inward, Outward, Adjustment, Damage).
- **Low Stock Badging**: Automatic visual alerts when inventory drops below reorder thresholds.

### 🚚 5. Supplier & Procurement ERP
- **Purchase Orders (PO)**: PO creation, status workflows (`DRAFT`, `ORDERED`, `RECEIVED`, `CANCELLED`).
- **Goods Receive Notes (GRN)**: Automated stock level increments upon GRN verification.
- **Supplier Payment Ledger**: Cash and UPI payment tracking with automatic Gulla drawer deduction.

### 👥 6. Khata Customers & Staff Management
- **Customer Khata Credit**: Credit balance tracking, partial payments, and purchase history.
- **Staff & Access Control**: Role-based permissions (`ADMIN`, `STORE_MANAGER`, `CASHIER`) and attendance tracking.

### 🔐 7. Dual-Layer OTP Email Authentication
- Secure JWT authentication coupled with OTP verification sent directly to user email accounts.

---

## 🎨 Brand Design System & Aesthetics

Tulsi Mart features a custom-crafted, modern color palette and dynamic UI layout:

| Element | Color Code | Visual Role |
| :--- | :--- | :--- |
| **TM Navy** | `#384959` | Primary Headers, Navigation, Main Buttons |
| **TM Sky Accent** | `#88BDF2` | High-contrast Badges, Highlights, Active States |
| **TM Light Sky** | `#BDDDFC` | Soft Backgrounds, Hover Overlays |
| **TM Slate** | `#6A89A7` | Secondary Buttons, Subtitles, Borders |
| **Dark Slate** | `#0F172A` / `#1E293B` | Dark Mode Surfaces |

---

## 📁 Repository Directory Structure

```text
TulsiMart/
├── backend/                        # Django 5.0 REST Framework Backend
│   ├── core/                       # Models, Services, Views & Gulla Logic
│   │   ├── gulla_services.py       # Gulla Cash Register & EOD Sweep Engine
│   │   ├── models.py               # Database Models (StoreSetting, HomeCash, Gulla, etc.)
│   │   ├── views.py                # REST API Viewsets & Controllers
│   │   └── urls.py                 # API Routing Endpoints
│   ├── seed_tulsimart.py           # Database Seed Data Script
│   ├── send_email.js               # Node.js Email Delivery Service
│   ├── render.yaml                 # Backend Cloud Deployment Config
│   ├── requirements.txt            # Python Dependencies
│   └── manage.py                   # Django CLI Controller
│
├── frontend/                       # React 19 + Vite Frontend Application
│   ├── public/                     # Static Assets & Logo (`logo.png`)
│   ├── src/
│   │   ├── api/                    # Axios API Client Modules (`index.js`)
│   │   ├── components/             # Reusable UI Components
│   │   │   ├── common/             # Button, Modal, Card, Badge, Scrollbars
│   │   │   ├── layout/             # Sidebar, Navbar, DashboardLayout
│   │   │   └── pos/                # GullaAlertModal, QuickOrderModal
│   │   ├── context/                # AuthContext, NotificationContext, ThemeContext
│   │   ├── pages/                  # Page Views (Billing, Gulla, Settings, etc.)
│   │   ├── App.jsx                 # Application Routing
│   │   ├── main.jsx                # Application Entry Point
│   │   └── index.css               # Design System & Scrollbar Styles
│   ├── .vercelignore               # Vercel Deployment Exclusions
│   ├── vercel.json                 # Frontend Vercel Deployment Config
│   └── package.json                # Node.js Dependencies
│
└── README.md                       # Project Documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Python**: `3.10+` (Python 3.13 recommended)
- **Node.js**: `18+`
- **Database**: MySQL or SQLite

---

### 1. Backend Setup (Django REST API)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\activate

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run database migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. (Optional) Seed initial data:
   ```bash
   python seed_tulsimart.py
   ```

6. Start the Django development server:
   ```bash
   python manage.py runserver
   ```
   The backend API will be running at `http://127.0.0.1:8000/api/`.

---

### 2. Frontend Setup (React 19 + Vite)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173/`.

---

## 📜 Key API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/core/auth/login/` | User Authentication & OTP Generation |
| `POST` | `/api/core/auth/verify-otp/` | Verify OTP Code & Return JWT Tokens |
| `GET` / `POST` | `/api/core/home-cash/` | Home Safe Cash Vault Balance & Audit History |
| `GET` | `/api/core/gulla/` | Gulla Register Summary & Net Note Counts |
| `POST` | `/api/core/gulla/entry/` | Record Gulla Register Cash In / Cash Out |
| `POST` | `/api/core/gulla/eod-sweep/` | Trigger Day-End Auto Gulla Sweep to Home Safe |
| `GET` / `POST` | `/api/inventory/products/` | Product Catalog Management & Stock Updates |
| `GET` / `POST` | `/api/orders/orders/` | Create POS Orders & Invoice Details |
| `GET` / `POST` | `/api/suppliers/suppliers/` | Supplier Directory & Procurement Payments |
| `GET` / `POST` | `/api/expenses/expenses/` | Store Operating Expenses Ledger |

---

## 📄 License

This project is licensed under the **MIT License**.

<div align="center">
  <sub>Built with ❤️ for <b>Tulsi Mart Supermarket</b></sub>
</div>
