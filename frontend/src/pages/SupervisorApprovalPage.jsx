import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  RefreshCw,
  Check,
  X,
  MessageSquare
} from 'lucide-react';

export default function SupervisorApprovalPage() {
  const { t } = useTranslation();
  const {
    rawProjects,
    isLoadingProjects,
    fetchProjects,
    approveProject,
    setActiveChatProject
  } = useApp();

  const [reviewFilterStatus, setReviewFilterStatus] = useState('all');

  const filteredProjects = useMemo(() => {
    if (reviewFilterStatus === 'all') return rawProjects;
    return rawProjects.filter((p) => p.status === reviewFilterStatus);
  }, [rawProjects, reviewFilterStatus]);

  const pendingCount = rawProjects.filter((p) => p.status === 'pending').length;
  const approvedCount = rawProjects.filter((p) => p.status === 'approved').length;
  const rejectedCount = rawProjects.filter((p) => p.status === 'rejected').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-800/40 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {t('supervisor.review_badge')}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            {t('supervisor.review_title')}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {t('supervisor.review_desc')}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchProjects}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" /> {t('supervisor.refresh_list')}
        </button>
      </div>

      {/* أزرار تصفية الحالة */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold me-2">
            {t('supervisor.filter_by_status')}
          </span>
          <button
            type="button"
            onClick={() => setReviewFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              reviewFilterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t('supervisor.all_projects_count', { count: rawProjects.length })}
          </button>
          <button
            type="button"
            onClick={() => setReviewFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              reviewFilterStatus === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-amber-300 hover:text-white'
            }`}
          >
            <span>{t('supervisor.pending_approval')}</span>
            <span className="bg-amber-950 text-amber-200 px-1.5 py-0.2 rounded-full text-[10px]">
              {pendingCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setReviewFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              reviewFilterStatus === 'approved'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-emerald-300 hover:text-white'
            }`}
          >
            {t('supervisor.approved_count', { count: approvedCount })}
          </button>
          <button
            type="button"
            onClick={() => setReviewFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              reviewFilterStatus === 'rejected'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-rose-300 hover:text-white'
            }`}
          >
            {t('supervisor.rejected_count', { count: rejectedCount })}
          </button>
        </div>
      </div>

      {/* قائمة المشاريع للاعتماد */}
      {isLoadingProjects ? (
        <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
          {t('supervisor.loading_projects')}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          {t('supervisor.no_projects_matching')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex justify-between items-start mb-3 gap-2">
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                      p.status === 'approved'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : p.status === 'rejected'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                          : 'bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse'
                    }`}
                  >
                    {p.status === 'approved'
                      ? t('projects.status_approved_badge')
                      : p.status === 'rejected'
                        ? t('projects.status_rejected_badge')
                        : t('projects.status_pending_badge')}
                  </span>

                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    {t('supervisor.seats_status', {
                      current: p.currentMembers,
                      max: p.maxMembers
                    })}
                  </span>
                </div>

                <h3 className="font-bold text-base text-white mb-2">{p.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                  {p.description}
                </p>

                <div className="mb-4">
                  <span className="text-[10px] text-slate-400 block mb-1 font-semibold">
                    {t('supervisor.required_skills')}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {p.skills &&
                      p.skills.map((sk, i) => (
                        <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {sk}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              {/* أزرار التحكم والاعتماد */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => approveProject(p.id, 'approved')}
                    disabled={p.status === 'approved'}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      p.status === 'approved'
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('supervisor.approve_button')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => approveProject(p.id, 'rejected')}
                    disabled={p.status === 'rejected'}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      p.status === 'rejected'
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t('supervisor.reject_button')}</span>
                  </button>

                  {p.status !== 'pending' && (
                    <button
                      type="button"
                      onClick={() => approveProject(p.id, 'pending')}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold transition cursor-pointer"
                      title={t('supervisor.reset_pending_title')}
                    >
                      {t('supervisor.reset_pending')}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveChatProject(p)}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t('supervisor.project_chat')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
