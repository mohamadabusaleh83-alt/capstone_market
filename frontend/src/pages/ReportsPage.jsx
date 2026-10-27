import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Clock,
  MessageSquare,
  Calendar,
  CheckCircle,
  ExternalLink,
  UploadCloud,
  Download,
  AlertTriangle,
  XCircle,
  Send
} from 'lucide-react';

const STATUS_STYLES = {
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
  needs_changes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30',
  pending: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10'
};

const STATUS_ICONS = { approved: CheckCircle, needs_changes: AlertTriangle, rejected: XCircle, pending: Clock };

const inputClass = 'w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] transition';

function NewReportForm({ project }) {
  const { t } = useTranslation();
  const { submitReport, uploadReportFile, showToast } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast(t('reports.title_required'), 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const fileKey = file ? await uploadReportFile(file) : null;
      if (file && !fileKey) return;
      await submitReport({
        project_id: project.id,
        title: title.trim(),
        description: description.trim() || null,
        deadline_date: deadline || null,
        file_url: link.trim() || null,
        file_key: fileKey
      });
      setTitle('');
      setDescription('');
      setDeadline('');
      setLink('');
      setFile(null);
    } catch {
      // the toast is shown by submitReport / uploadReportFile
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-2xl p-5 space-y-3 shadow-sm">
      <div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-[#2499F2]" />
          {t('reports.new_title')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('reports.new_desc', { project: project.title })}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1">
          <span>{t('reports.field_title')} *</span>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
        </label>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1">
          <span>{t('reports.field_deadline')}</span>
          <input type="date" className={inputClass} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </label>
      </div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1">
        <span>{t('reports.field_description')}</span>
        <textarea rows={3} className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={10000} />
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1">
          <span>{t('reports.field_link')}</span>
          <input type="url" dir="ltr" className={inputClass} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://docs.google.com/document/d/..." maxLength={255} />
        </label>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1">
          <span>{t('reports.field_file')}</span>
          <input
            type="file"
            accept=".pdf,.docx,.pptx,.zip,.doc"
            className="block w-full text-xs text-slate-600 dark:text-slate-300 file:me-2 file:rounded-lg file:border-0 file:bg-slate-100 dark:file:bg-[#152550] file:px-3 file:py-1.5 file:text-xs file:font-bold"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <span className="block text-[10px] font-normal text-slate-400">{t('reports.file_hint')}</span>
        </label>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md disabled:opacity-60 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? t('reports.submitting') : t('reports.submit_btn')}
        </button>
      </div>
    </form>
  );
}

