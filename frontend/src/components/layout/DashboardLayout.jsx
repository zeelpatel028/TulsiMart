import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileHeader from './MobileHeader';
import MobileBottomNav from './MobileBottomNav';
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
    <div className="flex min-h-screen bg-[#F0FAF9] dark:bg-slate-950 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Desktop / Tablet Top Navbar */}
        <div className="hidden lg:block">
          <Navbar
            onMenuClick={() => setIsMobileOpen(true)}
            onOpenQuickOrder={() => setIsQuickOrderOpen(true)}
          />
        </div>

        {/* Mobile App Sticky Top Header */}
        <div className="lg:hidden">
          <MobileHeader
            onMenuClick={() => setIsMobileOpen(true)}
            onOpenSearch={() => setIsQuickOrderOpen(true)}
          />
        </div>

        {/* Page Content Container - includes safe padding for Mobile Header & Mobile Bottom Navigation */}
        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300 pt-24 lg:pt-8 pb-32 lg:pb-8">
          <Outlet context={{ openQuickOrder: () => setIsQuickOrderOpen(true) }} />
        </main>


        {/* Mobile Fixed App Bottom Navigation Bar */}
        <MobileBottomNav />
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

