import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useNavigate } from 'react-router-dom';
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
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  Bell,
  User,
  Settings,
  Bookmark,
  FileSpreadsheet,
  Building2,
  Activity,
  LogOut,
  Sparkles,
  FileText,
  Info,
  X
} from 'lucide-react';

export default function Sidebar() {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const {
    isRtl,
    isSidebarOpen,
    setIsSidebarOpen,
    rawProjects = [],
    applications = [],
    favorites: appFavorites = [],
    savedProjects: appSavedProjects = [],
    setIsCreateModalOpen,
    unreadNotificationsCount,
    getRoleLabel
  } = useApp() || {};

  const favorites = Array.isArray(appFavorites)
    ? appFavorites
    : (Array.isArray(appSavedProjects) ? appSavedProjects : (currentUser?.saved_projects || []));

  if (!currentUser) return null;

  const pendingCount = applications.filter((app) => app.status === 'pending').length;
  const pendingProjectsCount = rawProjects.filter((p) => p.status === 'pending').length;
  const myApplicationsCount = applications.filter((a) => a.student_id === currentUser?.id).length;

  const closeSidebarOnMobile = () => {
    setIsSidebarOpen(false);
  };

  // منع تمرير محتوى الصفحة الخلفية أثناء فتح القائمة على الهواتف
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  const handleLogout = () => {
    closeSidebarOnMobile();
    logout();
    navigate('/login', { replace: true });
  };

  // العنصر النشط: تمييز بخلفية كحلية فاتحة مع خط جانبي وإضاءة تركوازية (#28C8C0)
  const navLinkClass = ({ isActive }) =>
    `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
      isActive
        ? 'bg-[#152550] border-s-4 border-[#28C8C0] text-white font-extrabold shadow-md shadow-[#28C8C0]/15'
        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#152550]/70 hover:text-slate-950 dark:hover:text-white font-semibold'
    }`;

  // محتوى القائمة المشترك بين الديسكتوب وشاشات الموبايل
  const renderSidebarBody = (isMobile = false) => (
    <>
      <div className="space-y-2">
        {/* بطاقة الحساب النشط الشخصية الموجزة والمرتبة */}
        <div className="p-2 sm:p-2.5 bg-slate-50 dark:bg-[#152550] border border-slate-200/80 dark:border-[#2499F2]/20 rounded-xl mb-2 shadow-xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/30 flex items-center justify-center shrink-0 shadow-xs">
            {currentUser.role === 'company' ? (
              <Store className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
            ) : currentUser.role === 'supervisor' ? (
              <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            ) : (
              <GraduationCap className="w-4 h-4 text-[#28C8C0] dark:text-[#77DCC1]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
              {currentUser.name}
            </p>
            <span className="text-[10px] text-[#2499F2] dark:text-[#28C8C0] font-semibold block truncate mt-0.5">
              {getRoleLabel(currentUser.role)}
            </span>
          </div>
        </div>

        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase px-2 tracking-wider">
          {t('nav.dashboard_title')}
        </p>

        {/* 1. مسارات دور الطالب (Student) */}
        {currentUser.role === 'student' && (
          <div className="space-y-1">
            <NavLink to="/dashboard" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
                <span>{t('sidebar.dashboard', 'الرئيسية')}</span>
              </div>
            </NavLink>

            <div className="relative flex items-center">
              <NavLink to="/my-projects" onClick={closeSidebarOnMobile} className={navLinkClass}>
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-[#28C8C0] dark:text-[#77DCC1]" />
                  <span>{isRtl ? 'مشروعي ومتابعة التخرج' : 'My Project & Progress'}</span>
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
                  className="w-5 h-5 rounded-md bg-[#2499F2]/20 text-[#2499F2] dark:text-[#77DCC1] hover:bg-[#2499F2] hover:text-white flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </NavLink>
            </div>

            <NavLink to="/projects" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
                <span>{t('sidebar.student_explore', 'استكشف المشاريع')}</span>
              </div>
              <span className="text-[10px] bg-[#2499F2]/10 dark:bg-[#2499F2]/20 border border-[#2499F2]/30 px-1.5 py-0.5 rounded text-[#2499F2] dark:text-[#77DCC1] font-semibold">
                {rawProjects.length}
              </span>
            </NavLink>

            <NavLink to="/collaboration-requests" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[#28C8C0] dark:text-[#77DCC1]" />
                <span>{isRtl ? 'طلبات التعاون والشراكات' : 'Collaboration Requests'}</span>
              </div>
              <span className="bg-[#2499F2] text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                {myApplicationsCount}
              </span>
            </NavLink>

            <NavLink to="/reports" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-cyan-500" />
                <span>{isRtl ? 'التقارير ومراحل التسليم' : 'Reports & Deliverables'}</span>
              </div>
            </NavLink>

            <NavLink to="/opportunities" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? 'فرص الشركات والرعاية' : 'Company Opportunities'}</span>
              </div>
              <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded">
                {isRtl ? 'جديد' : 'New'}
              </span>
            </NavLink>
          </div>
        )}

        {/* 2. مسارات دور الشركة (B2B Partner & Business) */}
        {currentUser.role === 'company' && (
          <div className="space-y-1">
            <NavLink to="/dashboard" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
                <span>{isRtl ? 'الرئيسية (لوحة الأعمال والشراكات)' : 'Dashboard (B2B Hub)'}</span>
              </div>
            </NavLink>

            <NavLink to="/projects" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
                <span>{isRtl ? 'استكشاف المشاريع وسوق التخرج' : 'Explore Capstone Market'}</span>
              </div>
              <span className="text-[10px] bg-[#2499F2]/10 dark:bg-[#2499F2]/20 border border-[#2499F2]/30 px-1.5 py-0.5 rounded text-[#2499F2] dark:text-[#77DCC1] font-semibold">
                {rawProjects.length}
              </span>
            </NavLink>

            <NavLink to="/company/opportunities" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-[#2499F2]" />
                <span>{isRtl ? 'فرص التعاون المنشورة' : 'Posted Opportunities'}</span>
              </div>
            </NavLink>

            <NavLink to="/reports" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-cyan-500" />
                <span>{isRtl ? 'التقارير ومراحل التسليم' : 'Reports & Deliverables'}</span>
              </div>
            </NavLink>

            <NavLink to="/collaboration-requests" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-[#28C8C0] dark:text-[#77DCC1]" />
                <span>{isRtl ? 'طلبات التعاون الواردة والمرسلة' : 'Collaboration Requests'}</span>
              </div>
              {pendingCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                  {pendingCount}
                </span>
              )}
            </NavLink>

            <NavLink to="/saved-projects" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Bookmark className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? 'المشاريع المحفوظة (المفضلة)' : 'Saved Projects'}</span>
              </div>
              {favorites.length > 0 && (
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded text-amber-500 font-semibold">
                  {favorites.length}
                </span>
              )}
            </NavLink>
          </div>
        )}

        {/* 3. مسارات دور المشرف الأكاديمي والإدارة (Supervisor & Management) */}
        {currentUser.role === 'supervisor' && (
          <div className="space-y-1">
            <NavLink to="/dashboard" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
                <span>{t('sidebar.dashboard', 'الرئيسية')}</span>
              </div>
            </NavLink>

            <NavLink to="/supervisor/reviews" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#28C8C0] dark:text-[#77DCC1]" />
                <span>{isRtl ? 'مراجعة واعتماد المشاريع' : 'Project Approvals'}</span>
              </div>
              {pendingProjectsCount > 0 && (
                <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold shadow-sm">
                  {pendingProjectsCount}
                </span>
              )}
            </NavLink>

            <NavLink to="/manage/projects" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-[#2499F2]" />
                <span>{isRtl ? 'إدارة وفهرسة المشاريع' : 'Manage Projects'}</span>
              </div>
            </NavLink>

            <NavLink to="/manage/students" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4 text-[#28C8C0]" />
                <span>{isRtl ? 'إدارة ومتابعة الطلاب' : 'Manage Students'}</span>
              </div>
            </NavLink>

            <NavLink to="/manage/companies" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? 'إدارة الشركات المعتمدة' : 'Accredited Companies'}</span>
              </div>
            </NavLink>

            <NavLink to="/manage/collaborations" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{isRtl ? 'الإشراف على التعاون' : 'Supervise Collaborations'}</span>
              </div>
            </NavLink>

            <NavLink to="/teams" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[#2499F2]" />
                <span>{isRtl ? 'المشاريع الإشرافية والفرق' : 'Supervised Teams'}</span>
              </div>
            </NavLink>

            <NavLink to="/supervisor/reports" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[#28C8C0]" />
                <span>{isRtl ? 'التقارير والتحليلات' : 'Reports & Analytics'}</span>
              </div>
            </NavLink>

            <NavLink to="/manage/logs" onClick={closeSidebarOnMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-rose-500" />
                <span>{isRtl ? 'سجل العمليات والنشاطات' : 'Activity Audit Log'}</span>
              </div>
            </NavLink>
          </div>
        )}
      </div>

      {/* روابط أسفل القائمة: إعدادات الحساب، عن المنصة، وزر تسجيل الخروج مثبتة في الأسفل عبر mt-auto */}
      <div className="mt-auto pt-2 border-t border-slate-300/80 dark:border-[#2499F2]/20 space-y-1">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase px-2 tracking-wider mb-1">
          {isRtl ? 'حسابي وإعداداتي' : 'Account & Tools'}
        </p>

        <NavLink to="/notifications" onClick={closeSidebarOnMobile} className={navLinkClass}>
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-[#2499F2]" />
            <span>{isRtl ? 'مركز الإشعارات' : 'Notifications'}</span>
          </div>
          {unreadNotificationsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </NavLink>

        <NavLink to="/profile" onClick={closeSidebarOnMobile} className={navLinkClass}>
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-[#28C8C0]" />
            <span>{currentUser?.role === 'company' ? (isRtl ? 'ملف الشركة' : 'Company Profile') : (isRtl ? 'الملف الشخصي' : 'Profile')}</span>
          </div>
        </NavLink>

        <NavLink to="/settings" onClick={closeSidebarOnMobile} className={navLinkClass}>
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-slate-400" />
            <span>{isRtl ? 'إعدادات الحساب' : 'Settings'}</span>
          </div>
        </NavLink>

        <NavLink to="/about" onClick={closeSidebarOnMobile} className={navLinkClass}>
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
            <span>{t('nav.about', isRtl ? 'عن المنصة' : 'About Platform')}</span>
          </div>
        </NavLink>

        {/* حالة الاتصال وزر تسجيل الخروج */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 space-y-1.5 mt-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 px-1 font-medium">
            <span>{t('nav.connection_status')}</span>
            <span className="text-emerald-700 dark:text-[#77DCC1] font-bold">{t('nav.connected_server')}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600/90 dark:hover:bg-rose-600/80 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition cursor-pointer active:scale-95 shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>{isRtl ? 'تسجيل الخروج' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* 1. الشريط الجانبي الثابت على الشاشات الكبيرة فقط (hidden md:flex) */}
      <aside
        className="hidden md:flex flex-col justify-start w-64 bg-white dark:bg-[#101E42] border-slate-300/80 dark:border-[#2499F2]/20 border-e h-full max-h-[calc(100vh-4rem)] pt-3 pb-3 px-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 select-none shadow-sm transition-colors duration-200"
        aria-label="Desktop Navigation"
      >
        {renderSidebarBody(false)}
      </aside>

      {/* 2. القائمة المنبثقة على الهواتف والأجهزة اللوحية الصغيرة (Mobile Drawer via Portal) */}
      {isSidebarOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className={`fixed inset-0 z-50 flex ${isRtl ? 'justify-end' : 'justify-start'} md:hidden`}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {/* خلفية معتمة تغلق القائمة عند النقر خارجها */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={closeSidebarOnMobile}
            aria-hidden="true"
          />

          {/* القائمة المنبثقة من جهة اليمين لتناسب اتجاه اللغة العربية */}
          <aside
            className={`relative z-10 w-72 max-w-[85vw] h-full bg-slate-900 border-slate-800 ${
              isRtl ? 'border-l' : 'border-r'
            } p-5 shadow-2xl flex flex-col justify-between overflow-y-auto`}
            aria-label="Mobile Navigation Drawer"
          >
            {/* ترويسة رئيسية للشعار واسم المنصة وزر الإغلاق (✕) بارز في أعلى زاوية القائمة */}
            <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800 shrink-0">
              <Link
                to="/"
                onClick={closeSidebarOnMobile}
                title={t('nav.back_home')}
                className="flex-1 flex items-center gap-2 p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 cursor-pointer transition select-none group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#0B152E] border border-[#2499F2]/30 flex items-center justify-center shrink-0">
                  <img src="/logo.svg" alt="Capstone Market" className="w-6 h-6 object-contain" />
                </div>
                <div className="min-w-0">
                  <span className="font-black text-xs text-white tracking-wide block leading-tight truncate">
                    سوق مشاريع التخرج
                  </span>
                  <span className="text-[10px] text-[#28C8C0] font-sans font-semibold block truncate">
                    Capstone Market
                  </span>
                </div>
              </Link>

              {/* زر إغلاق (✕) بارز في أعلى زاوية القائمة */}
              <button
                type="button"
                onClick={closeSidebarOnMobile}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition cursor-pointer active:scale-95 shrink-0"
                aria-label="إغلاق القائمة"
                title="إغلاق القائمة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-between overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {renderSidebarBody(true)}
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
}
