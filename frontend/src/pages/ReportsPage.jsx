import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Clock,
  MessageSquare,
  Calendar,
  CheckCircle,
  ExternalLink,
  UploadCloud
} from 'lucide-react';

export default function ReportsPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    reportsTimeline,
    setSubmitReportModal,
    rawProjects,
    applications,
    setActiveChatProject
  } = useApp();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border border-blue-800/60 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {t('reports.hub_badge')}
            </span>
            <span className="text-xs text-slate-400">{t('reports.semester')}</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-400" />
            {t('reports.hub_title')}
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
            {t('reports.hub_desc')}
          </p>
        </div>

        {rawProjects.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const myProject =
                rawProjects.find((p) =>
                  applications.some(
                    (a) =>
                      a.project_id === p.id &&
                      a.student_id === currentUser?.id &&
                      a.status === 'accepted'
                  )
                ) || rawProjects[0];
              setActiveChatProject(myProject);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            {t('reports.open_chat')}
          </button>
        )}
      </div>

      {/* خط الزمن ومراحل التسليم */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          {t('reports.timeline_title')}
        </h3>

        <div className="space-y-4">
          {reportsTimeline.map((rep) => {
            const isSubmitted = rep.status === 'submitted';

            return (
              <div
                key={rep.id}
                className={`p-5 rounded-2xl border transition-all duration-200 ${
                  isSubmitted
                    ? 'bg-slate-900/90 border-slate-800 shadow-md'
                    : 'bg-slate-900/60 border-amber-800/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                        isSubmitted
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {isSubmitted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      {isSubmitted ? t('reports.submitted') : t('reports.pending_submission')}
                    </span>
                    <h4 className="font-bold text-sm text-white">{rep.title}</h4>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">{t('reports.deadline_label')}</span>
                    <span className="bg-slate-800 px-2.5 py-1 rounded-lg text-amber-300 font-bold border border-slate-700">
                      {rep.deadlineDay} ({rep.deadlineDate})
                    </span>
                  </div>
                </div>

                {/* تفاصيل التسليم والملاحظات */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 mb-3">
                  <div>
                    <span className="text-slate-400 block mb-1">{t('reports.doc_link')}</span>
                    {rep.submissionLink ? (
                      <a
                        href={rep.submissionLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono truncate"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        {rep.submissionLink}
                      </a>
                    ) : (
                      <span className="text-slate-500 italic">{t('reports.no_doc')}</span>
                    )}
                    {rep.submittedAt && (
                      <span className="text-[10px] text-slate-500 block mt-1">
                        {t('reports.upload_date', { date: rep.submittedAt })}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">
                      {t('reports.supervisor_feedback')}
                    </span>
                    <p className="text-slate-300 leading-relaxed">{rep.supervisorFeedback}</p>
                    <span className="text-[10px] text-amber-400 block mt-1 font-bold">
                      {t('reports.grade', { grade: rep.grade })}
                    </span>
                  </div>
                </div>

                {/* أزرار الإجراءات */}
                {currentUser?.role === 'student' && (
                  <div className="flex justify-end pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setSubmitReportModal(rep)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      {rep.status === 'submitted'
                        ? t('reports.submit_new')
                        : t('reports.submit_report')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
