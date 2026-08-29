import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Loader2,
  X,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  createdAt: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (options: { type: ToastType; title: string; message?: string; duration?: number }) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (title: string, message?: string, duration?: number) => string;
    error: (title: string, message?: string, duration?: number) => string;
    warning: (title: string, message?: string, duration?: number) => string;
    info: (title: string, message?: string, duration?: number) => string;
    loading: (title: string, message?: string) => { id: string; dismiss: () => void };
  };
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    options: ConfirmDialogOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      type,
      title,
      message,
      duration = 4500,
    }: {
      type: ToastType;
      title: string;
      message?: string;
      duration?: number;
    }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newToast: ToastItem = {
        id,
        type,
        title,
        message,
        duration: type === 'loading' ? 0 : duration,
        createdAt: Date.now(),
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

      if (type !== 'loading' && duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = useMemo(
    () => ({
      success: (title: string, message?: string, duration = 4000) =>
        showToast({ type: 'success', title, message, duration }),
      error: (title: string, message?: string, duration = 5000) =>
        showToast({ type: 'error', title, message, duration }),
      warning: (title: string, message?: string, duration = 4500) =>
        showToast({ type: 'warning', title, message, duration }),
      info: (title: string, message?: string, duration = 4000) =>
        showToast({ type: 'info', title, message, duration }),
      loading: (title: string, message?: string) => {
        const id = showToast({ type: 'loading', title, message, duration: 0 });
        return {
          id,
          dismiss: () => removeToast(id),
        };
      },
    }),
    [showToast, removeToast]
  );

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        isOpen: true,
        options,
        resolve: (result: boolean) => {
          setConfirmDialog(null);
          resolve(result);
        },
      });
    });
  }, []);

  useEffect(() => {
    // Intercept native browser alert globally with premium toast
    window.alert = (message?: any) => {
      const msg = typeof message === 'string' ? message : JSON.stringify(message);
      showToast({
        type: 'warning',
        title: 'Pemberitahuan Sistem',
        message: msg,
        duration: 4500,
      });
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, toast, confirm }}>
      {children}
      {/* Toast Render View */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* Confirm Modal Render View */}
      {confirmDialog && (
        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          options={confirmDialog.options}
          onConfirm={() => confirmDialog.resolve(true)}
          onCancel={() => confirmDialog.resolve(false)}
        />
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Premium Toast View Container
const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-3"
      aria-live="polite"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onRemove={() => onRemove(item.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ item: ToastItem; onRemove: () => void }> = ({ item, onRemove }) => {
  const getTheme = () => {
    switch (item.type) {
      case 'success':
        return {
          border: 'border-emerald-500/40 dark:border-emerald-500/30',
          glow: 'shadow-emerald-500/15',
          bgIcon: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400',
          progressBar: 'bg-emerald-500',
          badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          icon: <CheckCircle2 className="w-5 h-5" />,
          label: 'BERHASIL',
        };
      case 'error':
        return {
          border: 'border-rose-500/40 dark:border-rose-500/30',
          glow: 'shadow-rose-500/15',
          bgIcon: 'bg-rose-500/15 text-rose-500 dark:text-rose-400',
          progressBar: 'bg-rose-500',
          badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          icon: <XCircle className="w-5 h-5" />,
          label: 'GAGAL / PERHATIAN',
        };
      case 'warning':
        return {
          border: 'border-amber-500/40 dark:border-amber-500/30',
          glow: 'shadow-amber-500/15',
          bgIcon: 'bg-amber-500/15 text-amber-500 dark:text-amber-400',
          progressBar: 'bg-amber-500',
          badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          icon: <AlertTriangle className="w-5 h-5" />,
          label: 'PERINGATAN',
        };
      case 'info':
        return {
          border: 'border-cyan-500/40 dark:border-cyan-500/30',
          glow: 'shadow-cyan-500/15',
          bgIcon: 'bg-cyan-500/15 text-cyan-500 dark:text-cyan-400',
          progressBar: 'bg-cyan-500',
          badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
          icon: <Info className="w-5 h-5" />,
          label: 'INFORMASI',
        };
      case 'loading':
      default:
        return {
          border: 'border-indigo-500/40 dark:border-indigo-500/30',
          glow: 'shadow-indigo-500/15',
          bgIcon: 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400',
          progressBar: 'bg-indigo-500',
          badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          label: 'MEMPROSES',
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden flex items-start gap-3.5 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border ${theme.border} shadow-xl ${theme.glow} text-slate-900 dark:text-white transition-all duration-300 transform translate-y-0 opacity-100 scale-100 hover:scale-[1.01]`}
      style={{
        animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme.bgIcon}`}>
        {theme.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${theme.badge}`}>
            {theme.label}
          </span>
        </div>
        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
          {item.title}
        </h4>
        {item.message && (
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed line-clamp-3">
            {item.message}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onRemove}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Tutup notifikasi"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Auto dismiss countdown bar */}
      {item.duration && item.duration > 0 ? (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800/80">
          <div
            className={`h-full ${theme.progressBar}`}
            style={{
              animation: `shrinkWidth ${item.duration}ms linear forwards`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

// Premium Confirm Dialog
const ConfirmModal: React.FC<{
  isOpen: boolean;
  options: ConfirmDialogOptions;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, options, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  const isDanger = options.type === 'danger';
  const isWarning = options.type === 'warning';

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-5 animate-scaleUp">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-rose-500/15 text-rose-500'
                : isWarning
                ? 'bg-amber-500/15 text-amber-500'
                : 'bg-emerald-500/15 text-emerald-500'
            }`}
          >
            {isDanger ? (
              <XCircle className="w-6 h-6" />
            ) : isWarning ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <HelpCircle className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
              {options.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              {options.message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {options.cancelText || 'Batal'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 hover:shadow-rose-600/30'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20 hover:shadow-amber-600/30'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 hover:shadow-emerald-600/30'
            }`}
          >
            {options.confirmText || 'Ya, Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  );
};
