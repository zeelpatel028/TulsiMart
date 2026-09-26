import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const sizeStyles = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  const variantStyles = {
    default: 'bg-[#E0F2F1] dark:bg-slate-800 text-[#263238] dark:text-slate-200 border-[#B2DFDB] dark:border-slate-700',
    primary: 'bg-[#00695C] dark:bg-[#009688] text-white border-[#00695C] dark:border-[#009688]',
    accent: 'bg-[#009688] dark:bg-[#4DB6AC] text-white dark:text-slate-900 border-[#009688] dark:border-[#4DB6AC]',
    sky: 'bg-[#E0F2F1] dark:bg-[#00695C]/40 text-[#00695C] dark:text-[#4DB6AC] border-[#B2DFDB] dark:border-[#00695C]/60 font-bold',
    slate: 'bg-[#F0FAF9] dark:bg-slate-800/80 text-[#607D8B] dark:text-slate-300 border-[#B2DFDB] dark:border-slate-700',
    success: 'bg-[#E0F2F1] dark:bg-[#00695C]/35 text-[#00695C] dark:text-[#4DB6AC] border-[#4DB6AC] dark:border-[#00695C]/60 font-bold',
    warning: 'bg-[#FFF8E1] dark:bg-amber-950/60 text-[#263238] dark:text-amber-300 border-[#FBC02D] dark:border-amber-700/60 font-bold',
    gold: 'bg-[#FFF8E1] dark:bg-amber-950/60 text-[#263238] dark:text-amber-300 border-[#FBC02D] dark:border-amber-700/60 font-extrabold',
    danger: 'bg-[#FFEBEE] dark:bg-rose-950/60 text-[#E53935] dark:text-rose-300 border-[#EF9A9A] dark:border-rose-800/60 font-bold',
    info: 'bg-[#E0F2F1] dark:bg-[#00695C]/30 text-[#009688] dark:text-[#4DB6AC] border-[#B2DFDB] dark:border-[#00695C]/50',
  };

  // Helper mapping for statuses
  let computedVariant = variant;
  const lower = String(children || '').toUpperCase();
  if (variant === 'default') {
    if (['DELIVERED', 'PAID', 'ACTIVE', 'IN_STOCK', 'RECEIVED'].includes(lower)) computedVariant = 'success';
    else if (['PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY', 'LOW_STOCK', 'ORDERED', 'PENDING'].includes(lower)) computedVariant = 'warning';
    else if (['CANCELLED', 'RETURNED', 'OUT_OF_STOCK', 'BLOCKED', 'FAILED'].includes(lower)) computedVariant = 'danger';
    else if (['NEW', 'DRAFT', 'OFFER', 'DISCOUNT'].includes(lower)) computedVariant = 'gold';
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full border whitespace-nowrap ${sizeStyles[size]} ${variantStyles[computedVariant] || variantStyles.default} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
