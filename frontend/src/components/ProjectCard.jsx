import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Star,
  Layers,
  Clock,
  Sparkles,
  ArrowUpRight,
  Users,
  MessageSquare
} from 'lucide-react';

export default function ProjectCard({ project }) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    favorites,
    toggleFavorite,
    applications,
    setSelectedProject,
    setIsApplyModalOpen,
    setActiveChatProject,
    setShowApplicationsModal,
    translateMajor,
    translateDifficulty,
    isRtl
  } = useApp();

  const isFav = favorites.includes(project.id);
  const isAlreadyApplied = applications.some(
    (a) => a.project_id === project.id && a.student_id === currentUser?.id
  );
  
  const currentMembers = project.currentMembers || 0;
  const maxMembers = project.maxMembers || 4;
  const isFull =
    (project.availableSeats !== undefined && project.availableSeats <= 0) ||
    currentMembers >= maxMembers;
  const remainingSeats = Math.max(0, maxMembers - currentMembers);
  const isRejected = project.status === 'rejected';

  // حساب نسبة التطابق والتوهج
  const matchRate = project.matchRate || 0;
  const matchColor =
    matchRate >= 80
      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
      : matchRate >= 50
        ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
        : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

  return (
    <div className="bg-white dark:bg-slate-900/90 hover:bg-slate-50/50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl dark:hover:shadow-blue-950/20 group relative overflow-hidden shadow-sm dark:shadow-none">
      {/* خلفية جمالية خفيفة عند التحويم */}
      <div className="absolute -top-12 -end-12 w-32 h-32 bg-cyan-500/5 dark:bg-blue-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 dark:group-hover:bg-blue-500/10 transition-all duration-500 pointer-events-none" />

      <div>
        {/* الترويسة: التخصص + شارة المطابقة الذكية المتوهجة + المفضلة */}
        <div className="flex items-center justify-between mb-3.5 gap-2">
          <span className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/70 truncate max-w-[170px]">
            {translateMajor(project.category)}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            {/* شارة المطابقة الذكية الدائرية المتوهجة */}
            <div
              className={`flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full border transition-transform duration-200 group-hover:scale-105 ${matchColor}`}
              title={isRtl ? `نسبة التطابق مع مهاراتك: ${matchRate}%` : `Skill match rate: ${matchRate}%`}
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse shrink-0 text-cyan-600 dark:text-amber-400" />
              <span>{matchRate}%</span>
              <span className="text-[9px] font-bold opacity-80 uppercase tracking-wider">
                {isRtl ? 'تطابق' : 'Match'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => toggleFavorite(project.id)}
              className={`p-1.5 rounded-lg border transition-all duration-200 cursor-pointer active:scale-90 ${
                isFav
                  ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-500 dark:text-amber-400 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={isFav ? t('nav.favorites') : 'Favorite'}
              aria-label="Toggle Favorite"
            >
              <Star className="w-3.5 h-3.5" fill={isFav ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* شارة الحالة وسعة المقاعد مع شارة الاكتمال */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              project.status === 'approved'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                : project.status === 'rejected'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
            }`}
          >
            {project.status === 'approved'
              ? t('projects.status_approved_badge')
              : project.status === 'rejected'
                ? t('projects.status_rejected_badge')
                : t('projects.status_pending_badge')}
          </span>

          <div className="flex items-center gap-1.5">
            {isFull ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30 shadow-sm animate-pulse">
                {isRtl ? 'الفريق مكتمل' : 'Team Full'}
              </span>
            ) : (
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-mono font-semibold">
                {currentMembers}/{maxMembers} <span className="text-[10px] text-slate-500 dark:text-slate-400">({isRtl ? `${remainingSeats} متبقي` : `${remainingSeats} left`})</span>
              </span>
            )}
          </div>
        </div>

        {/* مؤشر تقدم المقاعد الأنيق */}
        <div className="w-full bg-slate-100 dark:bg-slate-800/90 rounded-full h-2 overflow-hidden mb-3.5 p-0.5 border border-slate-200 dark:border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFull
                ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400'
            }`}
            style={{
              width: `${Math.min(100, (currentMembers / maxMembers) * 100)}%`
            }}
          />
        </div>

        {/* عنوان ووصف المشروع */}
        <h3 className="font-bold text-sm mb-2 text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {project.title}
        </h3>

        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-3 leading-relaxed">
          {project.description}
        </p>

        {/* معطيات الصعوبة وساعات العمل */}
        <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300 mb-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <span className="flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-blue-400 shrink-0" />
            {translateDifficulty(project.difficulty)}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
            {t('projects.hours_per_week', { hours: project.hoursPerWeek })}
          </span>
        </div>

        {/* تحليل مطابقة المهارات */}
        <div className="space-y-2 mb-4 bg-slate-50/80 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
          <div className="flex justify-between items-center text-[10px]">
            <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-blue-400" />
              {t('projects.skills_analysis')}
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
              {t('projects.skills_available', { count: project.matchedSkills?.length || 0 })}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {project.matchedSkills &&
              project.matchedSkills.map((skill, idx) => (
                <span
                  key={`m-${idx}`}
                  className="text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all duration-150 hover:scale-105 cursor-default"
                >
                  <span className="text-[11px]">✓</span> {skill}
                </span>
              ))}

            {project.missingSkills &&
              project.missingSkills.map((skill, idx) => (
                <span
                  key={`mis-${idx}`}
                  className="text-[10px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all duration-150 hover:scale-105 cursor-default"
                >
                  <span className="text-[10px]">⚠️</span> {t('projects.missing_skill', { skill })}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* شريط الإجراءات السفلي */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800/80">
        {currentUser?.role === 'student' ? (
          <button
            type="button"
            disabled={isFull || isAlreadyApplied || isRejected}
            onClick={() => {
              setSelectedProject(project);
              setIsApplyModalOpen(true);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 ${
              isAlreadyApplied
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/60 cursor-not-allowed'
                : isRejected
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900 cursor-not-allowed'
                  : isFull
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20 hover:shadow-cyan-500/30 cursor-pointer'
            }`}
          >
            {isAlreadyApplied
              ? t('projects.already_applied')
              : isRejected
                ? t('projects.project_rejected')
                : isFull
                  ? t('projects.seats_full')
                  : t('projects.apply_button')}
            {!isFull && !isAlreadyApplied && !isRejected && <ArrowUpRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowApplicationsModal(true)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-95 shadow-sm"
          >
            <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-blue-400" />
            {t('projects.view_applications')}
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveChatProject(project)}
          title={t('projects.chat_tooltip')}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-cyan-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 hover:text-white transition-all duration-200 cursor-pointer border border-slate-200 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-blue-500 shadow-sm active:scale-90"
          aria-label={t('projects.chat_tooltip')}
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
