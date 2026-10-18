import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Store,
  ShieldCheck,
  GraduationCap,
  Clock,
  CheckCircle2,
  CheckCircle,
  Briefcase,
  Users,
  FileText,
  Sparkles,
  Search,
  Star
} from 'lucide-react';

export default function Sidebar() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    isRtl,
    isSidebarOpen,
    setIsSidebarOpen,
    rawProjects,
    applications,
    favorites,
    studentsList,
    setShowApplicationsModal,
    getRoleLabel
  } = useApp();

  if (!currentUser) return null;

  const pendingCount = applications.filter((app) => app.status === 'pending').length;
  const pendingProjectsCount = rawProjects.filter((p) => p.status === 'pending').length;

  const closeSidebarOnMobile = () => {
    setIsSidebarOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <>
      {/* خلفية معتمة على الموبايل تبدأ من top-16 وزاوية z-20 لتكون أسفل الهيدر تماماً */}
      {isSidebarOpen && (
        <div
          onClick={closeSidebarOnMobile}
          className="fixed inset-x-0 top-16 bottom-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
        />
      )}

      {/* القائمة الجانبية: متوافقة تماماً مع RTL و LTR */}
      <aside
        className={`
          fixed top-16 bottom-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} z-30 w-64 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 
          overflow-y-auto flex flex-col justify-between transition-all duration-300 ease-in-out shadow-sm dark:shadow-none
          md:static md:top-auto md:bottom-auto md:h-auto md:z-auto
          ${isSidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="space-y-3">
          {/* الشعار واسم المنصة في القائمة الجانبية مع التوجيه للرئيسية */}
          <Link
            to="/"
            onClick={closeSidebarOnMobile}
            title={t('nav.back_home')}
            className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/40 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 cursor-pointer hover:scale-105 transition-transform duration-200 select-none group mb-2"
          >
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-cyan-500/30 flex items-center justify-center shadow-md shadow-cyan-500/10 dark:shadow-cyan-500/20 overflow-hidden shrink-0 group-hover:border-cyan-500/60 transition-colors">
              <img src="/logo.svg" alt={t('nav.platform_title')} className="w-6 h-6 object-contain" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white tracking-wide block leading-tight truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {t('nav.platform_title')}
              </span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono block truncate">
                {t('nav.platform_version')}
              </span>
            </div>
          </Link>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl mb-4 shadow-sm">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">{t('nav.active_account')}</span>
            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
              {currentUser.role === 'company' ? (
                <Store className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              ) : currentUser.role === 'supervisor' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
              ) : (
                <GraduationCap className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
              )}
              {currentUser.name}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
              {getRoleLabel(currentUser.role)}
            </span>
          </div>

          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase px-2">{t('nav.dashboard_title')}</p>

          {/* روابط خاصة بالتقارير للمشرف والطلاب */}
          {currentUser.role !== 'company' && (
            <NavLink
              to="/reports"
              onClick={closeSidebarOnMobile}
              className={navLinkClass}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400" />
                {t('nav.reports_hub')}
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                {t('nav.tuesday')}
              </span>
            </NavLink>
          )}

          {/* روابط المشرف الأكاديمي */}
          {currentUser.role === 'supervisor' && (
            <>
              <NavLink
                to="/teams"
                onClick={closeSidebarOnMobile}
                className={navLinkClass}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  {t('nav.supervisor_teams')}
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                  {t('nav.section_1')}
                </span>
              </NavLink>

              <NavLink
                to="/approvals"
                onClick={closeSidebarOnMobile}
                className={navLinkClass}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {t('nav.supervisor_projects_review')}
                </div>
                {pendingProjectsCount > 0 && (
                  <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full font-bold">
                    {t('nav.pending_badge', { count: pendingProjectsCount })}
                  </span>
                )}
              </NavLink>

              <button
                type="button"
                onClick={() => {
                  setShowApplicationsModal(true);
                  closeSidebarOnMobile();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700/60 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  {t('nav.manage_applications')}
                </div>
                {pendingCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
            </>
          )}

          {/* روابط الشريك الصناعي / الشركة */}
          {currentUser.role === 'company' && (
            <>
              <NavLink
                to="/dashboard"
                onClick={closeSidebarOnMobile}
                className={navLinkClass}
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  {t('nav.company_projects')}
                </div>
              </NavLink>

              <button
                type="button"
                onClick={() => {
                  setShowApplicationsModal(true);
                  closeSidebarOnMobile();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700/60 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  {t('nav.company_applicants')}
                </div>
                {pendingCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
            </>
          )}

          {/* روابط الطالب الخريج */}
          {currentUser.role === 'student' && (
            <>
              <NavLink
                to="/cv"
                onClick={closeSidebarOnMobile}
                className={navLinkClass}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  {t('nav.student_cv')}
                </div>
              </NavLink>

              <NavLink
                to="/teams"
                onClick={closeSidebarOnMobile}
                className={navLinkClass}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  {t('nav.teams_hub')}
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                  {t('nav.free_students', { count: studentsList.filter((s) => s.isFree).length })}
                </span>
              </NavLink>
            </>
          )}

          {/* روابط المشاريع العامة */}
          <NavLink
            to="/?tab=match"
            onClick={closeSidebarOnMobile}
            className={({ isActive }) =>
              `w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                isActive && (!window.location.search || window.location.search.includes('tab=match'))
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              {t('nav.smart_match')}
            </div>
            <span className="text-[10px] bg-blue-500/15 dark:bg-blue-500/20 border border-blue-400/30 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-200 font-semibold">
              AI
            </span>
          </NavLink>

          <NavLink
            to="/?tab=browse"
            onClick={closeSidebarOnMobile}
            className={({ isActive }) =>
              `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                isActive && window.location.search.includes('tab=browse')
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            {t('nav.browse_all')}
          </NavLink>

          <NavLink
            to="/?tab=favorites"
            onClick={closeSidebarOnMobile}
            className={({ isActive }) =>
              `w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                isActive && window.location.search.includes('tab=favorites')
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              {t('nav.favorites')}
            </div>
            {favorites.length > 0 && (
              <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-bold">
                {favorites.length}
              </span>
            )}
          </NavLink>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <div>
            {t('nav.connection_status')} <span className="text-emerald-500 dark:text-emerald-400 font-semibold">{t('nav.connected_server')}</span>
          </div>
          <div>
            {t('nav.projects_on_server')} <span className="text-slate-900 dark:text-white font-mono">{rawProjects.length}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
