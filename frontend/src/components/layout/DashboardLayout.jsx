import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import QuickOrderModal from '../pos/QuickOrderModal';
import InvoiceModal from '../invoices/InvoiceModal';
import { useAuth } from '../../context/AuthContext';

export const DashboardLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const { storeSettings } = useAuth();

  const handleOrderCreated = (order) => {
    setLastCreatedOrder(order);
    setIsInvoiceOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#F4F7FB] dark:bg-slate-950 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onMenuClick={() => setIsMobileOpen(true)}
          onOpenQuickOrder={() => setIsQuickOrderOpen(true)}
        />

        {/* Page Content Container */}
        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          <Outlet context={{ openQuickOrder: () => setIsQuickOrderOpen(true) }} />
        </main>
      </div>

      {/* POS Quick Order Modal */}
      <QuickOrderModal
        isOpen={isQuickOrderOpen}
        onClose={() => setIsQuickOrderOpen(false)}
        onOrderCreated={handleOrderCreated}
      />

      {/* Invoice Modal after billing */}
      {lastCreatedOrder && (
        <InvoiceModal
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          order={lastCreatedOrder}
          store={storeSettings}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