function ReviewControls({ report }) {
  const { t } = useTranslation();
  const { updateReportStatus } = useApp();
  const [grade, setGrade] = useState(report.grade || '');
  const [feedback, setFeedback] = useState(report.supervisorFeedback || '');
  const [isSaving, setIsSaving] = useState(false);

  const decide = async (status) => {
    setIsSaving(true);
    try {
      await updateReportStatus(report.id, status, feedback.trim() || null, grade.trim() || null);
    } catch {
      // toast shown by updateReportStatus
    } finally {
      setIsSaving(false);
    }
  };

  const buttons = [
    { status: 'approved', label: t('reports.approve_btn'), cls: 'bg-emerald-600 hover:bg-emerald-500' },
    { status: 'needs_changes', label: t('reports.needs_changes_btn'), cls: 'bg-amber-500 hover:bg-amber-400' },
    { status: 'rejected', label: t('reports.reject_btn'), cls: 'bg-rose-600 hover:bg-rose-500' }
  ];

  return (
    <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('reports.review_title')}</span>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <input
          className={inputClass}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          placeholder={t('reports.grade_label')}
          aria-label={t('reports.grade_label')}
          maxLength={50}
        />
        <input
          className={`${inputClass} sm:col-span-3`}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={t('reports.feedback_label')}
          aria-label={t('reports.feedback_label')}
          maxLength={5000}
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {buttons.map((b) => (
          <button
            key={b.status}
            type="button"
            disabled={isSaving}
            onClick={() => decide(b.status)}
            className={`${b.cls} text-white text-xs px-3 py-1.5 rounded-lg font-bold disabled:opacity-60 cursor-pointer`}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { reportsTimeline, myProject, setActiveChatProject, openSignedFile } = useApp();

  const isStudent = currentUser?.role === 'student';
  // مشروع الطالب المعتمد (عضو معتمد أكاديمياً) من /projects/my
  const studentProject = isStudent && myProject?.status === 'approved' ? myProject : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-gradient-to-r from-white via-[#F4F8FC] to-white dark:from-[#101E42] dark:via-[#152550] dark:to-[#101E42] border border-slate-200 dark:border-[#2499F2]/25 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 border">
            {t('reports.hub_badge')}
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-2">
            <Clock className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            {t('reports.hub_title')}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 max-w-2xl leading-relaxed">{t('reports.hub_desc')}</p>
        </div>
        {studentProject && (
          <button
            type="button"
            onClick={() => setActiveChatProject(studentProject)}
            className="bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            {t('reports.open_chat')}
          </button>
        )}
      </div>

      {isStudent && (studentProject ? (
        <NewReportForm project={studentProject} />
      ) : (
        <div className="text-center py-8 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-2xl p-6 space-y-1">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('reports.need_project')}</h4>
          <p className="text-xs text-slate-500">{t('reports.need_project_desc')}</p>
        </div>
      ))}

      <div className="space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          {t('reports.timeline_title')}
        </h3>

        {reportsTimeline.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-2xl p-6 space-y-2">
            <Clock className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('reports.no_reports')}</h4>
            <p className="text-xs text-slate-500">{t('reports.no_reports_desc')}</p>
          </div>
        ) : (
          reportsTimeline.map((rep) => {
            const status = STATUS_STYLES[rep.status] ? rep.status : 'pending';
            const StatusIcon = STATUS_ICONS[status];
            return (
              <div key={rep.id} className="p-5 rounded-2xl border bg-white dark:bg-[#101E42] border-slate-200 dark:border-[#2499F2]/20 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border shrink-0 ${STATUS_STYLES[status]}`}>
                      <StatusIcon className="w-4 h-4" />
                      {t(`reports.status_${status}`)}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white break-words">{rep.title}</h4>
                  </div>
                  {rep.deadlineDate && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('reports.deadline_label')} <b className="text-amber-700 dark:text-amber-300">{rep.deadlineDate}</b>
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span>{t('reports.project_label')}: <b className="text-slate-700 dark:text-slate-200">{rep.project_title}</b></span>
                  <span>{t('reports.student_label')}: <b className="text-slate-700 dark:text-slate-200">{rep.student_name}</b></span>
                  {rep.submittedAt && <span>{t('reports.upload_date', { date: rep.submittedAt })}</span>}
                </div>

                {rep.description && <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{rep.description}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <div className="space-y-1.5 min-w-0">
                    <span className="text-slate-500 dark:text-slate-400 block">{t('reports.doc_link')}</span>
                    {rep.submissionLink && (
                      <a href={rep.submissionLink} target="_blank" rel="noreferrer noopener" className="text-cyan-600 dark:text-cyan-400 flex items-center gap-1 font-mono truncate" dir="ltr">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{rep.submissionLink}</span>
                      </a>
                    )}
                    {rep.hasFile && (
                      <button type="button" onClick={() => openSignedFile(`/reports/${rep.id}/file`)} className="inline-flex items-center gap-1 text-[#2499F2] dark:text-[#28C8C0] font-bold cursor-pointer">
                        <Download className="w-3.5 h-3.5" />
                        {t('reports.download_file')}
                      </button>
                    )}
                    {!rep.submissionLink && !rep.hasFile && <span className="text-slate-400 italic">{t('reports.no_doc')}</span>}
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-1">{t('reports.supervisor_feedback')}</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{rep.supervisorFeedback || t('reports.no_feedback')}</p>
                    {rep.grade && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 block mt-1 font-bold">{t('reports.grade', { grade: rep.grade })}</span>
                    )}
                  </div>
                </div>

                {rep.canReview && <ReviewControls key={`${rep.id}-${rep.status}`} report={rep} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
