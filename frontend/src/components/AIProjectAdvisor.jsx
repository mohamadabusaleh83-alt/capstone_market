import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  Send,
  SlidersHorizontal,
  Info
} from 'lucide-react';

export default function AIProjectAdvisor() {
  const { currentUser } = useAuth();
  const {
    recommendedProjects = [],
    isLoadingRecommendations = false,
    fetchRecommendedProjects,
    userSkills = [],
    setShowSkillsModal,
    setSelectedProject,
    setIsApplyModalOpen,
    applications = [],
    isRtl
  } = useApp() || {};

  const [expandedCardId, setExpandedCardId] = useState(null);

  if (currentUser?.role !== 'student') {
    return null;
  }

  const toggleBreakdown = (id) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  const handleApply = (project) => {
    if (setSelectedProject && setIsApplyModalOpen) {
      setSelectedProject(project);
      setIsApplyModalOpen(true);
    }
  };

  return (
    <section className="space-y-5 my-8" id="ai-project-advisor" aria-label="AI Project Advisor">
      {/* 1. ترويسة قسم مستشار المشاريع بالذكاء الاصطناعي */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/10 via-[#2499F2]/10 to-[#28C8C0]/10 dark:from-[#152550] dark:via-[#13234b] dark:to-[#101E42] border border-[#2499F2]/25 rounded-3xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2499F2] to-[#28C8C0] flex items-center justify-center text-white shadow-md shadow-[#2499F2]/25">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {isRtl ? 'AI Project Advisor – مشاريع مرشحة لك' : 'AI Project Advisor – Recommended Projects'}
            </h2>
            <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#2499F2]/15 text-[#1875bb] dark:text-[#77DCC1] border border-[#2499F2]/30">
              {isRtl ? 'مطابقة ذكية شفافة' : 'Explainable AI Match'}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            {isRtl
              ? 'نظام الترشيح الذكي يحلل مهاراتك وسيرتك الأكاديمية باستخدام خوارزميات التماثل الدلالي (TF-IDF) لتقديم توصيات دقيقة ومفسرة لمشاريع التخرج المعتمدة.'
              : 'Our explainable AI engine scores projects against your skills, semantic profile, and academic major using multi-factor TF-IDF matching.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => fetchRecommendedProjects && fetchRecommendedProjects()}
            disabled={isLoadingRecommendations}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#101E42] border border-slate-300 dark:border-[#2499F2]/30 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#182b5c] shadow-xs active:scale-95 transition cursor-pointer disabled:opacity-50"
            title={isRtl ? 'إعادة حساب التوصيات وتحديث البيانات' : 'Recalculate AI Recommendations'}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#2499F2] ${isLoadingRecommendations ? 'animate-spin' : ''}`} />
            <span>{isRtl ? 'تحديث التوصيات' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSkillsModal && setShowSkillsModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#2499F2] to-[#1D7BC3] hover:from-[#1D7BC3] hover:to-[#17629c] text-white shadow-md shadow-[#2499F2]/25 active:scale-95 transition cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isRtl ? 'تعديل المهارات' : 'Edit Skills'}</span>
          </button>
        </div>
      </div>

      {/* 2. شريط المهارات النشطة للطالب للتأكيد البصري */}
      <div className="flex items-center justify-between gap-3 px-2 py-1 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0">
            {isRtl ? 'مهاراتك المسجلة:' : 'Your Skills:'}
          </span>
          {userSkills.length > 0 ? (
            userSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-[#152550] text-slate-700 dark:text-slate-200 border border-slate-300/60 dark:border-white/10 shrink-0"
              >
                {skill}
              </span>
            ))
          ) : (
            <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
              {isRtl ? 'لم تسجل أي مهارات بعد، أضف مهاراتك لتحسين دقة الترشيحات.' : 'No skills added yet. Add skills to refine recommendations.'}
            </span>
          )}
        </div>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 hidden sm:inline">
          {recommendedProjects.length} {isRtl ? 'مشاريع مرشحة' : 'Projects Recommended'}
        </span>
      </div>

      {/* 3. حالة التحميل (Skeleton Loading) */}
      {isLoadingRecommendations && recommendedProjects.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-6 space-y-4 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-24 bg-slate-200 dark:bg-white/10 rounded-md" />
                <div className="h-7 w-20 bg-slate-200 dark:bg-white/10 rounded-full" />
              </div>
              <div className="h-6 w-3/4 bg-slate-200 dark:bg-white/10 rounded-md" />
              <div className="h-14 w-full bg-slate-200 dark:bg-white/10 rounded-md" />
              <div className="h-10 w-full bg-slate-100 dark:bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* 4. حالة خلو التوصيات (Empty State) */}
      {!isLoadingRecommendations && recommendedProjects.length === 0 && (
        <div className="bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/25 rounded-3xl p-8 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isRtl ? 'لا توجد مشاريع مرشحة حالياً' : 'No Recommended Projects Available Yet'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            {isRtl
              ? 'تأكد من تحديد مهاراتك التقنية وتخصصك الأكاديمي في ملفك الشخصي لتشغيل نموذج المطابقة الذكي واقتراح أفضل مشاريع التخرج المناسبة لك.'
              : 'Add your skills and select your major to let the AI matcher recommend top matching capstone projects for you.'}
          </p>
          <button
            type="button"
            onClick={() => setShowSkillsModal && setShowSkillsModal(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-[#2499F2]/25 active:scale-95 cursor-pointer mt-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isRtl ? 'إضافة مهاراتك الآن' : 'Add Skills Now'}</span>
          </button>
        </div>
      )}

      {/* 5. شبكة بطاقات التوصيات الذكية (AI Recommendation Cards Grid) */}
      {recommendedProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recommendedProjects.map((rec) => {
            const score = Math.round(rec.match_score || 0);
            const breakdown = rec.score_breakdown || {};
            const isExpanded = expandedCardId === rec.id;
            const hasApplied = applications.some((a) => a.project_id === rec.id && String(a.student_id) === String(currentUser?.id));

            // تدرج ألوان نسبة التطابق الذكي
            const scoreBadgeStyle =
              score >= 80
                ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-900 dark:text-[#77DCC1] border-emerald-300 dark:border-[#28C8C0]/30'
                : score >= 60
                ? 'bg-blue-100 dark:bg-[#2499F2]/15 text-[#1875bb] dark:text-[#28C8C0] border-blue-300 dark:border-[#2499F2]/30'
                : 'bg-amber-100 dark:bg-amber-500/15 text-amber-900 dark:text-amber-400 border-amber-300 dark:border-amber-500/30';

            const scoreProgressColor =
              score >= 80 ? 'bg-gradient-to-r from-[#28C8C0] to-emerald-500' : score >= 60 ? 'bg-gradient-to-r from-[#2499F2] to-[#28C8C0]' : 'bg-gradient-to-r from-amber-500 to-orange-500';

            return (
              <div
                key={rec.id}
                className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-[#2499F2]/50 dark:hover:border-[#2499F2]/50 rounded-3xl p-5 shadow-sm hover:shadow-lg dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-3.5">
                  {/* الرأس: الفئة ونسبة التطابق الذكي */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#152550] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 truncate max-w-[140px]">
                      {rec.category || (isRtl ? 'مشروع تخرج' : 'Capstone')}
                    </span>

                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-xs ${scoreBadgeStyle}`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{score}% {isRtl ? 'تطابق' : 'Match'}</span>
                    </div>
                  </div>

                  {/* شريط نسبة التطابق البصري المصغر */}
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${scoreProgressColor}`}
                      style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                    />
                  </div>

                  {/* عنوان المشروع والجهة الراعية */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#2499F2] transition-colors" title={rec.title}>
                      {rec.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      {rec.company_name ? `🏢 ${rec.company_name}` : (isRtl ? '🎓 مقترح أكاديمي معتمد' : '🎓 Academic Project')}
                    </p>
                  </div>

                  {/* توافق التخصص الأكاديمي */}
                  {rec.major_compatible && (
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1875bb] dark:text-[#77DCC1] bg-blue-50 dark:bg-[#2499F2]/10 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-[#2499F2]/20">
                      <Award className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'متوافق مع تخصصك الأكاديمي' : 'Major Compatible'}</span>
                    </div>
                  )}

                  {/* وصف المشروع */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {rec.description || (isRtl ? 'لا يوجد وصف تفصيلي متاح للمشروع.' : 'No description provided.')}
                  </p>

                  {/* مهارات متوافقة (أخضر) ومهارات مطلوبة (برتقالي) */}
                  <div className="space-y-1.5 pt-1">
                    {/* المهارات المتوافقة */}
                    {Array.isArray(rec.matched_skills) && rec.matched_skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                          {isRtl ? 'متوفرة لديك:' : 'Matched:'}
                        </span>
                        {rec.matched_skills.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/15 text-emerald-900 dark:text-[#77DCC1] border border-emerald-300 dark:border-[#28C8C0]/30 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* المهارات الناقصة للتطوير */}
                    {Array.isArray(rec.missing_skills) && rec.missing_skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                          {isRtl ? 'فرص تطوير:' : 'To Learn:'}
                        </span>
                        {rec.missing_skills.slice(0, 2).map((s) => (
                          <span
                            key={s}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20"
                          >
                            + {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* التفسير العربي الذكي من المحرك (AI Dynamic Explanation) */}
                  {rec.ai_explanation && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#152550]/60 border border-slate-200 dark:border-white/5 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      <div className="flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#2499F2] shrink-0 mt-0.5" />
                        <span className="italic">{rec.ai_explanation}</span>
                      </div>
                    </div>
                  )}

                  {/* زر فتح تفاصيل النقاط (Score Breakdown Toggle) */}
                  <button
                    type="button"
                    onClick={() => toggleBreakdown(rec.id)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white pt-1 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#2499F2]" />
                      <span>{isRtl ? 'معايير التقييم وتفاصيل النقاط' : 'Score Breakdown & Weights'}</span>
                    </span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {/* المحتوى المنسدل لتفاصيل النقاط (Score Breakdown Accordion) */}
                  {isExpanded && (
                    <div className="p-3 bg-blue-50/50 dark:bg-[#13234b]/80 border border-blue-200/60 dark:border-[#2499F2]/20 rounded-2xl space-y-2 text-[10px] animate-fadeIn">
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                          <span>{isRtl ? 'المهارات المباشرة والمترادفة (50%):' : 'Explicit Skills (50%):'}</span>
                          <span>{breakdown.explicit_skill_score ?? 0}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2499F2] rounded-full" style={{ width: `${breakdown.explicit_skill_score ?? 0}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                          <span>{isRtl ? 'التشابه الدلالي TF-IDF (30%):' : 'Semantic Similarity (30%):'}</span>
                          <span>{breakdown.semantic_similarity_score ?? 0}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#28C8C0] rounded-full" style={{ width: `${breakdown.semantic_similarity_score ?? 0}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                          <span>{isRtl ? 'توافق التخصص الأكاديمي (10%):' : 'Major Alignment (10%):'}</span>
                          <span>{breakdown.major_compatibility_score ?? 0}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${breakdown.major_compatibility_score ?? 0}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                          <span>{isRtl ? 'اكتمال الملف وخبرة الطالب (10%):' : 'Profile Completeness (10%):'}</span>
                          <span>{breakdown.profile_completeness_score ?? 0}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${breakdown.profile_completeness_score ?? 0}%` }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* تذييل البطاقة: المقاعد المتبقية وأزرار الإجراءات */}
                <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-200 dark:border-white/5">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span>
                      {rec.remaining_seats ?? rec.available_seats ?? 4} {isRtl ? 'مقاعد متاحة' : 'Seats Left'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasApplied ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900 dark:text-[#77DCC1] bg-emerald-100 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-[#28C8C0]/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'تم التقديم' : 'Applied'}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApply(rec)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-[#2499F2] to-[#1D7BC3] hover:from-[#1D7BC3] hover:to-[#17629c] text-white px-3.5 py-1.5 rounded-xl shadow-xs active:scale-95 transition cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isRtl ? 'قدّم الآن' : 'Apply'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
