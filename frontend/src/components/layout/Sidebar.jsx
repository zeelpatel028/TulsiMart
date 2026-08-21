import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Layers, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Tag, 
  Truck, 
  CreditCard, 
  Receipt, 
  Bell, 
  ShieldCheck, 
  FileText, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
  Sparkles,
  Wallet,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, logout, isRole } = useAuth();
  const { unreadCount } = useNotification();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navSections = [
    {
      title: 'Daily Store Operations',
      items: [
        { label: 'POS Billing Counter', path: '/billing', icon: Store, isPrimary: true, badge: 'COUNTER' },
        { label: 'Gulla Management (ગલ્લું)', path: '/gulla', icon: Wallet, badge: 'CASH' },
        { label: 'Store Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'Bill Management', path: '/orders', icon: ShoppingCart },

      ]
    },
    {
      title: 'Store Catalog & Stock',
      items: [
        { label: 'Products', path: '/products', icon: ShoppingBag },
        { label: 'Stock & Inventory', path: '/inventory', icon: Layers },
        { label: 'Customers', path: '/customers', icon: Users },
        { label: 'Offers & Coupons', path: '/offers', icon: Tag },
      ]
    },
    {
      title: 'Accounts & Reports',
      items: [
        { label: 'Store Expenses', path: '/expenses', icon: Receipt },
        { label: 'Sales & Revenue', path: '/sales-revenue', icon: TrendingUp },
        { label: 'Financial Reports', path: '/reports', icon: FileText },
      ]
    },
    {
      title: 'Admin & Store Settings',
      items: [
        { label: 'Suppliers', path: '/suppliers', icon: Truck },
        { label: 'Store Staff', path: '/staff', icon: ShieldCheck },
        { label: 'Settings', path: '/settings', icon: Settings },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-[#384959]/70 backdrop-blur-xs z-40 lg:hidden animate-in fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Main */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 h-screen bg-[#384959] dark:bg-slate-900 text-white flex flex-col justify-between transition-all duration-300 ease-in-out border-r border-[#384959]/50 dark:border-slate-800 shadow-2xl lg:shadow-xl lg:sticky lg:top-0 shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => { navigate('/'); setIsMobileOpen(false); }}>
            <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center shrink-0 border border-white/15 shadow-inner">
              <img 
                src="/logo.png" 
                alt="Tulsi Mart TM Logo" 
                className="w-full h-full object-contain drop-shadow-sm" 
                onError={(e) => { e.target.src = '/logo.png'; }}
              />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-wide text-white font-heading">Tulsi Mart</span>
                  <span className="bg-[#88BDF2] text-[#384959] text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">PRO</span>
                </div>
                <p className="text-[10px] text-[#BDDDFC]/80 truncate font-medium">Grocery Management</p>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-[#BDDDFC] hover:text-white hover:bg-white/10 transition-colors"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Collapse button on desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-[#BDDDFC] hover:text-white hover:bg-white/10 transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Categorized Navigation Sections */}
        <div className="flex-1 px-3 py-3 overflow-y-auto space-y-4 touch-pan min-h-0">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#BDDDFC]/60 px-3 pt-1 pb-0.5 select-none">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
                        item.isPrimary && !isActive
                          ? 'bg-[#88BDF2]/15 text-[#BDDDFC] border border-[#88BDF2]/30 hover:bg-[#88BDF2]/25 hover:text-white'
                          : isActive
                          ? 'bg-[#88BDF2] text-[#384959] font-bold shadow-md shadow-[#88BDF2]/20'
                          : 'text-slate-200/90 hover:bg-white/10 hover:text-white'
                      } ${isCollapsed ? 'justify-center' : ''}`
                    }
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110 ${
                      item.isPrimary ? 'text-[#88BDF2]' : ''
                    }`} />
                    
                    {!isCollapsed && (
                      <span className="truncate flex-1 tracking-wide">{item.label}</span>
                    )}

                    {item.badge && !isCollapsed && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                        item.badge === 'COUNTER' 
                          ? 'bg-emerald-500 text-white shadow-2xs' 
                          : 'bg-rose-500 text-white animate-pulse'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {item.badge && isCollapsed && (
                      <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                        item.badge === 'COUNTER' ? 'bg-emerald-400' : 'bg-rose-500'
                      }`} />
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>


        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-white/10 bg-black/20 shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#6A89A7] to-[#384959] text-white flex items-center justify-center font-bold text-sm shrink-0 border border-white/20 shadow-xs">
                  {user?.first_name ? user.first_name[0] : (user?.username?.[0] || 'A')}
                </div>
                <div className="truncate text-left min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.username || 'Admin')}
                  </p>
                  <span className="inline-block text-[10px] text-[#BDDDFC] font-medium tracking-wide truncate">
                    {user?.role?.replace('_', ' ') || 'Admin'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="text-slate-300 hover:text-rose-300 hover:bg-rose-500/20 p-2 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#6A89A7] to-[#384959] text-white flex items-center justify-center font-bold text-xs border border-white/20 shadow-xs">
                {user?.first_name ? user.first_name[0] : (user?.username?.[0] || 'A')}
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-300 hover:text-rose-300 p-2 rounded-xl hover:bg-white/10 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
