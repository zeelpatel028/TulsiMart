# TulsiMart 🛒

TulsiMart is a modern, full-stack Point of Sale (POS), Inventory, Billing, and Supermarket Management System built for streamlined store operations.

---

## 🌟 Key Features

- 🧾 **Billing & POS System**: Fast checkout experience, invoice generation, cash/UPI payment handling.
- 📦 **Inventory Management**: Real-time product tracking, stock updates, barcode scanning, and category management.
- 🚚 **Supplier & Procurement Management**: Purchase orders, Goods Receive Notes (GRN), and payment ledgers.
- 📊 **Analytics & Reports**: Sales revenue insights, expense tracking, daily summaries, and profit analytics.
- 👥 **Customer & Staff Management**: Customer loyalty profiles, staff roles, and access control.
- 💰 **Gulla (Cash Counter) Management**: Opening/closing cash register tracking and reconciliation.
- 🎁 **Offers & Discounts**: Dynamic promotional offers and discount rules.

---

## 🏗️ Project Architecture

The repository is structured into two primary modules:

```text
TulsiMart/
├── backend/      # Django REST Framework API server
└── frontend/     # React.js + Vite dashboard & POS interface
```

---

## 🚀 Getting Started

### 1. Backend Setup (Django)

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

---

## 🌿 Branching Strategy

- **`main`**: Project overview and documentation.
- **`dev`**: Active development branch containing full backend & frontend source code.

---

## 📄 License

This project is licensed under the MIT License.
