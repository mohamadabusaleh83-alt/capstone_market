import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { AlertTriangle, Trash2, X, RefreshCw } from 'lucide-react';

export default function DeleteProjectModal({
  isOpen,
  onClose,
  onConfirm,
  project,
  isDeleting = false
}) {
  const { t } = useTranslation();
  const { isRtl } = useApp() || { isRtl: true };

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-project-title"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#101E42] border border-rose-300 dark:border-rose-500/30 rounded-3xl p-6 shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* زر الإغلاق */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 end-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
          aria-label={t('delete_project.cancel_button', 'إلغاء')}
        >
          <X className="w-4 h-4" />
        </button>

        {/* رأس التنبيه والأيقونة */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h2 id="delete-project-title" className="text-base font-black text-slate-900 dark:text-white leading-tight">
              {t('delete_project.modal_title', 'تأكيد حذف المشروع نهائياً')}
            </h2>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
              {isRtl ? 'إجراء أمني غير قابل للتراجع' : 'Irreversible Destructive Action'}
            </p>
          </div>
        </div>

        {/* تفاصيل المشروع المراد حذفه */}
        <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-[#0B152E] border border-rose-100 dark:border-rose-900/30 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isRtl ? 'المشروع المستهدف:' : 'Target Project:'}
          </span>
          <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
            {project.title}
          </p>
        </div>

        {/* نص التحذير الصارم */}
        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>
            {t(
              'delete_project.modal_message',
              'هل أنت متأكد من رغبتك في حذف هذا المشروع نهائياً؟ هذا الإجراء لا يمكن التراجع عنه وسيؤدي لحذف جميع الطلبات والمحادثات والتقارير والسجلات المرتبطة به.'
            )}
          </p>
        </div>

        {/* أزرار الإجراءات */}
        <div className="pt-2 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t('delete_project.deleting', 'جاري الحذف...')}</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{t('delete_project.confirm_button', 'نعم، حذف نهائي')}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {t('delete_project.cancel_button', 'إلغاء')}
          </button>
        </div>
      </div>
    </div>
  );
}
