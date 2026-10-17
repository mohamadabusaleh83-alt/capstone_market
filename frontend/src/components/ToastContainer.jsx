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
          className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-xl border shadow-2xl text-xs font-medium backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100 shadow-emerald-900/30'
              : toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/60 text-rose-100 shadow-rose-900/30'
                : 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-900/50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Bell className="w-4 h-4 text-blue-400 shrink-0" />}
            <span className="leading-snug">{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer shrink-0"
            aria-label={t('common.close')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
