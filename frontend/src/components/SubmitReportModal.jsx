import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { X } from 'lucide-react';

export default function SubmitReportModal() {
  const { t } = useTranslation();
  const { submitReportModal, setSubmitReportModal, submitReport } = useApp();
  const [reportUrl, setReportUrl] = useState('');

  if (!submitReportModal) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reportUrl.trim()) return;
    submitReport(submitReportModal.id, reportUrl.trim());
    setReportUrl('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={() => setSubmitReportModal(null)}
          className="absolute end-4 top-4 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold mb-1 text-white">{t('reports.modal_title')}</h2>
        <p className="text-xs text-blue-400 mb-4">{submitReportModal.title}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] text-slate-300 block mb-1">
              {t('reports.modal_doc_label')}
            </label>
            <input
              type="url"
              required
              placeholder="https://docs.google.com/document/d/..."
              value={reportUrl}
              onChange={(e) => setReportUrl(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 text-left"
              dir="ltr"
            />
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div>• {t('reports.modal_deadline_note', { day: submitReportModal.deadlineDay })}</div>
            <div>• {t('reports.modal_notify_note')}</div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-bold text-xs text-white transition shadow-lg cursor-pointer"
          >
            {t('reports.confirm_submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
