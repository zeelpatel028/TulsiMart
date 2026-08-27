import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import Dashboard from './pages/Dashboard';
import ProductList from './pages/Products/ProductList';
import InventoryList from './pages/Inventory/InventoryList';
import OrderList from './pages/Orders/OrderList';
import CustomerList from './pages/Customers/CustomerList';
import SalesRevenue from './pages/SalesRevenue/SalesRevenue';
import OffersList from './pages/Offers/OffersList';
import SupplierList from './pages/Suppliers/SupplierList';
import ExpenseList from './pages/Expenses/ExpenseList';
import StaffList from './pages/Staff/StaffList';
import ReportsPage from './pages/Reports/ReportsPage';
import BillingPage from './pages/Billing/BillingPage';
import GullaManagement from './pages/Gulla/GullaManagement';
import SettingsPage from './pages/Settings/SettingsPage';

import LoginPage from './pages/Auth/LoginPage';
import CartLoader from './components/common/CartLoader';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4F7FB] dark:bg-slate-950">
        <CartLoader text="Loading Tulsi Mart..." size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Dashboard Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >

        <Route index element={<Dashboard />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="gulla" element={<GullaManagement />} />
        <Route path="pos" element={<Navigate to="/billing" replace />} />
        <Route path="products" element={<ProductList />} />
        <Route path="inventory" element={<InventoryList />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="sales-revenue" element={<SalesRevenue />} />
        <Route path="offers" element={<OffersList />} />
        <Route path="suppliers" element={<SupplierList />} />
        <Route path="expenses" element={<ExpenseList />} />
        <Route path="staff" element={<StaffList />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>


      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
