import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const sizeStyles = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  const variantStyles = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
    primary: 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959] border-[#384959] dark:border-[#88BDF2]',
    sky: 'bg-[#BDDDFC]/70 dark:bg-[#88BDF2]/20 text-[#384959] dark:text-[#88BDF2] border-[#88BDF2]/40 dark:border-[#88BDF2]/30 font-semibold',
    slate: 'bg-[#6A89A7]/15 dark:bg-[#6A89A7]/25 text-[#384959] dark:text-[#BDDDFC] border-[#6A89A7]/30 dark:border-[#6A89A7]/40',
    success: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
    warning: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    danger: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
    info: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-[#88BDF2] border-blue-200 dark:border-blue-800/60',
  };


  // Helper mapping for statuses
  let computedVariant = variant;
  const lower = String(children || '').toUpperCase();
  if (variant === 'default') {
    if (['DELIVERED', 'PAID', 'ACTIVE', 'IN_STOCK', 'RECEIVED'].includes(lower)) computedVariant = 'success';
    else if (['PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY', 'LOW_STOCK', 'ORDERED', 'PENDING'].includes(lower)) computedVariant = 'warning';
    else if (['CANCELLED', 'RETURNED', 'OUT_OF_STOCK', 'BLOCKED', 'FAILED'].includes(lower)) computedVariant = 'danger';
    else if (['NEW', 'DRAFT'].includes(lower)) computedVariant = 'sky';
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sizeStyles[size]} ${variantStyles[computedVariant] || variantStyles.default} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
