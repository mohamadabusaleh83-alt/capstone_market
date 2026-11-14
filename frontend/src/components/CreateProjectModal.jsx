import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { STANDARDIZED_IT_MAJORS } from '../api/majors';
import { analyzeProjectDescription } from '../api/client';
import ProjectAnalysisPanel from './ProjectAnalysisPanel';
import {
  PlusCircle,
  RefreshCw,
  X,
  Building2,
  AlertCircle,
  Link as LinkIcon,
  HelpCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function CreateProjectModal() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    isSubmittingProject,
    createProject,
    isRtl
  } = useApp();

  const isCompany = ['company', 'partner', 'business'].includes((currentUser?.role || '').toLowerCase());

  // حقول نموذج الشركة المحسن (Company Opportunity Form)
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [problem, setProblem] = useState('');
  const [outcomes, setOutcomes] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // حالات التحليل بالذكاء الاصطناعي (Phase 2)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzeError, setAnalyzeError] = useState('');
  const [, setAnalyzedSkills] = useState([]);

  // حقول احتياطية للأدوار الأخرى (مشرف / طالب)
  const [genericDesc, setGenericDesc] = useState('');
  const [genericSkills, setGenericSkills] = useState('');

  // رسائل التحقق المحلية
  const [validationError, setValidationError] = useState('');

  if (!isCreateModalOpen) return null;

  const resetForm = () => {
    setTitle('');
    setSummary('');
    setProblem('');
    setOutcomes('');
    setCategory('');
    setCustomCategory('');
    setAttachmentUrl('');
    setGenericDesc('');
    setGenericSkills('');
    setValidationError('');
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setAnalyzeError('');
    setAnalyzedSkills([]);
  };

  const handleClose = () => {
    resetForm();
    setIsCreateModalOpen(false);
  };

  const handleAnalyze = async () => {
    if (!problem.trim() || problem.trim().length < 50) {
      setAnalyzeError(t('ai_analyzer.error_min_length', 'يرجى توفير وصف أكثر تفصيلاً (50 حرفاً على الأقل) لتفعيل التحليل الذكي.'));
      return;
    }
    setAnalyzeError('');
    setIsAnalyzing(true);
    try {
      const data = await analyzeProjectDescription({
        description: problem.trim(),
        language: isRtl ? 'ar' : 'en'
      });
      setAnalysisResult(data);
      if (data?.suggested_skills) {
        setAnalyzedSkills(data.suggested_skills);
      }
    } catch (err) {
      setAnalyzeError(err?.message || t('ai_analyzer.error_service', 'تعذّر التحليل حالياً. يمكنك المتابعة يدوياً.'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyAnalysis = (skills) => {
    setAnalyzedSkills(skills);
    if (analysisResult?.suggested_category && !category) {
      const matched = STANDARDIZED_IT_MAJORS.find(
        (m) => m.ar === analysisResult.suggested_category || m.en === analysisResult.suggested_category
      );
      if (matched) {
        setCategory(matched.id);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!title.trim() || title.trim().length < 3) {
      setValidationError(t('create_project.validation_title'));
      return;
    }

    if (isCompany) {
      if (!summary.trim() || summary.trim().length < 10) {
        setValidationError(t('create_project.validation_summary'));
        return;
      }
      if (!problem.trim() || problem.trim().length < 15) {
        setValidationError(t('create_project.validation_problem'));
        return;
      }
      if (!category) {
        setValidationError(t('create_project.validation_category'));
        return;
      }

      const finalCategory = category === 'other' ? (customCategory.trim() || 'General IT') : category;

      // تجميع الحقول المتخصصة في نص الوصف المتكامل بدقة ووضوح
      const combinedSections = [];
      combinedSections.push(`${isRtl ? '【ملخص المشروع والفرصة】' : '【Project Summary】'}\n${summary.trim()}`);
      combinedSections.push(`${isRtl ? '【وصف المشكلة والتحدي العملي】' : '【Problem & Business Challenge】'}\n${problem.trim()}`);
      
      if (outcomes.trim()) {
        combinedSections.push(`${isRtl ? '【الأهداف والمخرجات المتوقعة】' : '【Objectives & Expected Outcomes】'}\n${outcomes.trim()}`);
      }
      if (attachmentUrl.trim()) {
        combinedSections.push(`${isRtl ? '【المستندات والروابط المرجعية】' : '【Supporting Documentation & Link】'}\n${attachmentUrl.trim()}`);
      }

      try {
        const ok = await createProject({
          title: title.trim(),
          description: combinedSections.join('\n\n'),
          category: finalCategory,
          required_skills: '', // لا يُشترط من الشركة، ترسل فارغة ليحددها المشرف الأكاديمي
          max_members: 4,      // القيمة الافتراضية، يحددها المشرف الأكاديمي حصراً
          ai_analysis: analysisResult || undefined
        });
        if (ok) {
          handleClose();
        }
      } catch (err) {
        setValidationError(err?.message || (isRtl ? 'حدث خطأ أثناء حفظ المشروع.' : 'Error saving project.'));
      }
    } else {
      // تدفق الطلاب والمشرفين (الحفاظ على التوافقية الكاملة)
      if (!genericDesc.trim()) {
        setValidationError(isRtl ? 'يرجى إدخال وصف للمشروع.' : 'Please provide a project description.');
        return;
      }
      try {
        const ok = await createProject({
          title: title.trim(),
          description: genericDesc.trim(),
          category: category || (isRtl ? 'مشروع عام' : 'General'),
          required_skills: genericSkills.trim(),
          max_members: 4
        });
        if (ok) {
          handleClose();
        }
      } catch (err) {
        setValidationError(err?.message || (isRtl ? 'حدث خطأ أثناء حفظ المشروع.' : 'Error saving project.'));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/25 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 sm:p-7 relative shadow-2xl animate-in zoom-in-95 duration-200 text-start">
        {/* زر الإغلاق */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute end-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer"
          aria-label="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* رأس النموذج */}
        <div className="mb-5 space-y-1.5 pe-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2499F2] to-[#28C8C0] flex items-center justify-center text-white shadow-md shadow-[#2499F2]/25">
              {isCompany ? <Building2 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {isCompany ? t('create_project.company_modal_title') : t('create_project.modal_title')}
              </h2>
              {isCompany && (
                <span className="text-[10px] font-bold text-[#1875bb] dark:text-[#77DCC1] uppercase tracking-wider block">
                  {t('create_project.company_info_badge')}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {isCompany ? t('create_project.company_modal_desc') : t('create_project.modal_desc', { id: currentUser?.id })}
          </p>
        </div>

        {/* تنبيه الخطأ إن وجد */}
        {validationError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{validationError}</span>
          </div>
        )}

        {/* نموذج الشركات المحسن */}
        {isCompany ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. عنوان المشروع / التحدي */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t('create_project.title_label')} <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">150 {isRtl ? 'حرف كحد أقصى' : 'chars max'}</span>
              </div>
              <input
                type="text"
                placeholder={t('create_project.title_placeholder')}
                required
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#152550] border border-slate-300 dark:border-[#2499F2]/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2] transition"
              />
            </div>

            {/* 2. المجال / التخصص الأكاديمي المستهدف */}
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                {t('create_project.category_label')} <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#152550] border border-slate-300 dark:border-[#2499F2]/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2] transition cursor-pointer"
              >
                <option value="" disabled>
                  {t('create_project.category_placeholder')}
                </option>
                {STANDARDIZED_IT_MAJORS.map((m) => (
                  <option key={m.key} value={m[isRtl ? 'ar' : 'en']}>
                    {m[isRtl ? 'ar' : 'en']}
                  </option>
                ))}
                <option value="other">{t('create_project.category_custom')}</option>
              </select>

              {category === 'other' && (
                <input
                  type="text"
                  placeholder={t('create_project.category_custom_placeholder')}
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full mt-2 bg-slate-50 dark:bg-[#152550] border border-slate-300 dark:border-[#2499F2]/20 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2]"
                />
              )}
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                {t('create_project.category_hint')}
              </span>
            </div>

            {/* 3. ملخص موجز للمشروع */}
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                {t('create_project.summary_label')} <span className="text-rose-500">*</span>
              </label>
              <textarea
                placeholder={t('create_project.summary_placeholder')}
                rows={2}
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#152550] border border-slate-300 dark:border-[#2499F2]/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2] transition"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {t('create_project.summary_hint')}
              </span>
            </div>

            {/* 4. وصف المشكلة أو التحدي العملي */}
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                {t('create_project.problem_label')} <span className="text-rose-500">*</span>
              </label>
              <textarea
                placeholder={t('create_project.problem_placeholder')}
                rows={3}
                required
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#152550] border border-slate-300 dark:border-[#2499F2]/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2] transition"
              />
              <div className="flex items-center justify-between mt-1 flex-wrap gap-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {t('create_project.problem_hint')}
                </span>
                <span className={`text-[10px] font-semibold ${problem.trim().length >= 50 ? 'text-[#28C8C0]' : 'text-slate-400'}`}>
                  {problem.trim().length}/50 {isRtl ? 'حرفاً' : 'chars'}
                </span>
              </div>

              {/* زر التحليل الذكي للشركات (Phase 2) */}
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || problem.trim().length < 50}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
                    problem.trim().length >= 50
                      ? 'bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-white hover:opacity-95 shadow-[#2499F2]/20'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/5'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('ai_analyzer.button_analyzing', 'جارٍ التحليل الذكي...')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{t('ai_analyzer.button_analyze', 'تحليل بالذكاء الاصطناعي ✨')}</span>
                    </>
                  )}
                </button>
                {problem.trim().length < 50 && (
                  <span className="text-[10px] text-slate-400 block mt-1 text-center">
                    {t('ai_analyzer.hint_min_chars', 'اكتب 50 حرفاً على الأقل في وصف المشكلة لتفعيل التحليل الذكي')}
                  </span>
                )}
              </div>

              {/* تنبيه خطأ التحليل إن وجد */}
              {analyzeError && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>{analyzeError}</span>
                </div>
              )}

              {/* لوحة نتائج التحليل إن توفرت */}
              {analysisResult && (
                <ProjectAnalysisPanel
                  analysis={analysisResult}
                  onApply={handleApplyAnalysis}
                  onRetry={handleAnalyze}
                  isRtl={isRtl}
                />
              )}
            </div>

            {/* 5. الأهداف والمخرجات المتوقعة */}
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                {t('create_project.outcomes_label')}
              </label>
              <textarea
                placeholder={t('create_project.outcomes_placeholder')}
                rows={2}
                value={outcomes}
                onChange={(e) => setOutcomes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#152550] border border-slate-300 dark:border-[#2499F2]/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2] transition"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {t('create_project.outcomes_hint')}
              </span>
            </div>

            {/* 6. مستندات ومرفقات داعمة (اختياري) */}
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                {t('create_project.attachment_label')}
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder={t('create_project.attachment_placeholder')}
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#152550] border border-slate-300 dark:border-[#2499F2]/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2] transition ltr:pr-8 rtl:pl-8"
                />
                <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute end-3 top-3" />
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {t('create_project.attachment_hint')}
              </span>
            </div>

            {/* إشعار المشرف الأكاديمي وصلاحيات المقاعد (إعفاء الشركة من المهارات والمقاعد) */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-[#152550]/70 border border-blue-200/60 dark:border-[#2499F2]/20 text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-[#2499F2] shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                {t('create_project.supervisor_rule_notice')}
              </span>
            </div>

            {/* أزرار الإجراء */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
              >
                {t('common.cancel', 'إلغاء')}
              </button>

              <button
                type="submit"
                disabled={isSubmittingProject}
                className="bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:from-[#1D7BC3] hover:to-[#20aba3] px-6 py-2.5 rounded-xl font-bold text-xs text-white transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#2499F2]/25 active:scale-95 disabled:opacity-50"
              >
                {isSubmittingProject ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('create_project.saving')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('create_project.company_submit_btn')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* نموذج الطلاب والمشرفين (Standard Project Propose Form) */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] text-slate-700 dark:text-slate-300 block mb-1 font-medium">
                {t('create_project.title_label')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder={t('create_project.title_placeholder')}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#152550] border border-slate-300 dark:border-[#2499F2]/20 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2]"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-700 dark:text-slate-300 block mb-1 font-medium">
                {t('create_project.category_label')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#152550] border border-slate-300 dark:border-[#2499F2]/20 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2]"
              >
                <option value="">{t('create_project.category_placeholder')}</option>
                {STANDARDIZED_IT_MAJORS.map((m) => (
                  <option key={m.key} value={m[isRtl ? 'ar' : 'en']}>
                    {m[isRtl ? 'ar' : 'en']}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-700 dark:text-slate-300 block mb-1 font-medium">
                {t('create_project.desc_label')} <span className="text-rose-500">*</span>
              </label>
              <textarea
                placeholder={t('create_project.desc_placeholder')}
                rows={3}
                required
                value={genericDesc}
                onChange={(e) => setGenericDesc(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#152550] border border-slate-300 dark:border-[#2499F2]/20 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2]"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-700 dark:text-slate-300 block mb-1 font-medium">
                {t('create_project.skills_label')}
              </label>
              <input
                type="text"
                placeholder={t('create_project.skills_placeholder')}
                value={genericSkills}
                onChange={(e) => setGenericSkills(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#152550] border border-slate-300 dark:border-[#2499F2]/20 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
              >
                {t('common.cancel', 'إلغاء')}
              </button>

              <button
                type="submit"
                disabled={isSubmittingProject}
                className="bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:from-[#1D7BC3] hover:to-[#20aba3] px-5 py-2 rounded-xl font-bold text-xs text-white transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#2499F2]/25 active:scale-95 disabled:opacity-50"
              >
                {isSubmittingProject ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('create_project.saving')}</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>{t('create_project.submit_btn')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
