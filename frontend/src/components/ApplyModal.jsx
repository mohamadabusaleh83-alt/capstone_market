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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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
        <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-4">
          {t('apply_project.modal_desc', { name: currentUser?.name })}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] text-slate-700 dark:text-slate-300 block mb-1 font-medium">
              {t('apply_project.student_name')}
            </label>
            <input
              type="text"
              readOnly
              value={currentUser?.name || ''}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
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
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
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
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <div>• {t('apply_project.note_1')}</div>
            <div>• {t('apply_project.note_2')}</div>
          </div>

          <button
            type="submit"
            disabled={isSubmittingApply}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 py-2.5 rounded-xl font-bold text-xs text-white transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 active:scale-95"
          >
            {isSubmittingApply ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t('apply_project.submitting')}
              </>
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
