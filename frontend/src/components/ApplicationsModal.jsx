import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Users, RefreshCw, X, Check, MessageSquare, FileText } from 'lucide-react';

// حالة الطلب -> مفتاح الترجمة ولون الشارة
const STATUS_META = {
  applied: { key: 'status_pending', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30' },
  pending: { key: 'status_pending', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30' },
  company_accepted: { key: 'status_nominated', cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30' },
  academically_approved: { key: 'status_approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30' },
  accepted: { key: 'status_approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30' },
  rejected: { key: 'status_rejected', cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30' }
};

// ما يسمح به الخادم للشركة المالكة (آلة الحالات)
const CAN_ACCEPT = new Set(['applied', 'pending']);
const CAN_REJECT = new Set(['applied', 'pending', 'company_accepted']);

const disabledCls = 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700';

export default function ApplicationsModal() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    showApplicationsModal,
    closeApplicationsModal,
    applicationsModalProjectId,
    applications,
    isLoadingApplications,
    fetchApplications,
    rawProjects,
    updateApplicationStatus,
    setActiveChatProject,
    openUserCv
  } = useApp();

  if (!showApplicationsModal) return null;

  const modalProject = applicationsModalProjectId ? rawProjects.find((p) => p.id === applicationsModalProjectId) : null;
  const visible = applicationsModalProjectId
    ? applications.filter((a) => a.project_id === applicationsModalProjectId)
    : applications;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/25 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={closeApplicationsModal}
          aria-label={t('common.close', 'Close')}
          className="absolute end-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center justify-between gap-3 mb-4 pe-6">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#28C8C0] dark:text-[#77DCC1]" />
              {t('applications_management.title')}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
              {modalProject ? modalProject.title : t('applications_management.desc')}
            </p>
          </div>
          <button
            type="button"
            onClick={fetchApplications}
            className="text-xs text-[#2499F2] dark:text-[#28C8C0] hover:underline flex items-center gap-1 transition cursor-pointer font-medium shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {t('applications_management.refresh')}
          </button>
        </div>

        {isLoadingApplications ? (
          <div className="text-center py-8 text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#2499F2] dark:text-[#28C8C0]" />
            {t('applications_management.loading')}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#152550]/60 rounded-xl border border-slate-200 dark:border-[#2499F2]/20">
            {t('applications_management.empty')}
          </div>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pe-1">
            {visible.map((app) => {
              const targetProject = rawProjects.find((p) => p.id === app.project_id);
              const meta = STATUS_META[app.status] || STATUS_META.applied;
              const isOwner = Boolean(targetProject && currentUser && targetProject.created_by === currentUser.id && currentUser.role === 'company');
              const canAccept = isOwner && CAN_ACCEPT.has(app.status);
              const canReject = isOwner && CAN_REJECT.has(app.status);
              return (
                <div
                  key={app.id}
                  className="p-4 bg-slate-50 dark:bg-[#152550]/60 border border-slate-200 dark:border-[#2499F2]/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {app.student_name || t('applications_management.student_ref', { id: app.student_id })}
                      </span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                        {t('applications_management.project_ref', {
                          id: app.project_id,
                          title: app.project_title || (targetProject ? targetProject.title : '')
                        })}
                      </span>
                    </div>
                    {app.student_major && <p className="text-[11px] text-slate-500 dark:text-slate-400">{app.student_major}</p>}
                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed break-words">
                      {app.message || t('applications_management.no_message')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${meta.cls}`}>
                      {t(`applications_management.${meta.key}`)}
                    </span>

                    {app.student_has_cv && (isOwner || ['supervisor', 'admin'].includes(currentUser?.role)) && (
                      <button
                        type="button"
                        onClick={() => openUserCv(app.student_id)}
                        className="p-1.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                        title={t('applications_management.cv_btn')}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="text-[10px]">{t('applications_management.cv_btn')}</span>
                      </button>
                    )}

                    {isOwner && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateApplicationStatus(app.id, 'company_accepted')}
                          disabled={!canAccept}
                          className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${canAccept ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm' : disabledCls}`}
                          title={t('applications_management.accept_btn')}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden sm:inline">{t('applications_management.accept_btn')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateApplicationStatus(app.id, 'rejected')}
                          disabled={!canReject}
                          className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${canReject ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-sm' : disabledCls}`}
                          title={t('applications_management.reject_btn')}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden sm:inline">{t('applications_management.reject_btn')}</span>
                        </button>

                        {targetProject && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveChatProject(targetProject);
                              closeApplicationsModal();
                            }}
                            className="p-1.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-cyan-600 dark:hover:bg-cyan-600 text-slate-700 dark:text-slate-200 hover:text-white transition cursor-pointer"
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
