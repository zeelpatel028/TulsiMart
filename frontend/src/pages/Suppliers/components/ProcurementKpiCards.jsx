import React from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  AlertCircle, 
  Package, 
  AlertTriangle 
} from 'lucide-react';

export const ProcurementKpiCards = ({ kpis }) => {
  const cards = [
    { title: 'Total Suppliers', value: kpis.totalSuppliers, icon: Building2, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40', border: 'border-sky-200 dark:border-sky-800/60' },
    { title: 'Active Vendors', value: kpis.activeSuppliers, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800/60' },
    { title: 'Pending POs', value: kpis.pendingPOs, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800/60' },
    { title: 'Today Purchases', value: `₹${kpis.todayPurchases.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-[#384959] dark:text-[#88BDF2]', bg: 'bg-slate-100 dark:bg-slate-800/60', border: 'border-slate-200 dark:border-slate-700' },
    { title: 'Monthly Purchases', value: `₹${kpis.monthlyPurchases.toLocaleString('en-IN')}`, icon: Calendar, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-800/60' },
    { title: 'Pending Payable', value: `₹${kpis.pendingPayments.toLocaleString('en-IN')}`, icon: CreditCard, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800/60' },
    { title: 'Overdue Payable', value: `₹${kpis.overduePayments.toLocaleString('en-IN')}`, icon: AlertCircle, color: 'text-rose-700 dark:text-rose-500', bg: 'bg-rose-100 dark:bg-rose-950/80', border: 'border-rose-300 dark:border-rose-800' },
    { title: 'Products On Order', value: kpis.productsOnOrder, icon: Package, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/40', border: 'border-cyan-200 dark:border-cyan-800/60' },
    { title: 'Reorder Low Stock', value: kpis.lowStockReorderCount, icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-800/60' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5 sm:gap-3 font-sans">
      {cards.map((card, idx) => (
        <div 
          key={idx}
          className={`p-3 rounded-2xl border ${card.border} bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
              {card.title}
            </span>
            <div className={`p-1 rounded-lg ${card.bg} ${card.color} shrink-0`}>
              <card.icon className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className={`text-base sm:text-lg font-black ${card.color} font-mono mt-1 truncate`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ProcurementKpiCards;
