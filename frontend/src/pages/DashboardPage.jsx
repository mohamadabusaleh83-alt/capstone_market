import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Store,
  PlusCircle,
  RefreshCw,
  Users,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  FileText,
  Briefcase,
  Layers,
  Sparkles,
  PieChart,
  Star,
  Compass,
  Send,
  Check
} from 'lucide-react';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    rawProjects,
    fetchProjects,
    applications,
    setIsCreateModalOpen,
    setShowApplicationsModal,
    setShowSkillsModal,
    setActiveChatProject,
    updateProjectStatus,
    translateMajor,
    reportsTimeline,
    studentsList,
    userSkills,
    favorites,
    isRtl
  } = useApp();

  // المشاريع التي تخص الشركة الحالية
  const myCompanyProjects = useMemo(() => {
    return rawProjects.filter(
      (p) => p.created_by === currentUser?.id || currentUser?.role === 'company'
    );
  }, [rawProjects, currentUser]);

  const pendingApprovalsCount = rawProjects.filter((p) => p.status === 'pending').length;
  const myApplications = applications.filter((a) => a.student_id === currentUser?.id);

  // ==========================================
  // الحسابات الإحصائية الحية للوحة التحكم (Live Metrics)
  // ==========================================
  const totalProjects = rawProjects.length;
  const approvedProjects = rawProjects.filter((p) => p.status === 'approved').length;
  const pendingProjects = rawProjects.filter((p) => p.status === 'pending').length;

  const totalMaxSeats = rawProjects.reduce((acc, p) => acc + (p.maxMembers || 4), 0);
  const totalOccupiedSeats = rawProjects.reduce((acc, p) => acc + (p.currentMembers || 0), 0);
  const totalAvailableSeats = Math.max(0, totalMaxSeats - totalOccupiedSeats);
  const occupancyPercentage = totalMaxSeats > 0 ? Math.round((totalOccupiedSeats / totalMaxSeats) * 100) : 0;
  const vacantPercentage = Math.max(0, 100 - occupancyPercentage);

  const pendingApplicationsCount = applications.filter((a) => a.status === 'pending').length;

  // مشروع الطالب المعتمد أو المقترح
  const studentAssignedProject = useMemo(() => {
    if (currentUser?.role !== 'student') return null;
    const acceptedApp = applications.find(
      (a) => a.student_id === currentUser.id && a.status === 'accepted'
    );
    if (acceptedApp) {
      const proj = rawProjects.find((p) => p.id === acceptedApp.project_id);
      if (proj) return proj;
    }
    const myCreated = rawProjects.find((p) => p.created_by === currentUser.id);
    if (myCreated) return myCreated;

    // مشروع افتراضي مطابق لحساب الطالب في قاعدة البيانات
    return {
      id: 1,
      title: 'نظام إدارة المستودعات ونقاط البيع السحابي (POS)',
      description: 'منصة ويب متكاملة لإدارة نقاط البيع، المخزون، والفوترة السحابية للمتاجر والمؤسسات الصغيرة والمتوسطة.',
      category: 'أنظمة المعلومات الحاسوبية (CIS)',
      status: 'approved',
      currentMembers: 3,
      maxMembers: 4,
      skills: ['SQL', 'FastAPI', 'React', 'Docker'],
      supervisor: 'د. أسامة أمين مرعي'
    };
  }, [currentUser, applications, rawProjects]);

  // ==========================================
  // الرسم البياني 1: توزيع التقنيات الأكثر طلباً
  // ==========================================
  const techDistribution = useMemo(() => {
    const counts = {};
    rawProjects.forEach((p) => {
      const skills = Array.isArray(p.skills) && p.skills.length > 0
        ? p.skills
        : (typeof p.required_skills === 'string'
            ? p.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
            : ['Python', 'FastAPI']);

      skills.forEach((s) => {
        const key = s.trim();
        if (key) {
          counts[key] = (counts[key] || 0) + 1;
        }
      });
    });

    const colors = [
      'from-[#2499F2] to-[#1D7BC3]',
      'from-[#28C8C0] to-[#77DCC1]',
      'from-blue-600 to-indigo-600',
      'from-amber-500 to-orange-500',
      'from-teal-500 to-cyan-600'
    ];

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], idx) => ({
        name,
        count,
        percent: totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0,
        gradient: colors[idx % colors.length]
      }));
  }, [rawProjects, totalProjects]);

  // ==========================================
  // الرسم البياني 2: الدائرة التقدمية لنسبة الإشغال (Doughnut Progress)
  // ==========================================
  const circleRadius = 54;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (circleCircumference * occupancyPercentage) / 100;

  if (!currentUser) return null;

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* 1. ترويسة لوحة التحكم العصرية المخصصة حسب دور المستخدم */}
      <div className="relative overflow-hidden bg-gradient-to-r from-white via-[#F4F8FC] to-white dark:from-[#101E42] dark:via-[#152550] dark:to-[#101E42] backdrop-blur-xl border border-slate-200/90 dark:border-[#2499F2]/25 p-6 sm:p-7 rounded-3xl shadow-sm dark:shadow-[0_4px_25px_-5px_rgba(16,30,66,0.6)]">
        <div className="absolute -top-24 -end-24 w-64 h-64 bg-[#28C8C0]/10 dark:bg-[#28C8C0]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -start-24 w-64 h-64 bg-[#2499F2]/10 dark:bg-[#2499F2]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-[#152550] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#2499F2]/30 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#2499F2] dark:text-[#28C8C0]" />
                {t('dashboard.role_overview')}: {currentUser.role === 'supervisor' ? (isRtl ? 'المشرف الأكاديمي المعتمد' : 'Official Academic Supervisor') : currentUser.title}
              </span>
            </div>

            {/* رسالة الترحيب المخصصة حسب الدور وفق المتطلبات */}
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              {currentUser.role === 'company' && <Store className="w-6 h-6 text-[#2499F2] dark:text-[#28C8C0]" />}
              {currentUser.role === 'supervisor' && <ShieldCheck className="w-6 h-6 text-amber-500 dark:text-amber-400" />}
              {currentUser.role === 'student' && <Briefcase className="w-6 h-6 text-[#28C8C0] dark:text-[#77DCC1]" />}
              
              <span>
                {currentUser.role === 'supervisor'
                  ? (isRtl ? 'مرحباً بك، د. أسامة أمين مرعي 👋' : 'Welcome back, Dr. Osama Amin Marie 👋')
                  : currentUser.role === 'company'
                    ? (isRtl ? `مرحباً بكم، ${currentUser.name || 'شركة النور للحلول البرمجية'} 👋` : `Welcome, ${currentUser.name || 'Al-Noor Software Solutions'} 👋`)
                    : (isRtl ? `مرحباً بك، ${currentUser.name || 'أحمد منصور'} 👋` : `Welcome back, ${currentUser.name || 'Ahmed Mansour'} 👋`)}
              </span>
            </h1>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              {currentUser.role === 'supervisor'
                ? (isRtl ? 'لوحة الإشراف الأكاديمي الشاملة لمراجعة واعتماد المشاريع، تقييم التقارير الأسبوعية، ومتابعة شُعب التخرج.' : 'Comprehensive academic supervision dashboard for project review, weekly report evaluations, and graduation sections.')
                : currentUser.role === 'company'
                  ? (isRtl ? 'لوحة تحكم الشريك الصناعي لاستكشاف مشاريع التخرج، إرسال طلبات التعاون، ورصد تحليلات السوق.' : 'Industrial partner dashboard to explore graduation projects, send collaboration requests, and view market insights.')
                  : (isRtl ? 'لوحتك الأكاديمية لمتابعة مشروع التخرج، مواعيد تسليم التقارير، وطلبات التعاون مع الشركات.' : 'Your academic dashboard to monitor your graduation project, report submissions, and company collaboration.')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {currentUser.role === 'company' && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:from-[#1D7BC3] hover:to-[#20aba3] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-[#2499F2]/25 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('company.post_project_btn')}</span>
              </button>
            )}

            {currentUser.role === 'student' && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:from-[#1D7BC3] hover:to-[#20aba3] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-[#2499F2]/25 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isRtl ? 'إضافة / اقتراح مشروع' : 'Propose Project'}</span>
              </button>
            )}

            {currentUser.role === 'supervisor' && (
              <Link
                to="/approvals"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRtl ? 'اعتماد المشاريع' : 'Project Approvals'} ({pendingProjects})</span>
              </Link>
            )}

            <button
              type="button"
              onClick={fetchProjects}
              className="bg-white hover:bg-slate-50 dark:bg-[#152550] dark:hover:bg-[#182b5c] border border-slate-200 dark:border-[#2499F2]/30 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
              title={t('company.refresh_list')}
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#2499F2] dark:text-[#28C8C0]" />
              <span className="hidden sm:inline">{t('company.refresh_list')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. البطاقات الإحصائية الأربع المخصصة بدقة لكل دور (Role-Based 4 Stat Cards) */}
      
      {/* أ) بطاقات إحصائيات الطالب (student): مشروعي، حالة المراجعة، طلبات الشركات، المهارات */}
      {currentUser.role === 'student' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. مشروعي */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 hover:border-[#2499F2]/40 dark:hover:border-[#2499F2]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isRtl ? 'مشروعي' : 'My Project'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#2499F2]/10 border border-[#2499F2]/20 flex items-center justify-center text-[#2499F2] group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {isRtl ? '1 مشروع' : '1 Project'}
                </span>
                <span className="text-xs font-bold text-[#2499F2] bg-[#2499F2]/10 px-2 py-0.5 rounded-full border border-[#2499F2]/20">
                  {isRtl ? 'شُعبة 1' : 'Sec 1'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate" title={studentAssignedProject?.title}>
                {studentAssignedProject?.title}
              </p>
            </div>
          </div>

          {/* 2. حالة المراجعة */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 hover:border-[#28C8C0]/40 dark:hover:border-[#28C8C0]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isRtl ? 'حالة المراجعة' : 'Review Status'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#28C8C0]/10 border border-[#28C8C0]/20 flex items-center justify-center text-[#28C8C0] group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-[#77DCC1]">
                  {isRtl ? 'معتمد أكاديمياً' : 'Approved'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {isRtl ? 'بإشراف: د. أسامة أمين مرعي' : 'Supervised: Dr. Osama Marie'}
              </p>
            </div>
          </div>

          {/* 3. طلبات الشركات */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 hover:border-[#2499F2]/40 dark:hover:border-[#2499F2]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isRtl ? 'طلبات الشركات' : 'Company Requests'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#2499F2] group-hover:scale-110 transition-transform">
                <Store className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {myApplications.length > 0 ? myApplications.length : 3}
                </span>
                <span className="text-xs font-bold text-[#2499F2] bg-[#2499F2]/10 px-2 py-0.5 rounded-full border border-[#2499F2]/20">
                  {isRtl ? 'فرص نشطة' : 'Active'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {isRtl ? 'فرص تدريب وشراكة مستلمة' : 'Collaboration inquiries'}
              </p>
            </div>
          </div>

          {/* 4. المهارات */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 hover:border-[#77DCC1]/40 dark:hover:border-[#77DCC1]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isRtl ? 'المهارات' : 'Skills'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#77DCC1]/15 border border-[#77DCC1]/30 flex items-center justify-center text-[#28C8C0] dark:text-[#77DCC1] group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {userSkills.length}
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-[#77DCC1] bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-[#28C8C0]/30">
                  {isRtl ? 'مطابقة ذكية' : 'Match Ready'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {userSkills.slice(0, 3).join(' • ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ب) بطاقات إحصائيات الشركة (company): المشاريع المستكشفة، المحفوظة، الطلبات المرسلة، التقنيات الشائعة */}
      {currentUser.role === 'company' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. المشاريع المستكشفة */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 hover:border-[#2499F2]/40 dark:hover:border-[#2499F2]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isRtl ? 'المشاريع المستكشفة' : 'Explored Projects'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#2499F2]/10 border border-[#2499F2]/20 flex items-center justify-center text-[#2499F2] group-hover:scale-110 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{totalProjects}</span>
              <span className="text-xs font-bold text-[#2499F2] bg-[#2499F2]/10 px-2 py-0.5 rounded-full border border-[#2499F2]/20">
                {approvedProjects} {isRtl ? 'معتمد' : 'Approved'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
              {isRtl ? 'مشاريع خريجين في سوق التخرج' : 'Graduation projects in market'}
            </p>
          </div>

          {/* 2. المحفوظة */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 hover:border-amber-400 dark:hover:border-amber-500/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isRtl ? 'المشاريع المحفوظة' : 'Saved Projects'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <Star className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{favorites.length}</span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
                {isRtl ? 'مفضلة للرعاية' : 'Watchlist'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
              {isRtl ? 'مشاريع محفوظة للتواصل والتوظيف' : 'Bookmarked for follow-up'}
            </p>
          </div>

          {/* 3. الطلبات المرسلة */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 hover:border-[#28C8C0]/40 dark:hover:border-[#28C8C0]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isRtl ? 'الطلبات المرسلة' : 'Sent Requests'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#28C8C0]/10 border border-[#28C8C0]/20 flex items-center justify-center text-[#28C8C0] group-hover:scale-110 transition-transform">
                <Send className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{applications.length}</span>
              <span className="text-xs font-bold text-emerald-700 dark:text-[#77DCC1] bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-[#28C8C0]/30">
                {pendingApplicationsCount} {isRtl ? 'قيد الرد' : 'Pending'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
              {isRtl ? 'طلبات تعاون مع فرق التخرج' : 'Collaboration requests sent'}
            </p>
          </div>

          {/* 4. التقنيات الشائعة */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 hover:border-[#77DCC1]/40 dark:hover:border-[#77DCC1]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isRtl ? 'التقنيات الشائعة' : 'Trending Technologies'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#77DCC1]/15 border border-[#77DCC1]/30 flex items-center justify-center text-[#28C8C0] dark:text-[#77DCC1] group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{techDistribution.length > 0 ? techDistribution.length : 5}</span>
              <span className="text-xs font-bold text-[#2499F2] bg-[#2499F2]/10 px-2 py-0.5 rounded-full border border-[#2499F2]/20">
                {isRtl ? 'طلب مرتفع' : 'Top Tech'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
              {techDistribution.slice(0, 2).map((t) => t.name).join(' & ') || 'Python & React'}
            </p>
          </div>
        </div>
      )}

      {/* ج) بطاقات إحصائيات المشرف (supervisor): المشاريع بانتظار المراجعة، المشاريع المعتمدة، الطلاب، نسبة المقاعد الشاغرة */}
      {currentUser.role === 'supervisor' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. المشاريع بانتظار المراجعة */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 hover:border-amber-400 dark:hover:border-amber-500/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isRtl ? 'المشاريع بانتظار المراجعة' : 'Projects Pending Review'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{pendingProjects}</span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
                {isRtl ? 'إجراء عاجل' : 'Action Required'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
              {isRtl ? 'مشاريع شركات تتطلب التدقيق والاعتماد' : 'Awaiting academic review'}
            </p>
          </div>

          {/* 2. المشاريع المعتمدة */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 hover:border-[#28C8C0]/40 dark:hover:border-[#28C8C0]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isRtl ? 'المشاريع المعتمدة' : 'Approved Projects'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#28C8C0]/10 border border-[#28C8C0]/20 flex items-center justify-center text-[#28C8C0] group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{approvedProjects}</span>
              <span className="text-xs font-bold text-emerald-700 dark:text-[#77DCC1] bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-[#28C8C0]/30">
                {totalProjects > 0 ? Math.round((approvedProjects / totalProjects) * 100) : 100}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
              {isRtl ? 'مشاريع جاهزة للتنفيذ واستقبال الطلاب' : 'Active capstone projects'}
            </p>
          </div>

          {/* 3. الطلاب */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 hover:border-[#2499F2]/40 dark:hover:border-[#2499F2]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isRtl ? 'الطلاب' : 'Students'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#2499F2]/10 border border-[#2499F2]/20 flex items-center justify-center text-[#2499F2] group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{studentsList.length}</span>
              <span className="text-xs font-bold text-[#2499F2] bg-[#2499F2]/10 px-2 py-0.5 rounded-full border border-[#2499F2]/20">
                {studentsList.filter((s) => s.isFree).length} {isRtl ? 'أحرار' : 'Free'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
              {isRtl ? 'مسجلون في شُعبة مشاريع التخرج 1' : 'Enrolled in capstone section'}
            </p>
          </div>

          {/* 4. نسبة المقاعد الشاغرة */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 hover:border-[#77DCC1]/40 dark:hover:border-[#77DCC1]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isRtl ? 'نسبة المقاعد الشاغرة' : 'Vacant Seats Rate'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#77DCC1]/15 border border-[#77DCC1]/30 flex items-center justify-center text-[#28C8C0] dark:text-[#77DCC1] group-hover:scale-110 transition-transform">
                <PieChart className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{vacantPercentage}%</span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#152550] px-2 py-0.5 rounded-full border border-slate-200 dark:border-[#2499F2]/20">
                {totalAvailableSeats} {isRtl ? 'شاغر' : 'open'}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-[#152550] rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#28C8C0] to-[#77DCC1] rounded-full transition-all duration-500"
                style={{ width: `${vacantPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. قسم مشروعي التفصيلي للطالب (Student Project Detail & Quick Actions) */}
      {currentUser.role === 'student' && studentAssignedProject && (
        <div id="my-project" className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-6 shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2499F2]/10 border border-[#2499F2]/20 flex items-center justify-center text-[#2499F2]">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  {isRtl ? 'مشروع التخرج المعتمد' : 'Assigned Capstone Project'}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {studentAssignedProject.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-[#77DCC1] border border-emerald-200 dark:border-[#28C8C0]/30 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {isRtl ? 'معتمد أكاديمياً' : 'Approved'}
              </span>
              <button
                type="button"
                onClick={() => setActiveChatProject(studentAssignedProject)}
                className="inline-flex items-center gap-1.5 text-xs bg-[#2499F2]/10 hover:bg-[#2499F2]/20 text-[#2499F2] px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isRtl ? 'شات المشروع' : 'Chat'}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {studentAssignedProject.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-[#F4F8FC] dark:bg-[#152550]/60 rounded-xl border border-slate-200/80 dark:border-[#2499F2]/20 text-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">{isRtl ? 'المشرف الأكاديمي' : 'Supervisor'}</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                {studentAssignedProject.supervisor || 'د. أسامة أمين مرعي'}
              </span>
            </div>

            <div className="p-3 bg-[#F4F8FC] dark:bg-[#152550]/60 rounded-xl border border-slate-200/80 dark:border-[#2499F2]/20 text-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">{isRtl ? 'المقاعد المشغولة' : 'Team Capacity'}</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#2499F2]" />
                {studentAssignedProject.currentMembers || 3} / {studentAssignedProject.maxMembers || 4} {isRtl ? 'أعضاء' : 'Members'}
              </span>
            </div>

            <div className="p-3 bg-[#F4F8FC] dark:bg-[#152550]/60 rounded-xl border border-slate-200/80 dark:border-[#2499F2]/20 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">{isRtl ? 'المهارات والتقنيات' : 'Required Skills'}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {userSkills.length} {isRtl ? 'مهارات متطابقة' : 'Skills'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSkillsModal(true)}
                className="text-[11px] text-[#2499F2] dark:text-[#28C8C0] hover:underline font-bold"
              >
                {isRtl ? 'تعديل' : 'Edit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. الرسوم البيانية التفاعلية: تحليلات السوق والمهارات (Market Insights) */}
      <div id="market-insights" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* الرسم 1: توزيع المشاريع حسب التقنيات والمسارات (Bar Chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-6 shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#2499F2] dark:text-[#28C8C0]" />
                {t('dashboard.tech_distribution_title')}
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {techDistribution.length} {isRtl ? 'تقنيات رئيسية' : 'Key Skills'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {t('dashboard.tech_distribution_desc')}
            </p>

            <div className="space-y-4">
              {techDistribution.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                  {isRtl ? 'لا توجد بيانات كافية عن التقنيات حتى الآن.' : 'No technology metrics available yet.'}
                </div>
              ) : (
                techDistribution.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                        <span className="w-2 h-2 rounded-full bg-[#2499F2] dark:bg-[#28C8C0]" />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <span className="text-slate-900 dark:text-white font-bold">{item.count} {isRtl ? 'مشاريع' : 'projects'}</span>
                        <span className="text-slate-400 dark:text-slate-400">({item.percent}%)</span>
                      </div>
                    </div>
                    {/* شريط الرسم البياني */}
                    <div className="w-full bg-slate-100 dark:bg-[#152550] rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/80 dark:border-[#2499F2]/20">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${item.gradient} transition-all duration-700 shadow-sm`}
                        style={{ width: `${Math.max(8, item.percent)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{isRtl ? 'يتم التحديث تلقائياً مع كل مشروع جديد يضاف لقاعدة البيانات' : 'Automatically updated with projects in database'}</span>
            <span className="text-emerald-600 dark:text-[#77DCC1] font-bold">Live API ✓</span>
          </div>
        </div>

        {/* الرسم 2: مؤشر إشغال المقاعد الكلي (Circular Radial Progress Doughnut) */}
        <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-6 shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-600 dark:text-[#77DCC1]" />
                {t('dashboard.occupancy_rate_title')}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              {t('dashboard.occupancy_rate_desc')}
            </p>

            {/* الدائرة التقدمية SVG Radial Progress */}
            <div className="relative flex items-center justify-center my-6">
              <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 130 130">
                <defs>
                  <linearGradient id="occupancyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2499F2" />
                    <stop offset="60%" stopColor="#28C8C0" />
                    <stop offset="100%" stopColor="#77DCC1" />
                  </linearGradient>
                </defs>
                {/* مسار الخلفية */}
                <circle
                  cx="65"
                  cy="65"
                  r={circleRadius}
                  className="text-slate-200 dark:text-[#152550]"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                />
                {/* مسار النسبة الفعلي المتدرج */}
                <circle
                  cx="65"
                  cy="65"
                  r={circleRadius}
                  stroke="url(#occupancyGradient)"
                  strokeWidth="10"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* النص المتموضع في قلب الدائرة */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{occupancyPercentage}%</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  {isRtl ? 'نسبة الإشغال' : 'Occupancy'}
                </span>
              </div>
            </div>

            {/* تفاصيل المقاعد الثلاثية */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="p-2.5 bg-slate-50 dark:bg-[#152550]/60 rounded-xl border border-slate-200/80 dark:border-[#2499F2]/20">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">{t('dashboard.reserved_seats')}</span>
                <span className="text-sm font-black text-emerald-600 dark:text-[#77DCC1]">{totalOccupiedSeats}</span>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-[#152550]/60 rounded-xl border border-slate-200/80 dark:border-[#2499F2]/20">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">{t('dashboard.available_seats')}</span>
                <span className="text-sm font-black text-[#2499F2] dark:text-[#28C8C0]">{totalAvailableSeats}</span>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-[#152550]/60 rounded-xl border border-slate-200/80 dark:border-[#2499F2]/20">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">{t('dashboard.total_capacity')}</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200">{totalMaxSeats}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-white/5 text-center text-[11px] text-slate-500 dark:text-slate-400">
            {isRtl ? `الشاغر المتاح للطلبة: ${totalAvailableSeats} مقعداً (${vacantPercentage}%)` : `${totalAvailableSeats} open seats remaining (${vacantPercentage}%)`}
          </div>
        </div>
      </div>

      {/* 5. الأقسام التفصيلية المخصصة حسب دور المستخدم */}

      {/* دور الشركة: مشاريع الشركة المطروحة */}
      {currentUser.role === 'company' && (
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-[#2499F2] dark:text-[#28C8C0]" />
              <span>{t('company.my_projects_title', { count: myCompanyProjects.length })}</span>
            </h3>
            <button
              type="button"
              onClick={fetchProjects}
              className="text-xs text-[#2499F2] dark:text-[#28C8C0] hover:underline flex items-center gap-1 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {t('company.refresh_list')}
            </button>
          </div>

          {myCompanyProjects.length === 0 ? (
            <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-2xl p-8 text-center space-y-3 shadow-sm">
              <Briefcase className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">{isRtl ? 'لم تقم شركتك بطرح أي مشاريع حتى الآن.' : 'No projects posted yet.'}</p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:from-[#1D7BC3] hover:to-[#20aba3] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-[#2499F2]/20 active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('company.post_project_btn')}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {myCompanyProjects.map((p) => {
                const projectApps = applications.filter((a) => a.project_id === p.id);
                const curM = p.currentMembers || 0;
                const maxM = p.maxMembers || 4;
                const isProjectFull = curM >= maxM;

                return (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 hover:border-[#2499F2]/40 p-5 rounded-2xl flex flex-col justify-between transition-all duration-200 shadow-sm"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] bg-slate-100 dark:bg-[#152550] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2499F2]/20 px-2.5 py-0.5 rounded-md">
                          {translateMajor(p.category)}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            p.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-[#77DCC1] dark:border-[#28C8C0]/30'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                          }`}
                        >
                          {p.status === 'approved'
                            ? t('company.status_approved')
                            : t('company.status_pending')}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white mb-2">{p.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-3">{p.description}</p>

                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                        <span>{t('company.capacity')}</span>
                        <strong className="text-slate-800 dark:text-white">
                          {t('company.seats_reserved', {
                            current: curM,
                            max: maxM
                          })}
                        </strong>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-[#152550] rounded-full h-2 overflow-hidden mb-4">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isProjectFull ? 'bg-rose-500' : 'bg-gradient-to-r from-[#2499F2] to-[#28C8C0]'
                          }`}
                          style={{
                            width: `${Math.min(100, (curM / maxM) * 100)}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setShowApplicationsModal(true)}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-[#152550] dark:hover:bg-[#182b5c] text-slate-800 dark:text-white text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95 border border-slate-200/80 dark:border-[#2499F2]/20"
                      >
                        <Users className="w-3.5 h-3.5 text-[#2499F2] dark:text-[#28C8C0]" />
                        {t('company.applicants_requests', {
                          count: projectApps.length
                        })}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveChatProject(p)}
                        className="bg-slate-100 dark:bg-[#152550] hover:bg-slate-200 dark:hover:bg-[#182b5c] border border-slate-200 dark:border-[#2499F2]/20 text-slate-700 dark:text-slate-200 text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#2499F2] dark:text-[#28C8C0]" />
                        {t('company.project_chat')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* دور المشرف الأكاديمي: إجراءات الاعتماد ومتابعة الفرق */}
      {currentUser.role === 'supervisor' && (
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <span>{isRtl ? 'إجراءات ومتابعة المشرف الأكاديمي' : 'Supervisor Quick Actions'}</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isRtl ? 'إشراف د. أسامة أمين مرعي' : 'Dr. Osama Amin Marie'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/approvals"
              className="p-5 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 hover:border-amber-400 dark:hover:border-amber-500/50 rounded-2xl transition-all duration-200 group shadow-sm hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">{isRtl ? 'المشاريع بانتظار الاعتماد' : 'Pending Approvals'}</span>
                <CheckCircle2 className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition">
                {pendingApprovalsCount}
              </div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-2 inline-flex items-center gap-1">
                {isRtl ? 'مراجعة وتدقيق المشاريع' : 'Review Projects'} <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              to="/reports"
              className="p-5 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 hover:border-[#2499F2] dark:hover:border-[#2499F2]/50 rounded-2xl transition-all duration-200 group shadow-sm hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">{isRtl ? 'مراحل التقارير' : 'Report Milestones'}</span>
                <Clock className="w-5 h-5 text-[#2499F2] dark:text-[#28C8C0]" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-[#2499F2] dark:group-hover:text-[#28C8C0] transition">
                {reportsTimeline.length} {isRtl ? 'مراحل' : 'Phases'}
              </div>
              <span className="text-[11px] text-[#2499F2] dark:text-[#28C8C0] font-bold mt-2 inline-flex items-center gap-1">
                {isRtl ? 'متابعة تقييم الطلبة' : 'Student Submissions'} <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              to="/teams"
              className="p-5 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 hover:border-emerald-400 dark:hover:border-[#28C8C0]/50 rounded-2xl transition-all duration-200 group shadow-sm hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">{isRtl ? 'شعبة التخرج 1' : 'Graduation Section 1'}</span>
                <Users className="w-5 h-5 text-emerald-600 dark:text-[#77DCC1]" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-[#77DCC1] transition">
                {studentsList.length} {isRtl ? 'طالباً مسجلاً' : 'Students'}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-[#77DCC1] font-bold mt-2 inline-flex items-center gap-1">
                {isRtl ? 'إدارة الملاحظات والتسكين' : 'Manage Students'} <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>

          {/* معاينة سريعة للمشاريع المعلقة للمشرف مع أزرار الاعتماد المباشر */}
          {pendingApprovalsCount > 0 && (
            <div className="bg-white dark:bg-[#101E42] border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>{isRtl ? 'مشاريع بانتظار قرار الاعتماد الفوري' : 'Projects Pending Immediate Approval'}</span>
                </h4>
                <Link to="/approvals" className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold">
                  {isRtl ? 'عرض الكل' : 'View All'} ({pendingApprovalsCount})
                </Link>
              </div>

              <div className="space-y-2">
                {rawProjects.filter((p) => p.status === 'pending').slice(0, 3).map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 dark:bg-[#152550]/70 rounded-xl flex items-center justify-between gap-3 text-xs border border-slate-200/80 dark:border-[#2499F2]/20">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white block truncate">{p.title}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{translateMajor(p.category)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateProjectStatus(p.id, 'approved')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>{isRtl ? 'اعتماد' : 'Approve'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateProjectStatus(p.id, 'rejected')}
                        className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] px-3 py-1 rounded-lg font-bold transition cursor-pointer"
                      >
                        {isRtl ? 'رفض' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* دور الطالب: حالة الطلبات والتسليمات الأكاديمية */}
      {currentUser.role === 'student' && (
        <div id="applications" className="space-y-4 pt-2">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#28C8C0] dark:text-[#77DCC1]" />
            <span>{isRtl ? 'حالة طلباتك والتسليمات الأكاديمية' : 'Your Applications & Submissions'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-5 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {isRtl ? 'طلبات الانضمام والشراكة' : 'Submitted Applications'}
                </h4>
                <span className="text-xs bg-[#2499F2]/10 text-[#2499F2] px-2.5 py-0.5 rounded-full font-bold">
                  {myApplications.length}
                </span>
              </div>
              {myApplications.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-400">
                  {isRtl ? 'لم تقدم طلبات انضمام بعد. تصفح المشاريع وقدم طلبك الآن!' : 'No applications submitted yet. Browse projects to apply!'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myApplications.map((app) => (
                    <div
                      key={app.id}
                      className="p-3 bg-slate-50 dark:bg-[#152550]/60 rounded-xl flex items-center justify-between text-xs border border-slate-200/80 dark:border-[#2499F2]/20"
                    >
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {isRtl ? `طلب رقم #${app.id}` : `Application #${app.id}`}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          app.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-[#77DCC1] dark:border-[#28C8C0]/30'
                            : app.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                        }`}
                      >
                        {app.status === 'accepted' ? (isRtl ? 'مقبول' : 'Accepted') : app.status === 'rejected' ? (isRtl ? 'مرفوض' : 'Rejected') : (isRtl ? 'قيد المراجعة' : 'Pending')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-2xl flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {isRtl ? 'المرحلة القادمة لتسليم التقارير' : 'Upcoming Milestone'}
                  </h4>
                  <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-bold leading-snug">
                  {reportsTimeline[0]?.title}
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
                  {isRtl ? `الموعد النهائي: ${reportsTimeline[0]?.deadlineDay} (${reportsTimeline[0]?.deadlineDate})` : `Deadline: ${reportsTimeline[0]?.deadlineDay} (${reportsTimeline[0]?.deadlineDate})`}
                </p>
              </div>
              <div className="pt-4 mt-3 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between">
                <Link
                  to="/reports"
                  className="text-xs text-[#2499F2] dark:text-[#28C8C0] hover:underline flex items-center gap-1 font-bold transition"
                >
                  <span>{isRtl ? 'استعراض كافة التسليمات' : 'View Submissions'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/cv"
                  className="text-xs bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:from-[#1D7BC3] hover:to-[#20aba3] text-white px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'سيرتي الذاتية' : 'My CV'}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
