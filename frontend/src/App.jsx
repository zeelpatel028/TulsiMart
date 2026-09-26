import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout & Common
import DashboardLayout from './components/layout/DashboardLayout';
import CartLoader from './components/common/CartLoader';

// Lazy Loaded Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProductList = lazy(() => import('./pages/Products/ProductList'));
const InventoryList = lazy(() => import('./pages/Inventory/InventoryList'));
const OrderList = lazy(() => import('./pages/Orders/OrderList'));
const CustomerList = lazy(() => import('./pages/Customers/CustomerList'));
const SalesRevenue = lazy(() => import('./pages/SalesRevenue/SalesRevenue'));
const OffersList = lazy(() => import('./pages/Offers/OffersList'));
const SupplierList = lazy(() => import('./pages/Suppliers/SupplierList'));
const ExpenseList = lazy(() => import('./pages/Expenses/ExpenseList'));
const StaffList = lazy(() => import('./pages/Staff/StaffList'));
const ReportsPage = lazy(() => import('./pages/Reports/ReportsPage'));
const BillingPage = lazy(() => import('./pages/Billing/BillingPage'));
const GullaManagement = lazy(() => import('./pages/Gulla/GullaManagement'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));

// Fallback loader for lazy routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <CartLoader text="Loading..." size="md" />
  </div>
);

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
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  );
}

export default App;

