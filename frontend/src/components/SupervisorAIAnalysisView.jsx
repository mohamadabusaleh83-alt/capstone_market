import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Zap,
  Layers,
  Target,
  FileText,
  Edit3,
  Plus,
  X
} from 'lucide-react';

const COMPLEXITY_CONFIG = {
  simple:   { label_ar: 'بسيط',   label_en: 'Simple',   color: 'emerald' },
  medium:   { label_ar: 'متوسط',  label_en: 'Medium',   color: 'blue'    },
  complex:  { label_ar: 'معقد',   label_en: 'Complex',  color: 'amber'   },
  advanced: { label_ar: 'متقدم',  label_en: 'Advanced', color: 'rose'    },
};

function SuggestedSkillsEditor({ suggested, onApply, isRtl }) {
  const { t } = useTranslation();
  const [skills, setSkills] = useState(suggested || []);
  const [newSkill, setNewSkill] = useState('');
  const [editing, setEditing] = useState(false);

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setNewSkill('');
  };

  const removeSkill = (skill) => setSkills((prev) => prev.filter((s) => s !== skill));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-[#2499F2]" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {t('ai_analyzer.supervisor_edit_skills', 'المهارات المقترحة (قابلة للتعديل)')}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="flex items-center gap-1 text-[10px] font-bold text-[#2499F2] hover:underline cursor-pointer"
        >
          <Edit3 className="w-3 h-3" />
          {editing ? (isRtl ? 'إخفاء' : 'Hide') : (isRtl ? 'تعديل' : 'Edit')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2499F2]/10 dark:bg-[#2499F2]/15 text-[#1875bb] dark:text-[#77DCC1] border border-[#2499F2]/25"
          >
            {skill}
            {editing && (
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ms-0.5 hover:text-rose-500 transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
      </div>

      {editing && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            placeholder={isRtl ? 'أضف مهارة...' : 'Add skill...'}
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2499F2]/30"
          />
          <button
            type="button"
            onClick={addSkill}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#2499F2] hover:bg-[#1875bb] transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {onApply && (
        <button
          type="button"
          onClick={() => onApply(skills)}
          className="w-full py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:opacity-90 shadow-md shadow-[#2499F2]/25 transition cursor-pointer"
        >
          {t('ai_analyzer.supervisor_apply_skills', 'تطبيق هذه المهارات على المشروع →')}
        </button>
      )}
    </div>
  );
}

function SkillReasonsAccordion({ explanations, isRtl }) {
  const { t } = useTranslation();
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
          {t('ai_analyzer.skill_rationale', 'مبررات المهارات المقترحة')}
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

export default function SupervisorAIAnalysisView({ project, onUpdateSkills, isRtl }) {
  const { t } = useTranslation();

  const analysis = useMemo(() => {
    if (!project?.ai_analysis) return null;
    try {
      const parsed = typeof project.ai_analysis === 'string'
        ? JSON.parse(project.ai_analysis)
        : project.ai_analysis;
      return parsed;
    } catch {
      return null;
    }
  }, [project]);

  if (!analysis) {
    return null;
  }

  if (analysis.is_fallback) {
    return (
      <div className="mt-4 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/8 text-start">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
            {t('ai_analyzer.supervisor_fallback', 'تحليل محلي — الذكاء الاصطناعي غير متاح')}
          </span>
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
          {isRtl ? analysis.complexity_explanation_ar : analysis.complexity_explanation_en}
        </p>
        {analysis.suggested_skills && analysis.suggested_skills.length > 0 && (
          <SuggestedSkillsEditor
            suggested={analysis.suggested_skills}
            onApply={onUpdateSkills}
            isRtl={isRtl}
          />
        )}
      </div>
    );
  }

  const cfg = COMPLEXITY_CONFIG[analysis.complexity_level] || COMPLEXITY_CONFIG.medium;
  const colorMap = {
    emerald: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
    blue: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
    amber: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
    rose: 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
  };

  return (
    <div className="mt-4 rounded-2xl border border-[#2499F2]/30 dark:border-[#2499F2]/20 bg-gradient-to-br from-[#2499F2]/5 to-[#28C8C0]/5 dark:from-[#2499F2]/8 dark:to-[#28C8C0]/8 p-4 space-y-4 text-start">

      {/* رأس القسم */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2499F2] to-[#28C8C0] flex items-center justify-center shadow-md shadow-[#2499F2]/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-black text-slate-900 dark:text-white">
              {isRtl ? 'تحليل الذكاء الاصطناعي' : 'AI Analysis'}
            </span>
            <span className="ms-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/30">
              {t('ai_analyzer.supervisor_badge', 'مقترح — يحتاج مراجعة أكاديمية')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span>{analysis.model_id}</span>
          <span>·</span>
          <span>{Math.round((analysis.analysis_confidence || 0) * 100)}% {t('ai_analyzer.confidence_label', 'ثقة')}</span>
        </div>
      </div>

      {/* تحذير المشرف */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
        <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
          {isRtl ? analysis.disclaimer_ar : analysis.disclaimer_en}
        </p>
      </div>

      {/* الملخص التقني */}
      {(analysis.technical_summary_ar || analysis.technical_summary_en) && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#2499F2]" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {t('ai_analyzer.section_summary', 'الملخص التقني')}
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white/50 dark:bg-white/5 rounded-xl p-3 border border-white/80 dark:border-white/10">
            {isRtl ? analysis.technical_summary_ar : analysis.technical_summary_en}
          </p>
        </div>
      )}

      {/* مستوى التعقيد */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#2499F2]" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {t('ai_analyzer.section_complexity', 'مستوى التعقيد')}
          </span>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colorMap[cfg.color]}`}>
          <Zap className="w-3 h-3" />
          {isRtl ? cfg.label_ar : cfg.label_en}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed ps-1">
          {isRtl ? analysis.complexity_explanation_ar : analysis.complexity_explanation_en}
        </p>
      </div>

      {/* المخرجات المتوقعة */}
      {analysis.expected_deliverables && analysis.expected_deliverables.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#28C8C0]" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {t('ai_analyzer.section_deliverables', 'المخرجات المتوقعة')}
            </span>
          </div>
          <ul className="space-y-1.5">
            {analysis.expected_deliverables.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#28C8C0] shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* محرر المهارات المقترحة */}
      <SuggestedSkillsEditor
        suggested={analysis.suggested_skills || []}
        onApply={onUpdateSkills}
        isRtl={isRtl}
      />

      {/* أسباب المهارات */}
      <SkillReasonsAccordion
        explanations={analysis.skill_explanations}
        isRtl={isRtl}
      />
    </div>
  );
}
