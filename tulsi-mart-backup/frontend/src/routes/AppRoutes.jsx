import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageLoader from '../components/loading/PageLoader';

// Lazy Loaded Pages according to blueprint
const StoreDashboard = lazy(() => import('../pages/Dashboard/StoreDashboard'));
const MakeBill = lazy(() => import('../pages/POS/MakeBill'));
const TodaysCollection = lazy(() => import('../pages/Collection/TodaysCollection'));
const BillManagement = lazy(() => import('../pages/Bills/BillManagement'));
const AddProduct = lazy(() => import('../pages/Products/AddProduct'));
const InventoryList = lazy(() => import('../pages/Inventory/InventoryList'));
const CustomerList = lazy(() => import('../pages/Customers/CustomerList'));
const SupplierList = lazy(() => import('../pages/Suppliers/SupplierList'));
const OffersList = lazy(() => import('../pages/Offers/OffersList'));
const ExpenseList = lazy(() => import('../pages/Expenses/ExpenseList'));
const SalesRevenue = lazy(() => import('../pages/Sales/SalesRevenue'));
const ReportsAnalytics = lazy(() => import('../pages/Reports/ReportsAnalytics'));
const StaffList = lazy(() => import('../pages/Staff/StaffList'));
const StoreSettings = lazy(() => import('../pages/Settings/StoreSettings'));
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader text="Verifying session..." size="lg" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const AppRoutes = () => {
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
          {/* DAILY STORE OPERATIONS */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<StoreDashboard />} />
          <Route path="pos" element={<MakeBill />} />
          <Route path="billing" element={<MakeBill />} />
          <Route path="collection" element={<TodaysCollection />} />
          <Route path="gulla" element={<TodaysCollection />} />

          {/* STORE CATALOG & STOCK */}
          <Route path="bills" element={<BillManagement />} />
          <Route path="orders" element={<BillManagement />} />
          <Route path="products" element={<AddProduct />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="inventory" element={<InventoryList />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="suppliers" element={<SupplierList />} />
          <Route path="offers" element={<OffersList />} />

          {/* ACCOUNTS & REPORTS */}
          <Route path="expenses" element={<ExpenseList />} />
          <Route path="sales" element={<SalesRevenue />} />
          <Route path="sales-revenue" element={<SalesRevenue />} />
          <Route path="reports" element={<ReportsAnalytics />} />

          {/* STAFF & STORE SETTINGS */}
          <Route path="staff" element={<StaffList />} />
          <Route path="settings" element={<StoreSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
