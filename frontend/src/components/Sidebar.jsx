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
  BarChart3,
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
    rawProjects,
    applications,
    setIsCreateModalOpen,
    unreadNotificationsCount,
    getRoleLabel
  } = useApp();

  if (!currentUser) return null;

  const pendingCount = applications.filter((app) => app.status === 'pending').length;
  const pendingProjectsCount = rawProjects.filter((p) => p.status === 'pending').length;
  const myApplicationsCount = applications.filter((a) => a.student_id === currentUser?.id).length;

  const closeSidebarOnMobile = () => {
    setIsSidebarOpen(false);
  };

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

  return (
    <>
      {/* خلفية معتمة على الموبايل */}
      {isSidebarOpen && (
        <div
          onClick={closeSidebarOnMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* القائمة الجانبية: تبدأ من الأعلى مباشرة (justify-start) مع حشوة مدمجة ومتناسقة وبدون شريط تمرير داخلي بارز */}
      <aside
        className={`
          fixed top-0 bottom-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} z-50 w-72 md:w-64 bg-white dark:bg-[#101E42] border-slate-300/80 dark:border-[#2499F2]/20 pt-3 pb-3 px-3 
          overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col justify-start transition-all duration-300 ease-in-out shadow-2xl
          md:static md:top-auto md:bottom-auto md:h-full md:max-h-[calc(100vh-4rem)] md:z-auto
          ${isSidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="space-y-2">
          {/* ترويسة رئيسية للشعار واسم المنصة تظهر فقط على الموبايل داخل الدرج الجانبي لتجنب التكرار على الديسكتوب */}
          <div className="flex items-center justify-between gap-2 mb-2 md:hidden">
            <Link
              to="/"
              onClick={closeSidebarOnMobile}
              title={t('nav.back_home')}
              className="flex-1 flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-[#152550]/60 hover:bg-slate-100 dark:hover:bg-[#152550] border border-slate-200/80 dark:border-[#2499F2]/20 cursor-pointer hover:scale-102 transition-all duration-200 select-none group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#0B152E] border border-slate-200 dark:border-[#2499F2]/30 flex items-center justify-center shadow-md shadow-[#2499F2]/10 dark:shadow-[#2499F2]/20 overflow-hidden shrink-0 group-hover:border-[#2499F2]/60 transition-colors">
                <img src="/logo.svg" alt="Capstone Market" className="w-6 h-6 object-contain" />
              </div>
              <div className="min-w-0">
                <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white tracking-wide block leading-tight truncate group-hover:text-[#2499F2] dark:group-hover:text-[#28C8C0] transition-colors">
                  سوق مشاريع التخرج
                </span>
                <span className="text-[10px] text-[#2499F2] dark:text-[#28C8C0] font-sans font-semibold block truncate">
                  Capstone Market
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={closeSidebarOnMobile}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#152550] border border-transparent hover:border-slate-200 dark:hover:border-[#2499F2]/30 transition md:hidden cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

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
                  {myApplicationsCount > 0 ? myApplicationsCount : 2}
                </span>
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
              {/* 1. الرئيسية (لوحة الأعمال والشراكات) */}
              <NavLink to="/dashboard" onClick={closeSidebarOnMobile} className={navLinkClass}>
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
                  <span>{isRtl ? 'الرئيسية (لوحة الأعمال والشراكات)' : 'Dashboard (B2B Hub)'}</span>
                </div>
              </NavLink>

              {/* 2. استكشاف المشاريع وسوق التخرج */}
              <NavLink to="/projects" onClick={closeSidebarOnMobile} className={navLinkClass}>
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
                  <span>{isRtl ? 'استكشاف المشاريع وسوق التخرج' : 'Explore Capstone Market'}</span>
                </div>
                <span className="text-[10px] bg-[#2499F2]/10 dark:bg-[#2499F2]/20 border border-[#2499F2]/30 px-1.5 py-0.5 rounded text-[#2499F2] dark:text-[#77DCC1] font-semibold">
                  {rawProjects.length}
                </span>
              </NavLink>

              {/* 3. فرص التعاون المنشورة (إدارة التحديات الخاصة بالشركة) */}
              <NavLink to="/company/opportunities" onClick={closeSidebarOnMobile} className={navLinkClass}>
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-[#2499F2]" />
                  <span>{isRtl ? 'فرص التعاون المنشورة' : 'Posted Opportunities'}</span>
                </div>
              </NavLink>

              {/* 4. طلبات التعاون الواردة والمرسلة */}
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

              {/* 5. المشاريع المحفوظة (المفضلة) */}
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
      </aside>
    </>
  );
}
