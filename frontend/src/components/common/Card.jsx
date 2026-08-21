import React from 'react';

export const Card = ({ children, className = '', title, subtitle, action, footer }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-4 py-3.5 sm:px-6 sm:py-4.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            {title && <h3 className="text-sm sm:text-base font-bold text-[#384959] dark:text-slate-100 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-4 sm:p-6">{children}</div>
      {footer && (
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-50/70 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          {footer}
        </div>
      )}

    </div>
  );
};

export default Card;
