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
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4 px-2 text-xs text-slate-500 dark:text-slate-400">
      <div className="text-center sm:text-left text-[11px] sm:text-xs">
        Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</span> to{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{totalItems}</span> entries
      </div>
      <div className="flex items-center gap-1.5">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 dark:text-slate-200 text-xs transition-colors cursor-pointer"
        >
          Previous
        </button>

        {/* Mobile Compact Page Number */}
        <span className="inline-block sm:hidden px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-bold text-xs">
          {currentPage} / {totalPages}
        </span>

        {/* Desktop Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5 && currentPage > 3) {
              pageNum = currentPage - 3 + i;
              if (pageNum > totalPages) pageNum = totalPages - (4 - i);
            }
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959]'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 dark:text-slate-200 text-xs transition-colors cursor-pointer"
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
