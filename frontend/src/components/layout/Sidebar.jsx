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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navSections = [
    {
      title: 'DAILY STORE OPERATIONS',
      items: [
        { label: "Make Bills (POS)", path: '/billing', icon: Store, isPrimary: true, badge: 'COUNTER' },
        { label: "Today's Collection", path: '/gulla', icon: Wallet, badge: 'CASH' },
        { label: 'Store Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'Bill Management', path: '/orders', icon: ShoppingCart },
      ]
    },
    {
      title: 'STORE CATALOG & STOCK',
      items: [
        { label: 'Add Product', path: '/products', icon: ShoppingBag },
        { label: 'Stock & Inventory', path: '/inventory', icon: Layers },
        { label: 'Customers', path: '/customers', icon: Users },
        { label: 'Suppliers', path: '/suppliers', icon: Truck },
        { label: 'Offers & Coupons', path: '/offers', icon: Tag },
      ]
    },
    {
      title: 'ACCOUNTS & REPORTS',
      items: [
        { label: 'Store Expenses', path: '/expenses', icon: Receipt },
        { label: 'Sales & Revenue', path: '/sales-revenue', icon: TrendingUp },
        { label: 'Reports & Analytics', path: '/reports', icon: FileText },
      ]
    },
    {
      title: 'STAFF & STORE SETTINGS',
      items: [
        { label: 'Staff', path: '/staff', icon: ShieldCheck, badge: 'ADMIN' },
        { label: 'Store Settings', path: '/settings', icon: Settings },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden animate-in fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Main */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 h-screen bg-[#004d40] dark:bg-slate-900 text-white flex flex-col justify-between transition-all duration-300 ease-in-out border-r border-[#00695c]/50 dark:border-slate-800 shadow-2xl lg:shadow-xl lg:sticky lg:top-0 shrink-0 font-sans ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'} border-b border-white/10 dark:border-slate-800 shrink-0`}>
          {isCollapsed ? (
            <button
              onClick={() => setIsCollapsed(false)}
              className="flex items-center justify-center p-1 rounded-xl hover:bg-white/10 dark:hover:bg-slate-800 transition-all cursor-pointer group relative"
              title="Expand Sidebar"
            >
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 border border-white/20 dark:border-slate-700 shadow-sm">
                <img
                  src="/logo.png"
                  alt="Tulsi Mart Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.src = '/logo.png'; }}
                />
              </div>
              <div className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-teal-400 dark:bg-teal-500 text-slate-950 flex items-center justify-center shadow-md border border-white dark:border-slate-800">
                <ChevronRight className="w-3 h-3 stroke-[3]" />
              </div>
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3 overflow-hidden cursor-pointer min-w-0" onClick={() => { navigate('/'); setIsMobileOpen(false); }}>
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 border border-white/20 dark:border-slate-700 shadow-sm">
                  <img
                    src="/logo.png"
                    alt="Tulsi Mart Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.src = '/logo.png'; }}
                  />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base tracking-wide text-white dark:text-slate-100 font-heading">Tulsi <span className="text-teal-300 dark:text-teal-400">Mart</span></span>
                    <span className="bg-teal-400 dark:bg-teal-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">POS</span>
                  </div>
                  <p className="text-[10px] text-teal-200/80 dark:text-slate-400 truncate font-medium">Grocery POS & Mart</p>
                </div>
              </div>

              {/* Close button on mobile */}
              <button
                onClick={() => setIsMobileOpen(false)}
                className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-teal-200 dark:text-slate-400 hover:text-white dark:hover:text-slate-100 hover:bg-white/10 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Collapse button on desktop */}
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-teal-200 dark:text-slate-400 hover:text-white dark:hover:text-slate-100 hover:bg-white/10 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Categorized Navigation Sections */}
        <div className="flex-1 px-3 py-3 overflow-y-auto custom-scrollbar-thin space-y-4 touch-pan min-h-0">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300/80 dark:text-slate-400/90 px-3 pt-2.5 pb-1 select-none">
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
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-teal-600 text-white font-black shadow-md shadow-[#00332c]/50 dark:shadow-slate-950/60 border-l-4 border-teal-300 dark:border-teal-400'
                          : 'text-teal-50/90 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-800/80 hover:text-white dark:hover:text-slate-100'
                      } ${isCollapsed ? 'justify-center' : ''}`
                    }
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110" />

                    {!isCollapsed && (
                      <span className="truncate flex-1 tracking-wide">{item.label}</span>
                    )}

                    {item.badge && !isCollapsed && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                          item.badge === 'COUNTER'
                            ? 'bg-teal-300 text-slate-950 font-black'
                            : item.badge === 'ADMIN'
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : item.badge === 'CASH'
                            ? 'bg-emerald-400 text-slate-950 font-black'
                            : 'bg-rose-500 text-white font-black'
                        }`}>
                        {item.badge}
                      </span>
                    )}

                    {item.badge && isCollapsed && (
                      <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                          item.badge === 'COUNTER' 
                            ? 'bg-teal-300' 
                            : item.badge === 'ADMIN'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`} />
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 pb-24 lg:pb-3 border-t border-white/10 dark:border-slate-800 bg-black/20 dark:bg-slate-950/60 shrink-0 z-10">
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/10 dark:bg-slate-800/80 border border-white/10 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                <div className="w-8 h-8 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 border border-white/30 dark:border-slate-600 shadow-xs">
                  {user?.first_name ? user.first_name[0].toUpperCase() : (user?.username?.[0]?.toUpperCase() || 'T')}
                </div>
                <div className="truncate text-left min-w-0">
                  <p className="text-xs font-black text-white dark:text-slate-100 truncate leading-tight">
                    {user?.username || user?.first_name || 'Tulsi Admin'}
                  </p>
                  <span className="inline-block text-[9px] text-teal-200/90 dark:text-slate-400 font-extrabold uppercase tracking-wider truncate">
                    {user?.role?.replace('_', ' ') || 'STORE MANAGER'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 dark:text-rose-300 border border-rose-400/30 transition-all cursor-pointer shrink-0 font-bold text-xs"
                title="Logout Account"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-300" />
                <span className="text-[10px] font-extrabold">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-black text-xs border border-white/30 dark:border-slate-600 shadow-xs">
                {user?.first_name ? user.first_name[0].toUpperCase() : (user?.username?.[0]?.toUpperCase() || 'T')}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-rose-500/20 text-rose-200 dark:text-rose-300 hover:bg-rose-500/35 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-rose-300" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

