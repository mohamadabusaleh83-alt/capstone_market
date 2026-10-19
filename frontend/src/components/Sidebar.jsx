import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Briefcase,
  Plus,
  Compass,
  Users,
  Store,
  Send,
  BarChart3,
  CheckCircle2,
  ShieldCheck,
  GraduationCap
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
    setIsCreateModalOpen,
    setShowApplicationsModal,
    getRoleLabel
  } = useApp();

  if (!currentUser) return null;

  const pendingCount = applications.filter((app) => app.status === 'pending').length;
  const pendingProjectsCount = rawProjects.filter((p) => p.status === 'pending').length;
  const myApplicationsCount = applications.filter((a) => a.student_id === currentUser?.id).length;

  const closeSidebarOnMobile = () => {
    setIsSidebarOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
      isActive
        ? 'bg-gradient-to-r from-[#2499F2] to-[#1D7BC3] text-white shadow-md shadow-[#2499F2]/25 font-bold'
        : 'text-slate-600 dark:text-slate-300 hover:bg-[#F4F8FC] dark:hover:bg-[#152550] hover:text-[#101E42] dark:hover:text-white'
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

      {/* القائمة الجانبية: متوافقة تماماً مع Navy الفخم (#101E42) وتباين ناعم للحدود و RTL/LTR */}
      <aside
        className={`
          fixed top-16 bottom-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} z-30 w-64 bg-white dark:bg-[#101E42] border-slate-200 dark:border-[#2499F2]/20 p-4 
          overflow-y-auto flex flex-col justify-between transition-all duration-300 ease-in-out shadow-sm dark:shadow-2xl
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
            className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-[#152550]/60 hover:bg-slate-100 dark:hover:bg-[#152550] border border-slate-200/80 dark:border-[#2499F2]/20 cursor-pointer hover:scale-102 transition-all duration-200 select-none group mb-2"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#0B152E] border border-slate-200 dark:border-[#2499F2]/30 flex items-center justify-center shadow-md shadow-[#2499F2]/10 dark:shadow-[#2499F2]/20 overflow-hidden shrink-0 group-hover:border-[#2499F2]/60 transition-colors">
              <img src="/logo.svg" alt={t('nav.platform_title')} className="w-6 h-6 object-contain" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white tracking-wide block leading-tight truncate group-hover:text-[#2499F2] dark:group-hover:text-[#28C8C0] transition-colors">
                {t('nav.platform_title')}
              </span>
              <span className="text-[10px] text-[#2499F2] dark:text-[#28C8C0] font-mono block truncate">
                {t('nav.platform_version')}
              </span>
            </div>
          </Link>

          {/* بطاقة الحساب النشط */}
          <div className="p-3 bg-slate-50 dark:bg-[#152550] border border-slate-200/80 dark:border-[#2499F2]/20 rounded-xl mb-4 shadow-sm">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">{t('nav.active_account')}</span>
            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
              {currentUser.role === 'company' ? (
                <Store className="w-3.5 h-3.5 text-[#2499F2] dark:text-[#28C8C0] shrink-0" />
              ) : currentUser.role === 'supervisor' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
              ) : (
                <GraduationCap className="w-3.5 h-3.5 text-[#28C8C0] dark:text-[#77DCC1] shrink-0" />
              )}
              {currentUser.name}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
              {getRoleLabel(currentUser.role)}
            </span>
          </div>

          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase px-2 tracking-wider">
            {t('nav.dashboard_title')}
          </p>

          {/* 1. القائمة الجانبية المخصصة لدور الطالب (student) */}
          {currentUser.role === 'student' && (
            <div className="space-y-1.5">
              {/* الرئيسية (Dashboard) */}
              <NavLink
                to="/dashboard"
                onClick={closeSidebarOnMobile}
                className={navLinkClass}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
                  <span>{t('sidebar.dashboard', 'الرئيسية')}</span>
                </div>
              </NavLink>

              {/* مشروعي / إضافة مشروع (My Projects) */}
              <div className="relative flex items-center">
                <NavLink
                  to="/dashboard#my-project"
                  onClick={closeSidebarOnMobile}
                  className={navLinkClass}
                >
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4 text-[#28C8C0] dark:text-[#77DCC1]" />
                    <span>{t('sidebar.student_my_project', 'مشروعي / إضافة مشروع')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsCreateModalOpen(true);
                      closeSidebarOnMobile();
                    }}
                    title={isRtl ? 'إضافة / اقتراح مشروع تخرج' : 'Add / Propose Project'}
                    className="w-5 h-5 rounded-md bg-[#2499F2]/15 text-[#2499F2] dark:text-[#77DCC1] hover:bg-[#2499F2] hover:text-white flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </NavLink>
              </div>

              {/* استكشف المشاريع (Explore Projects) */}
              <NavLink
                to="/?tab=browse"
                onClick={closeSidebarOnMobile}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isActive && (window.location.search.includes('tab=browse') || (!window.location.search && window.location.pathname === '/'))
                      ? 'bg-gradient-to-r from-[#2499F2] to-[#1D7BC3] text-white shadow-md shadow-[#2499F2]/25 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-[#F4F8FC] dark:hover:bg-[#152550] hover:text-[#101E42] dark:hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
                  <span>{t('sidebar.student_explore', 'استكشف المشاريع')}</span>
                </div>
                <span className="text-[10px] bg-[#2499F2]/10 dark:bg-[#2499F2]/20 border border-[#2499F2]/30 px-1.5 py-0.5 rounded text-[#2499F2] dark:text-[#77DCC1] font-semibold">
                  {rawProjects.length}
                </span>
              </NavLink>

              {/* طلبات التعاون (Collaboration Requests) */}
              <button
                type="button"
                onClick={() => {
                  setShowApplicationsModal(true);
                  closeSidebarOnMobile();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#152550] hover:bg-slate-200 dark:hover:bg-[#182b5c] text-slate-700 dark:text-slate-200 transition cursor-pointer border border-slate-200/80 dark:border-[#2499F2]/20 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#28C8C0] dark:text-[#77DCC1]" />
                  <span>{t('sidebar.student_collaboration', 'طلبات التعاون')}</span>
                </div>
                <span className="bg-[#2499F2] text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                  {myApplicationsCount > 0 ? myApplicationsCount : 3}
                </span>
              </button>
            </div>
          )}

          {/* 2. القائمة الجانبية المخصصة لدور الشركة (company) */}
          {currentUser.role === 'company' && (
            <div className="space-y-1.5">
              {/* الرئيسية (Dashboard) */}
              <NavLink
                to="/dashboard"
                onClick={closeSidebarOnMobile}
                className={navLinkClass}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
                  <span>{t('sidebar.dashboard', 'الرئيسية')}</span>
                </div>
              </NavLink>

              {/* استكشاف المشاريع وسوق التخرج (Explore & Market) */}
              <NavLink
                to="/?tab=browse"
                onClick={closeSidebarOnMobile}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isActive && (window.location.search.includes('tab=browse') || (!window.location.search && window.location.pathname === '/'))
                      ? 'bg-gradient-to-r from-[#2499F2] to-[#1D7BC3] text-white shadow-md shadow-[#2499F2]/25 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-[#F4F8FC] dark:hover:bg-[#152550] hover:text-[#101E42] dark:hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
                  <span>{t('sidebar.company_explore_market', 'استكشاف المشاريع وسوق التخرج')}</span>
                </div>
                <span className="text-[10px] bg-[#2499F2]/10 dark:bg-[#2499F2]/20 border border-[#2499F2]/30 px-1.5 py-0.5 rounded text-[#2499F2] dark:text-[#77DCC1] font-semibold">
                  {rawProjects.length}
                </span>
              </NavLink>

              {/* طلبات التعاون المرسلة (Sent Requests) */}
              <button
                type="button"
                onClick={() => {
                  setShowApplicationsModal(true);
                  closeSidebarOnMobile();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[#152550] hover:bg-slate-200 dark:hover:bg-[#182b5c] text-slate-700 dark:text-slate-200 transition cursor-pointer border border-slate-200/80 dark:border-[#2499F2]/20 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-[#28C8C0] dark:text-[#77DCC1]" />
                  <span>{t('sidebar.company_sent_requests', 'طلبات التعاون المرسلة')}</span>
                </div>
                {pendingCount > 0 ? (
                  <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                    {pendingCount}
                  </span>
                ) : (
                  <span className="bg-[#2499F2]/20 text-[#2499F2] dark:text-[#77DCC1] text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {applications.length}
                  </span>
                )}
              </button>

              {/* تحليلات السوق والمهارات (Market Insights) */}
              <NavLink
                to="/dashboard#market-insights"
                onClick={closeSidebarOnMobile}
                className={navLinkClass}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-[#77DCC1]" />
                  <span>{t('sidebar.company_market_insights', 'تحليلات السوق والمهارات')}</span>
                </div>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-[#77DCC1] px-1.5 py-0.5 rounded font-mono font-bold">
                  Live
                </span>
              </NavLink>
            </div>
          )}

          {/* 3. القائمة الجانبية المخصصة لدور المشرف الأكاديمي (supervisor) */}
          {currentUser.role === 'supervisor' && (
            <div className="space-y-1.5">
              {/* الرئيسية (Dashboard) */}
              <NavLink
                to="/dashboard"
                onClick={closeSidebarOnMobile}
                className={navLinkClass}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
                  <span>{t('sidebar.dashboard', 'الرئيسية')}</span>
                </div>
              </NavLink>

              {/* مراجعة واعتماد المشاريع (Project Review) */}
              <NavLink
                to="/approvals"
                onClick={closeSidebarOnMobile}
                className={navLinkClass}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#28C8C0] dark:text-[#77DCC1]" />
                  <span>{t('sidebar.supervisor_project_review', 'مراجعة واعتماد المشاريع')}</span>
                </div>
                {pendingProjectsCount > 0 && (
                  <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold shadow-sm">
                    {pendingProjectsCount}
                  </span>
                )}
              </NavLink>

              {/* المشاريع الإشرافية والفرق (Supervised Teams) */}
              <NavLink
                to="/teams"
                onClick={closeSidebarOnMobile}
                className={navLinkClass}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>{t('sidebar.supervisor_teams', 'المشاريع الإشرافية والفرق')}</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                  {isRtl ? 'شُعبة 1' : 'Sec 1'}
                </span>
              </NavLink>
            </div>
          )}
        </div>

        {/* مؤشر حالة الاتصال بالسيرفر في أسفل القائمة */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-[#2499F2]/20 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>{t('nav.connection_status')}</span>
            <span className="text-[#28C8C0] dark:text-[#77DCC1] font-semibold">{t('nav.connected_server')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t('nav.projects_on_server')}</span>
            <span className="text-slate-900 dark:text-white font-mono font-bold">{rawProjects.length}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
