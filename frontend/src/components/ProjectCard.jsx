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
    translateDifficulty
  } = useApp();

  const isFav = favorites.includes(project.id);
  const isAlreadyApplied = applications.some(
    (a) => a.project_id === project.id && a.student_id === currentUser?.id
  );
  const isFull =
    (project.availableSeats !== undefined && project.availableSeats <= 0) ||
    (project.currentMembers || 0) >= (project.maxMembers || 4);
  const isRejected = project.status === 'rejected';

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
            {translateMajor(project.category)}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                project.matchRate >= 60
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              }`}
            >
              {project.match}
            </span>
            <button
              type="button"
              onClick={() => toggleFavorite(project.id)}
              className={`p-1 rounded-md border transition cursor-pointer ${
                isFav
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={isFav ? t('nav.favorites') : 'Favorite'}
            >
              <Star className="w-3.5 h-3.5" fill={isFav ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* شارات الحالة وسعة المقاعد */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              project.status === 'approved'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                : project.status === 'rejected'
                  ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                  : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
            }`}
          >
            {project.status === 'approved'
              ? t('projects.status_approved_badge')
              : project.status === 'rejected'
                ? t('projects.status_rejected_badge')
                : t('projects.status_pending_badge')}
          </span>

          <span className="text-[10px] text-slate-400 font-mono">
            {t('projects.seats_count', {
              current: project.currentMembers,
              max: project.maxMembers
            })}
          </span>
        </div>

        {/* مؤشر تقدم المقاعد */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mb-3">
          <div
            className={`h-full rounded-full ${isFull ? 'bg-rose-500' : 'bg-emerald-500'}`}
            style={{
              width: `${Math.min(
                100,
                ((project.currentMembers || 0) / (project.maxMembers || 4)) * 100
              )}%`
            }}
          />
        </div>

        <h3 className="font-bold text-sm mb-2 text-white group-hover:text-blue-400 transition-colors">
          {project.title}
        </h3>

        <p className="text-xs text-slate-400 line-clamp-3 mb-3 leading-relaxed">
          {project.description}
        </p>

        <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3 bg-slate-800/40 p-2 rounded-lg">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-blue-400" /> {translateDifficulty(project.difficulty)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />{' '}
            {t('projects.hours_per_week', { hours: project.hoursPerWeek })}
          </span>
        </div>

        <div className="space-y-2 mb-4 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-medium text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> {t('projects.skills_analysis')}
            </span>
            <span className="text-emerald-400 font-bold">
              {t('projects.skills_available', { count: project.matchedSkills?.length || 0 })}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {project.matchedSkills &&
              project.matchedSkills.map((skill, idx) => (
                <span
                  key={`m-${idx}`}
                  className="text-[10px] bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-md flex items-center gap-1"
                >
                  ✓ {skill}
                </span>
              ))}

            {project.missingSkills &&
              project.missingSkills.map((skill, idx) => (
                <span
                  key={`mis-${idx}`}
                  className="text-[10px] bg-rose-950/40 text-rose-300 border border-rose-800/50 px-2 py-0.5 rounded-md flex items-center gap-1"
                >
                  ⚠️ {t('projects.missing_skill', { skill })}
                </span>
              ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
        {currentUser?.role === 'student' ? (
          <button
            type="button"
            disabled={isFull || isAlreadyApplied || isRejected}
            onClick={() => {
              setSelectedProject(project);
              setIsApplyModalOpen(true);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold shadow-md transition flex items-center justify-center gap-1.5 ${
              isAlreadyApplied
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 cursor-not-allowed'
                : isRejected
                  ? 'bg-rose-950/60 text-rose-400 border border-rose-900 cursor-not-allowed'
                  : isFull
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 cursor-pointer'
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
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            {t('projects.view_applications')}
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveChatProject(project)}
          title={t('projects.chat_tooltip')}
          className="p-2 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
