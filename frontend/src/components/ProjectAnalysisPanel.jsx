import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Zap,
  Layers,
  Target,
  FileText
} from 'lucide-react';

// مؤشر مستوى التعقيد
const COMPLEXITY_CONFIG = {
  simple: { label_ar: 'بسيط', label_en: 'Simple', color: 'emerald', dots: 1 },
  medium: { label_ar: 'متوسط', label_en: 'Medium', color: 'blue', dots: 2 },
  complex: { label_ar: 'معقد', label_en: 'Complex', color: 'amber', dots: 3 },
  advanced: { label_ar: 'متقدم', label_en: 'Advanced', color: 'rose', dots: 4 },
};

function ProviderBadge({ isFallback, confidence }) {
  if (isFallback) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
        <AlertTriangle className="w-3 h-3" />
        <span>⚠️ تحليل محلي — الخدمة الذكية غير متاحة</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#2499F2]/10 dark:bg-[#2499F2]/15 text-[#1875bb] dark:text-[#77DCC1] border border-[#2499F2]/25">
      <Sparkles className="w-3 h-3" />
      <span>Gemini AI · {Math.round((confidence || 0) * 100)}% ثقة</span>
    </div>
  );
}

function DisclaimerBanner({ textAr, textEn, isRtl }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
      <p className="text-[11px] font-medium leading-relaxed">{isRtl ? textAr : textEn}</p>
    </div>
  );
}

function SkillTagsEditable({ skills, onRemove }) {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2499F2]/10 dark:bg-[#2499F2]/15 text-[#1875bb] dark:text-[#77DCC1] border border-[#2499F2]/25"
        >
          {skill}
          <button
            type="button"
            onClick={() => onRemove(skill)}
            className="ms-0.5 hover:text-rose-500 dark:hover:text-rose-400 transition"
            aria-label={`Remove ${skill}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {skills.length === 0 && (
        <span className="text-xs text-slate-400 italic">
          لا توجد مهارات مقترحة
        </span>
      )}
    </div>
  );
}

function ComplexityBadge({ level, explanationAr, explanationEn, isRtl }) {
  const cfg = COMPLEXITY_CONFIG[level] || COMPLEXITY_CONFIG.medium;
  const colorMap = {
    emerald: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
    blue: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
    amber: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
    rose: 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
  };
  return (
    <div className="space-y-1.5">
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colorMap[cfg.color]}`}>
        <Zap className="w-3 h-3" />
        <span>{isRtl ? cfg.label_ar : cfg.label_en}</span>
        <span className="ms-1 opacity-60">{Array(cfg.dots).fill('●').join(' ')}</span>
      </div>
      {(explanationAr || explanationEn) && (
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed ps-1">
          {isRtl ? explanationAr : explanationEn}
        </p>
      )}
    </div>
  );
}

function DeliverablesList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#28C8C0] shrink-0 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SummaryCard({ ar, en, isRtl }) {
  if (!ar && !en) return null;
  const text = isRtl ? ar : en;
  if (!text) return null;
  return (
    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-200 dark:border-white/10">
      {text}
    </p>
  );
}

function SkillReasonsAccordion({ explanations, isRtl }) {
  const [open, setOpen] = useState(false);
  if (!explanations || explanations.length === 0) return null;

  return (
    <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#2499F2]" />
          {isRtl ? 'لماذا هذه المهارات؟' : 'Why these skills?'}
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {explanations.map((exp, i) => (
            <div key={i} className="p-3 space-y-0.5 text-start">
              <span className="text-[11px] font-bold text-[#1875bb] dark:text-[#77DCC1]">{exp.skill}</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {isRtl ? exp.reason_ar : exp.reason_en}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectAnalysisPanel({ analysis, onApply, onRetry, isRtl }) {
  const { t } = useTranslation();
  const [localSkills, setLocalSkills] = useState(analysis?.suggested_skills || []);

  if (!analysis) return null;

  return (
    <div className="mt-4 rounded-2xl border border-[#2499F2]/30 dark:border-[#2499F2]/20 bg-gradient-to-br from-[#2499F2]/5 to-[#28C8C0]/5 dark:from-[#2499F2]/8 dark:to-[#28C8C0]/8 backdrop-blur-sm p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 text-start">

      {/* رأس اللوحة */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2499F2] to-[#28C8C0] flex items-center justify-center shadow-md shadow-[#2499F2]/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-black text-slate-900 dark:text-white">
            {t('ai_analyzer.result_title', 'نتيجة التحليل الذكي')}
          </span>
        </div>
        <ProviderBadge
          isFallback={analysis.is_fallback}
          confidence={analysis.analysis_confidence}
        />
      </div>

      {/* تحذير دائم غير قابل للإخفاء */}
      <DisclaimerBanner
        textAr={analysis.disclaimer_ar}
        textEn={analysis.disclaimer_en}
        isRtl={isRtl}
      />

      {/* المهارات المقترحة */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-[#2499F2]" />
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {t('ai_analyzer.section_skills', 'المهارات التقنية المقترحة')}
          </label>
        </div>
        <SkillTagsEditable
          skills={localSkills}
          onRemove={(skill) => setLocalSkills((prev) => prev.filter((s) => s !== skill))}
        />
        <p className="text-[10px] text-slate-400 italic">
          {t('ai_analyzer.skills_note', 'يمكنك حذف المهارات غير المناسبة. المشرف سيحدد القائمة النهائية.')}
        </p>
      </div>

      {/* مستوى التعقيد */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#2499F2]" />
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {t('ai_analyzer.section_complexity', 'مستوى التعقيد')}
          </label>
        </div>
        <ComplexityBadge
          level={analysis.complexity_level}
          explanationAr={analysis.complexity_explanation_ar}
          explanationEn={analysis.complexity_explanation_en}
          isRtl={isRtl}
        />
      </div>

      {/* الملخص التقني */}
      {(analysis.technical_summary_ar || analysis.technical_summary_en) && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#2499F2]" />
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {t('ai_analyzer.section_summary', 'الملخص التقني')}
            </label>
          </div>
          <SummaryCard
            ar={analysis.technical_summary_ar}
            en={analysis.technical_summary_en}
            isRtl={isRtl}
          />
        </div>
      )}

      {/* المخرجات المتوقعة */}
      {analysis.expected_deliverables && analysis.expected_deliverables.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#28C8C0]" />
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {t('ai_analyzer.section_deliverables', 'المخرجات المتوقعة')}
            </label>
          </div>
          <DeliverablesList items={analysis.expected_deliverables} />
        </div>
      )}

      {/* أسباب المهارات (Accordion) */}
      <SkillReasonsAccordion
        explanations={analysis.skill_explanations}
        isRtl={isRtl}
      />

      {/* الأزرار */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('ai_analyzer.button_retry', 'إعادة التحليل')}
        </button>
        <button
          type="button"
          onClick={() => onApply(localSkills)}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:opacity-90 shadow-md shadow-[#2499F2]/25 transition cursor-pointer"
        >
          {t('ai_analyzer.button_apply', 'تطبيق وإرسال للمشرف')}
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}
