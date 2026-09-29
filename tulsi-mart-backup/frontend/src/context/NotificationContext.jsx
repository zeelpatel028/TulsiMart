import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, Bell, X } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Auto-request browser desktop notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const showToast = (message, type = 'success', duration = 4500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);

    // Trigger Browser OS Desktop Notification if permission is granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Tulsi Mart Notification', {
          body: message,
          icon: '/logo.png',
          silent: false,
        });
      } catch (err) {
        // Fallback silently if browser notification fails
      }
    }

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toast Notification Container (Top Right - Highest Z-Index) */}
      <div className="fixed top-5 right-4 sm:right-6 z-[99999] flex flex-col gap-3 max-w-md w-[calc(100%-2rem)] sm:w-96 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-top-4 ${
              toast.type === 'success'
                ? 'bg-slate-900/95 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40'
                : toast.type === 'error'
                ? 'bg-slate-900/95 text-rose-300 border-rose-500/40 shadow-rose-950/40'
                : toast.type === 'warning'
                ? 'bg-slate-900/95 text-amber-300 border-amber-500/40 shadow-amber-950/40'
                : 'bg-slate-900/95 text-sky-300 border-sky-500/40 shadow-sky-950/40'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
            </div>

            <div className="flex-1 text-xs sm:text-sm font-semibold leading-relaxed text-slate-100">
              {toast.message}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white shrink-0 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);

