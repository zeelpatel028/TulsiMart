import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search products, orders, customers...',
  className = '',
  onClear,
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-[#88BDF2] rounded-xl outline-hidden transition-all text-[#384959] dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-[#88BDF2]/20"
      />
      {value && (
        <button
          onClick={onClear || (() => onChange(''))}
          className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
}) => {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safeCurrentPage = Math.max(1, Math.min(safeTotalPages, Number(currentPage) || 1));
  
  if (safeTotalPages <= 1 && (totalItems === 0 || totalItems <= pageSize)) {
    return null;
  }

  const effectiveTotalItems = Number(totalItems) || (safeTotalPages * pageSize);
  const from = effectiveTotalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const to = Math.min(safeCurrentPage * pageSize, effectiveTotalItems);

  // Calculate sliding page window (up to 5 page numbers)
  let startPage = Math.max(1, safeCurrentPage - 2);
  let endPage = Math.min(safeTotalPages, startPage + 4);
  
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    if (i >= 1 && i <= safeTotalPages) {
      pageNumbers.push(i);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4 px-2 text-xs text-slate-500 dark:text-slate-400 select-none">
      <div className="text-center sm:text-left text-[11px] sm:text-xs font-medium">
        Showing <span className="font-bold text-slate-700 dark:text-slate-200">{from}</span> to{' '}
        <span className="font-bold text-slate-700 dark:text-slate-200">{to}</span> of{' '}
        <span className="font-bold text-slate-700 dark:text-slate-200">{effectiveTotalItems}</span> entries
      </div>

      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange && onPageChange(safeCurrentPage - 1)}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 dark:text-slate-200 text-xs transition-all shadow-xs cursor-pointer active:scale-95"
        >
          Previous
        </button>

        {/* Mobile Compact Page Number */}
        <span className="inline-block sm:hidden px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-extrabold text-xs border border-slate-200 dark:border-slate-700">
          {safeCurrentPage} / {safeTotalPages}
        </span>

        {/* Desktop Page Numbers */}
        <div className="hidden sm:flex items-center gap-1.5">
          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange && onPageChange(1)}
                className="w-8 h-8 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                1
              </button>
              {startPage > 2 && <span className="text-slate-400 px-0.5 font-bold">...</span>}
            </>
          )}

          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange && onPageChange(pageNum)}
              className={`w-8 h-8 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                safeCurrentPage === pageNum
                  ? 'bg-[#88BDF2] dark:bg-[#88BDF2] text-slate-900 shadow-md scale-105 border border-[#88BDF2]/50'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80'
              }`}
            >
              {pageNum}
            </button>
          ))}

          {endPage < safeTotalPages && (
            <>
              {endPage < safeTotalPages - 1 && <span className="text-slate-400 px-0.5 font-bold">...</span>}
              <button
                onClick={() => onPageChange && onPageChange(safeTotalPages)}
                className="w-8 h-8 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                {safeTotalPages}
              </button>
            </>
          )}
        </div>

        {/* Next Button */}
        <button
          disabled={safeCurrentPage >= safeTotalPages}
          onClick={() => onPageChange && onPageChange(safeCurrentPage + 1)}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 dark:text-slate-200 text-xs transition-all shadow-xs cursor-pointer active:scale-95"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#384959]/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
        <h3 className="text-base sm:text-lg font-bold text-[#384959] dark:text-slate-100">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{message}</p>
        <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-center"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer text-center ${
              isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#384959] hover:bg-[#273440] dark:bg-[#88BDF2] dark:hover:bg-[#BDDDFC] dark:text-[#384959]'
            }`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};


export { EmptyState } from './EmptyState';
