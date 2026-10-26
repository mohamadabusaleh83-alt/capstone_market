import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import {
  Bookmark,
  Star,
  Users,
  ChevronRight,
  Trash2,
  Send,
  Sparkles
} from 'lucide-react';

export default function SavedProjectsPage() {
  const { t } = useTranslation();
  const {
    isRtl,
    rawProjects = [],
    favorites: appFavorites = [],
    savedProjects: appSavedProjects = [],
    toggleFavorite = () => {},
    showToast = () => {}
  } = useApp() || {};

  const favorites = Array.isArray(appFavorites) ? appFavorites : (Array.isArray(appSavedProjects) ? appSavedProjects : []);

  // المشاريع المفضلة للمستخدم الحالي بنمط عزل صارم 100%
  const displayProjects = rawProjects.filter((p) => Array.isArray(favorites) && favorites.includes(p.id));

  const handleRemove = (e, id) => {
    e.stopPropagation();
    toggleFavorite(id);
    showToast(isRtl ? 'تمت إزالة المشروع من المحفوظات' : 'Project removed from saved', 'info');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* مسار التنقل والترويسة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2499F2]/20">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <Link to="/dashboard" className="hover:text-[#2499F2] transition">
              {t('sidebar.dashboard', 'الرئيسية')}
            </Link>
            <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              {isRtl ? 'المشاريع المحفوظة' : 'Saved Projects'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-[#2499F2]" />
            <span>{isRtl ? 'المشاريع المحفوظة والمفضلة لدى الشركة' : 'Saved & Shortlisted Projects'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'قائمة المشاريع المتميزة التي قمت بحفظها للمراجعة، التقييم، أو تقديم عروض الرعاية والاستقطاب.'
              : 'Review your shortlisted capstone projects for sponsorship, evaluation, and direct student outreach.'}
          </p>
        </div>

        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:opacity-95 text-[#101E42] font-black text-xs shadow-md shadow-[#2499F2]/20 transition cursor-pointer active:scale-95 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-[#101E42]" />
          <span>{isRtl ? 'استكشاف المزيد من المشاريع' : 'Explore More Projects'}</span>
        </Link>
      </div>

      {/* شبكة المشاريع المحفوظة */}
      {displayProjects.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#2499F2]/10 border border-[#2499F2]/20 text-[#2499F2] flex items-center justify-center mx-auto mb-3">
            <Star className="w-7 h-7 text-amber-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            {isRtl ? 'لا توجد مشاريع محفوظة حالياً' : 'No saved projects yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto leading-relaxed">
            {isRtl
              ? 'انقر على أيقونة النجمة أو زر الحفظ على بطاقة أي مشروع في سوق التخرج لحفظه هنا والرجوع إليه لاحقاً.'
              : 'Click the star icon or bookmark button on any capstone card to shortlist it here for quick access.'}
          </p>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-white font-bold text-xs shadow-md hover:opacity-95 transition"
          >
            <span>{isRtl ? 'تصفح المشاريع الآن ←' : 'Browse Projects Now →'}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayProjects.map((project) => (
            <div
              key={project.id}
              className="p-5 rounded-3xl bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#2499F2]/50 transition group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    ✓ {isRtl ? 'معتمد أكاديمياً' : 'Approved'}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, project.id)}
                    title={isRtl ? 'إزالة من المحفوظات' : 'Remove from saved'}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#2499F2] transition-colors">
                  {project.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.required_skills?.split(',').map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[#2499F2]/10 text-[#2499F2] dark:text-[#77DCC1] text-[10px] font-mono font-semibold"
                    >
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5 text-[#2499F2]" />
                  <span>{project.currentMembers || 2} طلاب</span>
                </div>

                <Link
                  to="/collaboration-requests"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] font-black text-xs shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'تقديم رعاية / تواصل' : 'Sponsor / Reach out'}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
