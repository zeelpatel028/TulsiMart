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
    { title: 'Total Suppliers', value: kpis.totalSuppliers, icon: Building2, color: 'text-[#009688] dark:text-[#4DB6AC]', bg: 'bg-[#E0F2F1] dark:bg-teal-950/40', border: 'border-[#B2DFDB] dark:border-teal-800/60' },
    { title: 'Active Vendors', value: kpis.activeSuppliers, icon: CheckCircle2, color: 'text-[#00695C] dark:text-[#4DB6AC]', bg: 'bg-[#E0F2F1] dark:bg-teal-950/40', border: 'border-[#B2DFDB] dark:border-teal-800/60' },
    { title: 'Pending POs', value: kpis.pendingPOs, icon: Clock, color: 'text-[#FBC02D] dark:text-amber-400', bg: 'bg-[#FFF8E1] dark:bg-amber-950/40', border: 'border-[#FBC02D]/40 dark:border-amber-800/60' },
    { title: 'Today Purchases', value: `₹${kpis.todayPurchases.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-[#00695C] dark:text-[#4DB6AC]', bg: 'bg-[#E0F2F1] dark:bg-slate-800/60', border: 'border-[#B2DFDB] dark:border-slate-700' },
    { title: 'Monthly Purchases', value: `₹${kpis.monthlyPurchases.toLocaleString('en-IN')}`, icon: Calendar, color: 'text-[#009688] dark:text-[#4DB6AC]', bg: 'bg-[#E0F2F1] dark:bg-teal-950/40', border: 'border-[#B2DFDB] dark:border-teal-800/60' },
    { title: 'Pending Payable', value: `₹${kpis.pendingPayments.toLocaleString('en-IN')}`, icon: CreditCard, color: 'text-[#E53935] dark:text-rose-400', bg: 'bg-[#FFEBEE] dark:bg-rose-950/40', border: 'border-[#EF9A9A] dark:border-rose-800/60' },
    { title: 'Overdue Payable', value: `₹${kpis.overduePayments.toLocaleString('en-IN')}`, icon: AlertCircle, color: 'text-[#E53935] dark:text-rose-500', bg: 'bg-[#FFEBEE] dark:bg-rose-950/80', border: 'border-[#E53935]/40 dark:border-rose-800' },
    { title: 'Products On Order', value: kpis.productsOnOrder, icon: Package, color: 'text-[#009688] dark:text-[#4DB6AC]', bg: 'bg-[#E0F2F1] dark:bg-teal-950/40', border: 'border-[#B2DFDB] dark:border-teal-800/60' },
    { title: 'Reorder Low Stock', value: kpis.lowStockReorderCount, icon: AlertTriangle, color: 'text-[#FBC02D] dark:text-amber-400', bg: 'bg-[#FFF8E1] dark:bg-amber-950/40', border: 'border-[#FBC02D]/40 dark:border-amber-800/60' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5 sm:gap-3 font-sans">
      {cards.map((card, idx) => (
        <div 
          key={idx}
          className={`p-3 rounded-2xl border ${card.border} bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#607D8B] dark:text-slate-500 truncate font-heading">
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
