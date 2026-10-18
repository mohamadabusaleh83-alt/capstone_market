import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Users, RefreshCw, X, Check, MessageSquare } from 'lucide-react';

export default function ApplicationsModal() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    showApplicationsModal,
    setShowApplicationsModal,
    applications,
    isLoadingApplications,
    fetchApplications,
    rawProjects,
    updateApplicationStatus,
    setActiveChatProject
  } = useApp();

  if (!showApplicationsModal) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={() => setShowApplicationsModal(false)}
          className="absolute end-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              {t('applications_management.title')}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">{t('applications_management.desc')}</p>
          </div>
          <button
            type="button"
            onClick={fetchApplications}
            className="text-xs text-cyan-600 dark:text-blue-400 hover:text-cyan-500 dark:hover:text-blue-300 flex items-center gap-1 transition cursor-pointer font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {t('applications_management.refresh')}
          </button>
        </div>

        {isLoadingApplications ? (
          <div className="text-center py-8 text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-500 dark:text-blue-400" />
            {t('applications_management.loading')}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
            {t('applications_management.empty')}
          </div>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pe-1">
            {applications.map((app) => {
              const targetProject = rawProjects.find((p) => p.id === app.project_id);
              return (
                <div
                  key={app.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {t('applications_management.app_number', { id: app.id })}
                      </span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                        {t('applications_management.project_ref', {
                          id: app.project_id,
                          title: targetProject ? targetProject.title : ''
                        })}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {t('applications_management.student_ref', { id: app.student_id })}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                      {app.message || t('applications_management.no_message')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                        app.status === 'accepted'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                          : app.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                      }`}
                    >
                      {app.status === 'accepted'
                        ? t('applications_management.status_accepted')
                        : app.status === 'rejected'
                          ? t('applications_management.status_rejected')
                          : t('applications_management.status_pending')}
                    </span>

                    {(currentUser?.role === 'company' || currentUser?.role === 'supervisor') && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateApplicationStatus(app.id, 'accepted')}
                          disabled={app.status === 'accepted'}
                          className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            app.status === 'accepted'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm'
                          }`}
                          title={t('applications_management.accept_btn')}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden sm:inline">
                            {t('applications_management.accept_btn')}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateApplicationStatus(app.id, 'rejected')}
                          disabled={app.status === 'rejected'}
                          className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            app.status === 'rejected'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                              : 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-sm'
                          }`}
                          title={t('applications_management.reject_btn')}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden sm:inline">
                            {t('applications_management.reject_btn')}
                          </span>
                        </button>

                        {targetProject && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveChatProject(targetProject);
                              setShowApplicationsModal(false);
                            }}
                            className="p-1.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-cyan-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 hover:text-white transition cursor-pointer"
                            title={t('applications_management.open_chat_title')}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
