import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { RefreshCw, Send, X } from 'lucide-react';

export default function ApplyModal() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    isApplyModalOpen,
    setIsApplyModalOpen,
    selectedProject,
    isSubmittingApply,
    applyToProject
  } = useApp();

  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');

  if (!isApplyModalOpen || !selectedProject) return null;

  const totalSeats = selectedProject.total_seats ?? selectedProject.seats ?? selectedProject.maxMembers ?? 4;
  const remainingSeats = selectedProject.remaining_seats ?? selectedProject.availableSeats ?? 0;
  const isSeatsFull = remainingSeats <= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSeatsFull) return;
    try {
      await applyToProject({
        projectId: selectedProject.id,
        role,
        message
      });
      setRole('');
      setMessage('');
    } catch {
      // Handled in context
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/25 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={() => setIsApplyModalOpen(false)}
          className="absolute end-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold mb-1 text-slate-900 dark:text-white">
          {t('apply_project.modal_title', { title: selectedProject.title })}
        </h2>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3">
          {t('apply_project.modal_desc', { name: currentUser?.name })}
        </p>

        {/* مؤشر المقاعد المتاحة */}
        <div className="flex items-center justify-between p-2.5 mb-3 bg-slate-50 dark:bg-[#152550]/60 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
          <span className="text-slate-600 dark:text-slate-300 font-medium">
            {t('projects.available_seats', 'المقاعد المتاحة في المشروع:')}
          </span>
          <span className={`font-bold font-mono ${isSeatsFull ? 'text-rose-600 dark:text-rose-400' : 'text-[#2499F2]'}`}>
            {isSeatsFull ? (t('projects.seats_full', 'المقاعد مكتملة')) : `${remainingSeats} / ${totalSeats}`}
          </span>
        </div>

        {isSeatsFull && (
          <div className="p-3 mb-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 font-bold text-center">
            ⚠️ {t('projects.seats_full_notice', 'المقاعد مكتملة لهذا المشروع حالياً ولا يمكن تقديم طلبات جديدة.')}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] text-slate-700 dark:text-slate-300 block mb-1 font-medium">
              {t('apply_project.student_name')}
            </label>
            <input
              type="text"
              readOnly
              value={currentUser?.name || ''}
              className="w-full bg-slate-100 dark:bg-[#0B152E] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-700 dark:text-slate-300 block mb-1 font-medium">
              {t('apply_project.desired_role')}
            </label>
            <input
              type="text"
              placeholder={t('apply_project.desired_role_placeholder')}
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2]"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-700 dark:text-slate-300 block mb-1 font-medium">
              {t('apply_project.message_label')}
            </label>
            <textarea
              placeholder={t('apply_project.message_placeholder')}
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2]"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#0B152E]/60 rounded-xl border border-slate-200 dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <div>• {t('apply_project.note_1')}</div>
            <div>• {t('apply_project.note_2')}</div>
          </div>

          <button
            type="submit"
            disabled={isSubmittingApply || isSeatsFull}
            className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-md ${
              isSeatsFull
                ? 'bg-slate-200 dark:bg-[#152550] text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-white/5'
                : 'bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:opacity-95 text-white cursor-pointer shadow-[#2499F2]/20 active:scale-95'
            }`}
          >
            {isSubmittingApply ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t('apply_project.submitting')}
              </>
            ) : isSeatsFull ? (
              t('projects.seats_full', 'المقاعد مكتملة')
            ) : (
              <>
                <Send className="w-4 h-4" />
                {t('apply_project.submit_btn')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
