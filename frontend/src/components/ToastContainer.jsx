import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertCircle, Bell, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast, isRtl } = useApp();
  const { t } = useTranslation();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className={`fixed top-20 ${isRtl ? 'left-4' : 'right-4'} z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-xl border shadow-xl text-xs font-medium backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-white dark:bg-emerald-950/95 border-emerald-300 dark:border-emerald-500/60 text-emerald-900 dark:text-emerald-100 shadow-emerald-500/10'
              : toast.type === 'error'
                ? 'bg-white dark:bg-rose-950/95 border-rose-300 dark:border-rose-500/60 text-rose-900 dark:text-rose-100 shadow-rose-500/10'
                : 'bg-white dark:bg-slate-900/95 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-slate-500/10'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Bell className="w-4 h-4 text-cyan-600 dark:text-blue-400 shrink-0" />}
            <span className="leading-snug">{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer shrink-0 active:scale-90"
            aria-label={t('common.close')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
