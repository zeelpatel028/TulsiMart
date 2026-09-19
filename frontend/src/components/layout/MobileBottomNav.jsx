import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingCart, FileText, User } from 'lucide-react';

export const MobileBottomNav = ({ cartCount = 0 }) => {
  const location = useLocation();

  const navItems = [
    {
      label: 'Home',
      path: '/',
      icon: Home,
      circleBg: 'bg-emerald-100/80 dark:bg-emerald-950/80 text-[#00695C] dark:text-[#4DB6AC]',
      inactiveBg: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    },
    {
      label: 'Categories',
      path: '/products',
      icon: LayoutGrid,
      circleBg: 'bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300',
      inactiveBg: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    },
    {
      label: 'Cart',
      path: '/billing',
      icon: ShoppingCart,
      isCenter: true,
      badge: cartCount,
    },
    {
      label: 'Orders',
      path: '/orders',
      icon: FileText,
      circleBg: 'bg-rose-100/80 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300',
      inactiveBg: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    },
    {
      label: 'Profile',
      path: '/settings',
      icon: User,
      circleBg: 'bg-purple-100/80 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300',
      inactiveBg: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    },
  ];

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[420px] z-50 lg:hidden pointer-events-auto">
      {/* Floating Pill Card Outer Box */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 rounded-[28px] sm:rounded-[32px] shadow-2xl px-1.5 sm:px-2.5 py-1.5 sm:py-2 flex items-center justify-between relative w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          // Center Elevated Floating Circle (Cart / Billing)
          if (item.isCenter) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex-1 flex flex-col items-center justify-center relative -mt-6 z-10 group cursor-pointer min-w-0 select-none"
              >
                {/* Center Circle Button with Aura Glow */}
                <div className="relative">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 group-active:scale-95 ${
                      isActive
                        ? 'bg-gradient-to-tr from-[#004D40] via-[#00695C] to-[#009688] ring-4 ring-[#E0F2F1] dark:ring-emerald-950/80 shadow-emerald-600/30'
                        : 'bg-gradient-to-tr from-[#00695C] to-[#009688] ring-4 ring-white dark:ring-slate-900 shadow-emerald-600/20 hover:scale-105'
                    }`}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                  </div>

                  {/* Badge Counter */}
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-bounce">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className={`text-[9px] sm:text-[10px] font-extrabold tracking-tight mt-0.5 sm:mt-1 transition-colors truncate max-w-full ${
                  isActive ? 'text-[#00695C] dark:text-[#4DB6AC]' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {item.label}
                </span>

                {/* Center active indicator dot */}
                {isActive && (
                  <span className="w-2 h-0.5 sm:w-2.5 sm:h-1 bg-[#009688] dark:bg-[#4DB6AC] rounded-full mt-0.5" />
                )}
              </NavLink>
            );
          }

          // Regular Nav Items
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex-1 flex flex-col items-center justify-center relative py-0.5 px-0.5 sm:px-1 group cursor-pointer min-w-0 select-none"
            >
              {/* Circle Icon Wrapper */}
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 group-active:scale-90 ${
                  isActive ? item.circleBg : item.inactiveBg
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.3]' : 'stroke-[1.8]'}`} />
              </div>

              {/* Label */}
              <span
                className={`text-[9px] sm:text-[10px] font-extrabold tracking-tight mt-0.5 sm:mt-1 transition-colors truncate max-w-full ${
                  isActive ? 'text-[#00695C] dark:text-[#4DB6AC]' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </span>

              {/* Active Indicator Pill / Dot below label */}
              {isActive && (
                <span className="w-2 h-0.5 sm:w-2.5 sm:h-1 bg-[#009688] dark:bg-[#4DB6AC] rounded-full mt-0.5 transition-all animate-in fade-in zoom-in" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );

};

export default MobileBottomNav;

