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
  Check,
  Eye,
  Bookmark
} from 'lucide-react';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const appContext = useApp() || {};
  const {
    rawProjects = [],
    isLoadingProjects = false,
    fetchProjects,
    applications = [],
    setIsCreateModalOpen,
    openApplicationsModal,
    setShowSkillsModal,
    setIsOnboardingModalOpen,
    setActiveChatProject,
    updateProjectStatus,
    translateMajor,
    reportsTimeline = [],
    studentsList = [],
    userSkills = [],
    myProject,
    favorites: appFavorites = [],
    savedProjects: appSavedProjects = [],
    toggleFavorite,
    isRtl
  } = appContext;

  // تعريف مصفوفة المفضلة بشكل آمن وقاطع يمنع حدوث ReferenceError أو استدعاء على undefined
  const favorites = useMemo(() => {
    if (Array.isArray(appFavorites)) return appFavorites;
    if (Array.isArray(appSavedProjects)) return appSavedProjects;
    if (Array.isArray(currentUser?.saved_projects)) return currentUser.saved_projects;
    return [];
  }, [appFavorites, appSavedProjects, currentUser?.saved_projects]);

  // 1. المشاريع التي تخص الشركة الحالية (تصفية صارمة لمعرف المستخدم المسجل فقط)
  const myCompanyProjects = useMemo(() => {
    return rawProjects.filter(
      (p) => String(p.created_by) === String(currentUser?.id)
    );
  }, [rawProjects, currentUser]);

  const myCompanyApprovedCount = useMemo(() => {
    return myCompanyProjects.filter((p) => p.status === 'approved').length;
  }, [myCompanyProjects]);

  const myCompanyPendingCount = useMemo(() => {
    return myCompanyProjects.filter((p) => p.status === 'pending').length;
  }, [myCompanyProjects]);

  // طلبات التقديم الخاصة بمشاريع هذه الشركة فقط
  const companyProjectIds = useMemo(() => new Set(myCompanyProjects.map((p) => p.id)), [myCompanyProjects]);
  const companyApplications = useMemo(() => {
    return applications.filter((a) => companyProjectIds.has(a.project_id));
  }, [applications, companyProjectIds]);
  const companyPendingApplicationsCount = useMemo(() => {
    return companyApplications.filter((a) => a.status === 'pending').length;
  }, [companyApplications]);

  // حسابات المقاعد والإشغال الخاصة بمشاريع الشركة فقط
  const companyMaxSeats = useMemo(() => {
    return myCompanyProjects.reduce((acc, p) => acc + (p.maxMembers || p.max_members || 4), 0);
  }, [myCompanyProjects]);

  const companyOccupiedSeats = useMemo(() => {
    return myCompanyProjects.reduce((acc, p) => acc + (p.currentMembers || p.current_members || 0), 0);
  }, [myCompanyProjects]);

  const companyAvailableSeats = Math.max(0, companyMaxSeats - companyOccupiedSeats);
  const companyOccupancyPercentage = companyMaxSeats > 0
    ? Math.round((companyOccupiedSeats / companyMaxSeats) * 100)
    : 0;
  const companyVacantPercentage = Math.max(0, 100 - companyOccupancyPercentage);

  // ==========================================
  // الحسابات الإحصائية الحية للوحة التحكم (Live Metrics)
  // ==========================================
  const totalProjects = rawProjects.length;
  const approvedProjects = rawProjects.filter((p) => p.status === 'approved').length;
  const pendingProjects = rawProjects.filter((p) => p.status === 'pending').length;

  const totalMaxSeats = rawProjects.reduce((acc, p) => acc + (p.maxMembers || p.max_members || 4), 0);
  const totalOccupiedSeats = rawProjects.reduce((acc, p) => acc + (p.currentMembers || p.current_members || 0), 0);
  const totalAvailableSeats = Math.max(0, totalMaxSeats - totalOccupiedSeats);
  const occupancyPercentage = totalMaxSeats > 0 ? Math.round((totalOccupiedSeats / totalMaxSeats) * 100) : 0;
  const vacantPercentage = Math.max(0, 100 - occupancyPercentage);

  const pendingApprovalsCount = rawProjects.filter((p) => p.status === 'pending').length;

  // طلبات الطالب الشخصية المعزولة تماماً
  const myApplications = useMemo(() => {
    return applications.filter((a) => String(a.student_id) === String(currentUser?.id));
  }, [applications, currentUser]);
  const myPendingApplicationsCount = useMemo(() => {
    return myApplications.filter((a) => a.status === 'pending').length;
  }, [myApplications]);
  const myAcceptedCount = useMemo(() => {
    return myApplications.filter((a) => a.status === 'accepted').length;
  }, [myApplications]);

  // مشروع الطالب المعتمد أو المقترح (عزل ديناميكي صارم دون أي بيانات وهمية)
  const studentAssignedProject = useMemo(() => {
    if (currentUser?.role !== 'student') return null;
    if (myProject && (myProject.status === 'approved' || myProject.status === 'academically_approved')) return myProject;
    const acceptedApp = applications.find(
      (a) => String(a.student_id) === String(currentUser.id) && 
      (a.status === 'accepted' || a.status === 'academically_approved')
    );
    if (acceptedApp) {
      const proj = rawProjects.find((p) => p.id === acceptedApp.project_id);
      if (proj && (proj.status === 'approved' || proj.status === 'academically_approved')) return proj;
    }
    const myCreated = rawProjects.find((p) => String(p.created_by) === String(currentUser.id) && (p.status === 'approved' || p.status === 'academically_approved'));
    if (myCreated) return myCreated;

    // الحساب غير المنضم لمشروع يبدأ بـ null لعرض واجهة الـ Onboarding النظيفة
    return null;
  }, [currentUser, myProject, applications, rawProjects]);

  const studentNominatedApp = useMemo(() => {
    if (currentUser?.role !== 'student') return null;
    return applications.find(
      (a) => String(a.student_id) === String(currentUser.id) &&
      (a.status === 'company_accepted' || a.status === 'pending_academic_approval')
    );
  }, [currentUser, applications]);

  // دالة توحيد وتطهير مسميات المهارات والتقنيات (Skills Normalization)
  const normalizeSkill = (s) => {
    if (!s || typeof s !== 'string') return '';
    const clean = s.trim().replace(/^['"<]+|['">]+$/g, '');
    const lower = clean.toLowerCase();
    if (!lower) return '';

    const canonicalMap = {
      spl: 'SQL',
      sql: 'SQL',
      python: 'Python',
      react: 'React',
      fastapi: 'FastAPI',
      docker: 'Docker',
      postgresql: 'PostgreSQL',
      postgres: 'PostgreSQL',
      'node.js': 'Node.js',
      nodejs: 'Node.js',
      node: 'Node.js',
      tailwindcss: 'TailwindCSS',
      tailwind: 'TailwindCSS',
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      'machine learning': 'Machine Learning',
      'power bi': 'Power BI',
      powerbi: 'Power BI',
      cybersecurity: 'Cybersecurity'
    };

    if (canonicalMap[lower]) {
      return canonicalMap[lower];
    }

    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const getProjectNormalizedSkills = (p) => {
    const rawSkillList = Array.isArray(p.skills) && p.skills.length > 0
      ? p.skills
      : (typeof p.required_skills === 'string'
          ? p.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
          : ['Python', 'SQL', 'React']);
    const normalized = rawSkillList.map((s) => normalizeSkill(s)).filter(Boolean);
    return Array.from(new Set(normalized));
  };

  // مشاريع قد تناسب شركتك (مشاريع معتمدة ومميزة للشراكة والاستثمار في سوق التخرج)
  const suggestedProjects = useMemo(() => {
    return rawProjects
      .filter((p) => String(p.created_by) !== String(currentUser?.id) && (p.status === 'approved' || !p.status))
      .slice(0, 6);
  }, [rawProjects, currentUser]);

  // ==========================================
  // الرسم البياني 1: توزيع التقنيات الأكثر طلباً (مع التطهير والتوحيد)
  // ==========================================
  const techDistribution = useMemo(() => {
    const counts = {};
    rawProjects.forEach((p) => {
      const skills = Array.isArray(p.skills) && p.skills.length > 0
        ? p.skills
        : (typeof p.required_skills === 'string'
            ? p.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
            : []);

      skills.forEach((s) => {
        const key = normalizeSkill(s);
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
  // معزولة للشركة بناءً على مشاريعها فقط، وشاملة للأدوار الأخرى
  // ==========================================
  const isCompanyUser = currentUser?.role === 'company';
  const displayOccupancyPercentage = isCompanyUser ? companyOccupancyPercentage : occupancyPercentage;
  const displayOccupiedSeats = isCompanyUser ? companyOccupiedSeats : totalOccupiedSeats;
  const displayAvailableSeats = isCompanyUser ? companyAvailableSeats : totalAvailableSeats;
  const displayMaxSeats = isCompanyUser ? companyMaxSeats : totalMaxSeats;
  const displayVacantPercentage = isCompanyUser ? companyVacantPercentage : vacantPercentage;

  const circleRadius = 54;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (circleCircumference * displayOccupancyPercentage) / 100;

  if (!currentUser) return null;

  // هيكل التحميل الذكي والفائق السرعة (Skeleton Loader) المتناسق مع ألوان المنصة
  if (isLoadingProjects && (!rawProjects || rawProjects.length === 0)) {
    return (
      <div className="space-y-7 max-w-6xl mx-auto animate-pulse">
        {/* Skeleton Header */}
        <div className="bg-slate-200/60 dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 p-7 rounded-3xl h-36 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="h-6 w-64 bg-slate-300 dark:bg-[#152550] rounded-xl" />
            <div className="h-4 w-96 bg-slate-300/70 dark:bg-[#152550]/70 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-36 bg-slate-300 dark:bg-[#152550] rounded-xl" />
            <div className="h-9 w-36 bg-slate-300 dark:bg-[#152550] rounded-xl" />
          </div>
        </div>

        {/* Skeleton 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 p-5 rounded-2xl h-28 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 bg-slate-200 dark:bg-[#152550] rounded" />
                <div className="h-8 w-8 bg-slate-200 dark:bg-[#152550] rounded-xl" />
              </div>
              <div className="h-7 w-24 bg-slate-200 dark:bg-[#152550] rounded-lg" />
            </div>
          ))}
        </div>

        {/* Skeleton Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 p-6 rounded-3xl h-72 shadow-sm" />
          <div className="bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 p-6 rounded-3xl h-72 shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* 1. ترويسة لوحة التحكم العصرية المخصصة حسب دور المستخدم */}
      <div className="relative overflow-hidden bg-gradient-to-r from-white via-slate-50 to-white dark:from-[#101E42] dark:via-[#152550] dark:to-[#101E42] backdrop-blur-xl border border-slate-300/80 dark:border-[#2499F2]/25 p-6 sm:p-7 rounded-3xl shadow-sm dark:shadow-[0_4px_25px_-5px_rgba(16,30,66,0.6)]">
        <div className="absolute -top-24 -end-24 w-64 h-64 bg-[#28C8C0]/10 dark:bg-[#28C8C0]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -start-24 w-64 h-64 bg-[#2499F2]/10 dark:bg-[#2499F2]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            {/* رسالة الترحيب المباشرة والنظيفة وفق المتطلبات */}
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              {currentUser.role === 'company' && <Store className="w-6 h-6 text-[#2499F2] dark:text-[#28C8C0]" />}
              {currentUser.role === 'supervisor' && <ShieldCheck className="w-6 h-6 text-amber-500 dark:text-amber-400" />}
              {currentUser.role === 'student' && <Briefcase className="w-6 h-6 text-[#28C8C0] dark:text-[#77DCC1]" />}
              
              <span>
                {currentUser.role === 'supervisor'
                  ? (isRtl ? `مرحباً بك، ${currentUser.name || ''} 👋` : `Welcome back, ${currentUser.name || 'Dr. Osama Amin Marie'} 👋`)
                  : currentUser.role === 'company'
                    ? (isRtl ? `أهلاً، ${currentUser.name || 'شريكنا العزيز'} 👋` : `Welcome, ${currentUser.name || 'Partner'} 👋`)
                    : (isRtl ? `مرحباً بك، ${currentUser.name || 'mohamad'} 👋` : `Welcome back, ${currentUser.name || 'mohamad'} 👋`)}
              </span>
            </h1>

            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              {currentUser.role === 'supervisor'
                ? (isRtl ? 'لوحة الإشراف الأكاديمي الشاملة لمراجعة واعتماد المشاريع، تقييم التقارير الأسبوعية، ومتابعة شُعب التخرج.' : 'Comprehensive academic supervision dashboard for project review, weekly report evaluations, and graduation sections.')
                : currentUser.role === 'company'
                  ? (isRtl ? 'اكتشف المشاريع المناسبة لشركتك، وانشر فرص التعاون، وابدأ شراكتك مع المواهب الجامعية.' : 'Discover projects suited for your company, post collaboration opportunities, and partner with university talents.')
                  : (isRtl ? 'لوحتك الأكاديمية لمتابعة مشروع التخرج، مواعيد تسليم التقارير، وطلبات التعاون مع الشركات.' : 'Your academic dashboard to monitor your graduation project, report submissions, and company collaboration.')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {currentUser.role === 'company' && (
              <>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:from-[#1D7BC3] hover:to-[#20aba3] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-[#2499F2]/25 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isRtl ? '+ نشر فرصة تعاون أو تحدي' : '+ Post Opportunity or Challenge'}</span>
                </button>

                <Link
                  to="/projects"
                  className="bg-white hover:bg-slate-50 dark:bg-[#152550] dark:hover:bg-[#182b5c] border border-slate-300/80 dark:border-[#2499F2]/30 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                >
                  <span>{isRtl ? 'استكشاف المشاريع المعتمدة ←' : 'Explore Approved Projects →'}</span>
                </Link>
              </>
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
              className="bg-white hover:bg-slate-50 dark:bg-[#152550] dark:hover:bg-[#182b5c] border border-slate-300/80 dark:border-[#2499F2]/30 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
              title={t('company.refresh_list')}
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#2499F2] dark:text-[#28C8C0]" />
              <span className="hidden sm:inline">{t('company.refresh_list')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. البطاقات الإحصائية الأربع المخصصة بدقة لكل دور (Role-Based 4 Stat Cards) */}
      
      {/* أ) بطاقات إحصائيات الطالب (student): مشروعي، حالة المراجعة، المشاريع المحفوظة، المهارات */}
      {currentUser.role === 'student' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. مشروعي */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-[#2499F2]/40 dark:hover:border-[#2499F2]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400">
                {isRtl ? 'مشروعي' : 'My Project'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#2499F2]/10 border border-[#2499F2]/20 flex items-center justify-center text-[#2499F2] group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {studentAssignedProject ? (isRtl ? '1 مشروع' : '1 Project') : (isRtl ? '0 مشروع' : '0 Projects')}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  studentAssignedProject
                    ? 'text-[#1875bb] dark:text-[#28C8C0] bg-blue-50 dark:bg-[#2499F2]/10 border-blue-200 dark:border-[#2499F2]/20'
                    : 'text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                }`}>
                  {studentAssignedProject ? (isRtl ? 'شُعبة 1' : 'Sec 1') : (isRtl ? 'بانتظار الانضمام' : 'Not Joined')}
                </span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate" title={studentAssignedProject?.title}>
                {studentAssignedProject?.title || (isRtl ? 'لم تسجل في مشروع تخرج بعد' : 'Not enrolled in a project')}
              </p>
            </div>
          </div>

          {/* 2. حالة التقديم والطلبات */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-[#28C8C0]/40 dark:hover:border-[#28C8C0]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400">
                {isRtl ? 'طلبات التقديم' : 'My Applications'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#28C8C0]/10 border border-[#28C8C0]/20 flex items-center justify-center text-[#28C8C0] group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {myApplications.length}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  myAcceptedCount > 0
                    ? 'text-emerald-900 dark:text-[#77DCC1] bg-emerald-100 dark:bg-emerald-500/10 border-emerald-300 dark:border-[#28C8C0]/30'
                    : myPendingApplicationsCount > 0
                    ? 'text-amber-900 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/20'
                    : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'
                }`}>
                  {myAcceptedCount > 0
                    ? (isRtl ? 'مقبول' : 'Accepted')
                    : myPendingApplicationsCount > 0
                    ? (isRtl ? `${myPendingApplicationsCount} قيد المراجعة` : `${myPendingApplicationsCount} Pending`)
                    : (isRtl ? 'جاهز للتقديم' : 'Apply Ready')}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate font-medium">
                {myApplications.length > 0
                  ? (isRtl ? 'طلبات انضمام مرسلة لفرق التخرج' : 'Applications sent to teams')
                  : (isRtl ? 'استكشف المشاريع وقدم طلبك الآن' : 'Browse projects and apply now')}
              </p>
            </div>
          </div>

          {/* 3. المشاريع المحفوظة (المفضلة) */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-amber-400 dark:hover:border-amber-500/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400">
                {isRtl ? 'مشاريع محفوظة' : 'Saved Projects'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <Bookmark className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {(favorites || []).length}
                </span>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/20">
                  {isRtl ? 'المفضلة' : 'Watchlist'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate font-medium">
                {isRtl ? 'مشاريع قمت بحفظها للرجوع إليها' : 'Projects saved for later'}
              </p>
            </div>
          </div>

          {/* 4. المهارات */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-[#77DCC1]/40 dark:hover:border-[#77DCC1]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400">
                {isRtl ? 'المهارات التقنية' : 'Technical Skills'}
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
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  userSkills.length > 0
                    ? 'text-emerald-900 dark:text-[#77DCC1] bg-emerald-100 dark:bg-emerald-500/10 border-emerald-300 dark:border-[#28C8C0]/30'
                    : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'
                }`}>
                  {userSkills.length > 0 ? (isRtl ? 'مطابقة ذكية' : 'Match Ready') : (isRtl ? 'أضف مهاراتك' : 'Add Skills')}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate font-medium">
                {userSkills.length > 0 ? userSkills.slice(0, 3).join(' • ') : (isRtl ? 'حدد مهاراتك للمطابقة الذكية' : 'Add skills to match')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ب) بطاقات إحصائيات الشركة (B2B Partner KPI Cards) */}
      {currentUser.role === 'company' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. مشاريع مناسبة */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-[#2499F2]/40 dark:hover:border-[#2499F2]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400">
                {isRtl ? 'مشاريع مناسبة' : 'Matching Projects'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#2499F2]/10 border border-[#2499F2]/20 flex items-center justify-center text-[#2499F2] group-hover:scale-110 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{approvedProjects}</span>
              <span className="text-xs font-bold text-[#1875bb] dark:text-[#28C8C0] bg-blue-50 dark:bg-[#2499F2]/10 px-2 py-0.5 rounded-full border border-blue-200 dark:border-[#2499F2]/20">
                {isRtl ? 'معتمدة للشراكة' : 'Ready'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 truncate font-medium">
              {isRtl ? 'مشاريع معتمدة بالمنصة متوافقة مع اهتمامات الشركات' : 'Approved projects matching business interests'}
            </p>
          </div>

          {/* 2. فرص منشورة */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-[#28C8C0]/40 dark:hover:border-[#28C8C0]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400">
                {isRtl ? 'فرص منشورة' : 'Posted Opportunities'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#28C8C0]/10 border border-[#28C8C0]/20 flex items-center justify-center text-[#28C8C0] group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{myCompanyProjects.length}</span>
              <span className="text-xs font-bold text-emerald-900 dark:text-[#77DCC1] bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-[#28C8C0]/30">
                {myCompanyApprovedCount} {isRtl ? 'معتمدة' : 'Approved'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 truncate font-medium">
              {isRtl ? 'تحديات وفرص نشرتها شركتكم حصراً' : 'Challenges posted exclusively by your company'}
            </p>
          </div>

          {/* 3. طلبات واردة */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-[#2499F2]/40 dark:hover:border-[#2499F2]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400">
                {isRtl ? 'طلبات واردة' : 'Incoming Requests'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#2499F2] group-hover:scale-110 transition-transform">
                <Send className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{companyApplications.length}</span>
              <span className="text-xs font-bold text-emerald-900 dark:text-[#77DCC1] bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-[#28C8C0]/30">
                {companyPendingApplicationsCount} {isRtl ? 'جديد' : 'New'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 truncate font-medium">
              {isRtl ? 'طلبات انضمام وتواصل من فرق الطلاب' : 'Team join & contact requests'}
            </p>
          </div>

          {/* 4. مشاريع محفوظة */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-amber-400 dark:hover:border-amber-500/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400">
                {isRtl ? 'مشاريع محفوظة' : 'Saved Projects'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <Bookmark className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{(favorites || []).length}</span>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/20">
                {isRtl ? 'المفضلة' : 'Watchlist'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 truncate font-medium">
              {isRtl ? 'المشاريع التي أضافتها شركتكم للمفضلة' : 'Projects added to favorites'}
            </p>
          </div>
        </div>
      )}

      {/* ج) بطاقات إحصائيات المشرف (supervisor): المشاريع بانتظار المراجعة، المشاريع المعتمدة، الطلاب، نسبة المقاعد الشاغرة */}
      {currentUser.role === 'supervisor' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. المشاريع بانتظار المراجعة */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-amber-400 dark:hover:border-amber-500/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400">
                {isRtl ? 'المشاريع بانتظار المراجعة' : 'Projects Pending Review'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{pendingProjects}</span>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/20">
                {isRtl ? 'إجراء عاجل' : 'Action Required'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 truncate font-medium">
              {isRtl ? 'مشاريع شركات تتطلب التدقيق والاعتماد' : 'Awaiting academic review'}
            </p>
          </div>

          {/* 2. المشاريع المعتمدة */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-[#28C8C0]/40 dark:hover:border-[#28C8C0]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400">
                {isRtl ? 'المشاريع المعتمدة' : 'Approved Projects'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#28C8C0]/10 border border-[#28C8C0]/20 flex items-center justify-center text-[#28C8C0] group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{approvedProjects}</span>
              <span className="text-xs font-bold text-emerald-900 dark:text-[#77DCC1] bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-[#28C8C0]/30">
                {totalProjects > 0 ? Math.round((approvedProjects / totalProjects) * 100) : 100}%
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 truncate font-medium">
              {isRtl ? 'مشاريع جاهزة للتنفيذ واستقبال الطلاب' : 'Active capstone projects'}
            </p>
          </div>

          {/* 3. الطلاب */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-[#2499F2]/40 dark:hover:border-[#2499F2]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400">
                {isRtl ? 'الطلاب' : 'Students'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#2499F2]/10 border border-[#2499F2]/20 flex items-center justify-center text-[#2499F2] group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{studentsList.length}</span>
              <span className="text-xs font-bold text-[#1875bb] dark:text-[#28C8C0] bg-blue-50 dark:bg-[#2499F2]/10 px-2 py-0.5 rounded-full border border-blue-200 dark:border-[#2499F2]/20">
                {studentsList.filter((s) => s.isFree).length} {isRtl ? 'أحرار' : 'Free'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 truncate font-medium">
              {isRtl ? 'مسجلون في شُعبة مشاريع التخرج 1' : 'Enrolled in capstone section'}
            </p>
          </div>

          {/* 4. نسبة المقاعد الشاغرة */}
          <div className="relative overflow-hidden bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-[#77DCC1]/40 dark:hover:border-[#77DCC1]/40 p-5 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-400">
                {isRtl ? 'نسبة المقاعد الشاغرة' : 'Vacant Seats Rate'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#77DCC1]/15 border border-[#77DCC1]/30 flex items-center justify-center text-[#28C8C0] dark:text-[#77DCC1] group-hover:scale-110 transition-transform">
                <PieChart className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{vacantPercentage}%</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#152550] px-2 py-0.5 rounded-full border border-slate-300/80 dark:border-[#2499F2]/20">
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

      {/* 3. قسم مشروعي التفصيلي للطالب أو واجهة الـ Onboarding الأنيقة للحساب الجديد */}
      {currentUser.role === 'student' && (
        studentAssignedProject ? (
          <div id="my-project" className="bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 rounded-3xl p-6 shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2499F2]/10 border border-[#2499F2]/20 flex items-center justify-center text-[#2499F2]">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-bold">
                    {isRtl ? 'مشروع التخرج المعتمد' : 'Assigned Capstone Project'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {studentAssignedProject.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-100 dark:bg-emerald-500/10 text-emerald-900 dark:text-[#77DCC1] border border-emerald-300 dark:border-[#28C8C0]/30 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  {isRtl ? 'معتمد أكاديمياً' : 'Approved'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveChatProject(studentAssignedProject)}
                  className="inline-flex items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-[#2499F2]/10 dark:hover:bg-[#2499F2]/20 text-[#1875bb] dark:text-[#2499F2] px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border border-blue-200 dark:border-transparent"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'شات المشروع' : 'Chat'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {studentAssignedProject.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-[#152550]/60 rounded-xl border border-slate-300/80 dark:border-[#2499F2]/20 text-xs">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1 font-semibold">{isRtl ? 'المشرف الأكاديمي' : 'Supervisor'}</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  {studentAssignedProject.supervisor || (isRtl ? 'لم يُسند بعد' : 'Not assigned yet')}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#152550]/60 rounded-xl border border-slate-300/80 dark:border-[#2499F2]/20 text-xs">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1 font-semibold">{isRtl ? 'المقاعد المشغولة' : 'Team Capacity'}</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#2499F2]" />
                  {studentAssignedProject.currentMembers || 3} / {studentAssignedProject.maxMembers || 4} {isRtl ? 'أعضاء' : 'Members'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#152550]/60 rounded-xl border border-slate-300/80 dark:border-[#2499F2]/20 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1 font-semibold">{isRtl ? 'المهارات والتقنيات' : 'Required Skills'}</span>
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
        ) : studentNominatedApp ? (
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-[#2499F2]/10 to-[#28C8C0]/10 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 text-start shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-xl shrink-0">
                🌟
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-2.5 py-0.5 rounded-full">
                  {isRtl ? 'ترشيح صناعي من الشركة' : 'Company Nomination'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                  {isRtl ? 'تم ترشيحك بنجاح من قِبل الشركة الراعية! ⏳ بانتظار الاعتماد الأكاديمي' : 'You have been nominated! ⏳ Awaiting Academic Approval'}
                </h3>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-[#101E42]/80 border border-amber-200/60 dark:border-amber-500/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isRtl ? 'المشروع المرشح له:' : 'Nominated Project:'}</span>
                <span className="font-bold text-slate-800 dark:text-white">{studentNominatedApp.project_title || (isRtl ? 'مشروع التخرج' : 'Capstone Project')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isRtl ? 'الشركة الراعية:' : 'Company:'}</span>
                <span className="font-bold text-[#2499F2]">{studentNominatedApp.company_name || (isRtl ? 'شركة معتمدة' : 'Partner Company')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isRtl ? 'حالة الاعتماد الأكاديمي:' : 'Academic Status:'}</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>{isRtl ? 'قيد المراجعة والاعتماد لدى المشرف الأكاديمي' : 'Pending Faculty Review'}</span>
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isRtl
                ? 'اختيار الشركة لطلبك يعتبر ترشيحاً صناعياً ولا يفعل المشروع رسمياً إلا بعد مصادقة المشرف الأكاديمي. ستُفتح مساحة العمل الفعالة وتتبع التقارير فور الاعتماد.'
                : 'Company acceptance is an industry nomination. The active workspace and report submission will unlock upon official academic supervisor approval.'}
            </p>
          </div>
        ) : (
          <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50/30 dark:from-[#101E42] dark:via-[#13234b] dark:to-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/25 rounded-3xl p-8 sm:p-10 text-center shadow-sm">
            <div className="max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2499F2]/20 to-[#28C8C0]/20 border border-[#2499F2]/30 flex items-center justify-center text-[#2499F2] dark:text-[#28C8C0] mx-auto shadow-inner">
                <Briefcase className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {isRtl ? 'ابدأ رحلة مشروع تخرجك الآن! 🎓' : 'Start Your Capstone Journey! 🎓'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed max-w-lg mx-auto">
                  {isRtl
                    ? 'حسابك الأكاديمي جاهز ونظيف. يمكنك استكشاف مشاريع التخرج المعتمدة والمطروحة من الشركات للانضمام إليها، أو طرح مقترح مشروعك الخاص ليعتمده المشرف الأكاديمي.'
                    : 'Your account is ready. Explore approved capstone projects and apply to join teams, or propose your own project idea.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/projects"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:from-[#1D7BC3] hover:to-[#20aba3] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-[#2499F2]/25 active:scale-95 cursor-pointer"
                >
                  <Store className="w-4 h-4" />
                  <span>{isRtl ? 'استكشاف مشاريع التخرج المتاحة ←' : 'Explore Capstone Market →'}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 dark:bg-[#152550] dark:hover:bg-[#182b5c] border border-slate-300/80 dark:border-[#2499F2]/30 text-slate-800 dark:text-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-[#28C8C0]" />
                  <span>{isRtl ? '+ طرح فكرة مشروع تخرج' : '+ Propose Project Idea'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOnboardingModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{isRtl ? 'إعداد ملف الطالب السريع' : 'Setup Profile'}</span>
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* 3. قسم مشاريع قد تناسب شركتك (خاص بدور الشركة) */}
      {currentUser.role === 'company' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#2499F2] dark:text-[#28C8C0]" />
                <span>{isRtl ? 'مشاريع قد تناسب شركتك' : 'Projects That May Suit Your Company'}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {isRtl
                  ? 'مشاريع تخرج مميزة ومعتمدة أكاديمياً في مسارات تقنية واعدة (أنظمة سحابية، ذكاء اصطناعي، ويب، أمن سيبراني)'
                  : 'Curated academically approved capstone projects in high-growth tech tracks'}
              </p>
            </div>

            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2499F2] dark:text-[#28C8C0] hover:underline self-start sm:self-auto cursor-pointer"
            >
              <span>{isRtl ? 'عرض الكل ←' : 'View All →'}</span>
            </Link>
          </div>

          {suggestedProjects.length === 0 ? (
            <div className="bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 rounded-2xl p-8 text-center text-xs text-slate-500">
              {isRtl ? 'لا توجد مشاريع مقترحة حالياً.' : 'No suggested projects available right now.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {suggestedProjects.map((proj) => {
                const projSkills = getProjectNormalizedSkills(proj);
                const isFav = Array.isArray(favorites) && favorites.includes(proj.id);

                return (
                  <div
                    key={proj.id}
                    className="group bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-[#2499F2]/50 p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-sm hover:-translate-y-1"
                  >
                    <div>
                      {/* التخصص وحالة الاعتماد */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[11px] bg-blue-50 dark:bg-[#152550] text-[#1875bb] dark:text-[#28C8C0] border border-blue-200 dark:border-[#2499F2]/20 px-2.5 py-0.5 rounded-md font-semibold truncate max-w-[180px]">
                          {translateMajor(proj.category)}
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/10 dark:text-[#77DCC1] dark:border-[#28C8C0]/30 px-2 py-0.5 rounded-full font-bold shrink-0">
                          {isRtl ? 'معتمد' : 'Approved'}
                        </span>
                      </div>

                      {/* عنوان المشروع */}
                      <h4
                        className="font-bold text-base text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-[#2499F2] transition-colors"
                        title={proj.title}
                      >
                        {proj.title}
                      </h4>

                      {/* نبذة عن المشروع */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                        {proj.description}
                      </p>

                      {/* وسوم التقنيات النظيفة */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        {projSkills.slice(0, 3).map((sk, skIdx) => (
                          <span
                            key={skIdx}
                            className="text-[10px] bg-slate-100 dark:bg-[#152550] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/5 font-mono font-medium"
                          >
                            {sk}
                          </span>
                        ))}
                        {projSkills.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            +{projSkills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* الأزرار السريعة: عرض التفاصيل وحفظ في المفضلة */}
                    <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex items-center gap-2">
                      <Link
                        to="/projects"
                        className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-[#152550] dark:hover:bg-[#182b5c] text-slate-800 dark:text-white text-xs py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 border border-slate-300/80 dark:border-[#2499F2]/20 active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#2499F2] dark:text-[#28C8C0]" />
                        <span>{isRtl ? 'عرض التفاصيل' : 'Details'}</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => typeof toggleFavorite === 'function' && toggleFavorite(proj.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border active:scale-95 cursor-pointer ${
                          isFav
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                            : 'bg-slate-100 dark:bg-[#152550] border-slate-300/80 dark:border-[#2499F2]/20 text-slate-600 dark:text-slate-300 hover:text-amber-500'
                        }`}
                        title={isFav ? (isRtl ? 'إزالة من المفضلة' : 'Remove Bookmark') : (isRtl ? 'حفظ في المفضلة' : 'Bookmark')}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
                        <span>{isFav ? (isRtl ? 'محفوظ' : 'Saved') : (isRtl ? 'حفظ' : 'Save')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. قسم آخر النشاطات وطلبات التعاون (خاص بدور الشركة) */}
      {currentUser.role === 'company' && (
        <div className="bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#28C8C0]/10 border border-[#28C8C0]/20 flex items-center justify-center text-[#28C8C0]">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {isRtl ? 'آخر النشاطات وطلبات التعاون' : 'Recent Activities & Collaboration Requests'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isRtl ? 'متابعة تفاعل فرق التخرج وطلبات الانضمام والتواصل مع شركتكم' : 'Track graduation team inquiries and collaboration applications'}
                </p>
              </div>
            </div>

            <Link
              to="/collaboration-requests"
              className="text-xs text-[#2499F2] dark:text-[#28C8C0] hover:underline font-bold flex items-center gap-1 self-start sm:self-auto"
            >
              <span>{isRtl ? 'إدارة كافة الطلبات ←' : 'Manage All Requests →'}</span>
            </Link>
          </div>

          {companyApplications.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto opacity-60" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isRtl ? 'لا توجد طلبات واردة حالياً' : 'No incoming requests yet'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {isRtl
                  ? 'ستظهر هنا طلبات فرق الطلاب وسيرهم الذاتية فور تقدمهم على التحديات والفرص المنشورة لشركتكم.'
                  : 'Student applications and team resumes will appear here once they apply to your challenges.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {companyApplications.slice(0, 4).map((app) => {
                const targetProj = rawProjects.find((p) => p.id === app.project_id);
                return (
                  <div key={app.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {app.student_name || (isRtl ? `طالب متقدم #${app.student_id}` : `Student #${app.student_id}`)}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            app.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/10 dark:text-[#77DCC1]'
                              : app.status === 'rejected'
                              ? 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/10 dark:text-rose-400'
                              : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400'
                          }`}
                        >
                          {app.status === 'accepted'
                            ? (isRtl ? 'مقبول' : 'Accepted')
                            : app.status === 'rejected'
                            ? (isRtl ? 'مرفوض' : 'Rejected')
                            : (isRtl ? 'قيد المراجعة' : 'Pending')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isRtl ? 'متقدم على مشروع:' : 'Applied to:'} <span className="text-slate-700 dark:text-slate-300 font-medium">{targetProj?.title || `#${app.project_id}`}</span>
                      </p>
                      {app.message && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-1">
                          "{app.message}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openApplicationsModal(app.project_id)}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-[#152550] dark:hover:bg-[#182b5c] text-xs font-bold px-3 py-1.5 rounded-lg text-slate-800 dark:text-white transition cursor-pointer"
                      >
                        {isRtl ? 'مراجعة الطلب' : 'Review'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* الرسوم البيانية التفاعلية: تحليلات السوق والمهارات (إحصائيات السوق الأكاديمي العام - نبض المنصة) */}
      {currentUser.role !== 'company' && (
        <div id="market-insights" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#2499F2] dark:text-[#28C8C0]" />
                <span>{isRtl ? 'نبض سوق التخرج والمهارات الحية (إحصائيات المنصة العامة)' : 'Platform Capstone Pulse & Market Insights'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isRtl
                  ? 'مؤشرات مجمعة مباشرة من كافة مشاريع قاعدة البيانات توضح اتجاهات السوق الأكاديمي وسعة الاستيعاب بالجامعة.'
                  : 'Macro-level indicators aggregated from all projects reflecting market trends and university capacity.'}
              </p>
            </div>
            <span className="text-[10px] bg-[#2499F2]/10 text-[#2499F2] dark:text-[#28C8C0] border border-[#2499F2]/20 px-2.5 py-1 rounded-full font-bold self-start sm:self-auto">
              Live Platform Pulse ✓
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* الرسم 1: توزيع المشاريع حسب التقنيات والمسارات (Bar Chart) */}
          <div className="lg:col-span-2 bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 rounded-3xl p-6 shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#2499F2] dark:text-[#28C8C0]" />
                  {t('dashboard.tech_distribution_title')}
                </h3>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-semibold">
                  {techDistribution.length} {isRtl ? 'تقنيات رئيسية' : 'Key Skills'}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-400 mb-6 leading-relaxed">
                {t('dashboard.tech_distribution_desc')}
              </p>

              <div className="space-y-4">
                {techDistribution.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-500">
                    {isRtl ? 'لا توجد بيانات كافية عن التقنيات حتى الآن.' : 'No technology metrics available yet.'}
                  </div>
                ) : (
                  techDistribution.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-200">
                          <span className="w-2 h-2 rounded-full bg-[#2499F2] dark:bg-[#28C8C0]" />
                          <span>{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                          <span className="text-slate-900 dark:text-white font-bold">{item.count} {isRtl ? 'مشاريع' : 'projects'}</span>
                          <span className="text-slate-500 dark:text-slate-400">({item.percent}%)</span>
                        </div>
                      </div>
                      {/* شريط الرسم البياني */}
                      <div className="w-full bg-slate-200 dark:bg-[#152550] rounded-full h-3 overflow-hidden p-0.5 border border-slate-300/80 dark:border-[#2499F2]/20">
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

            <div className="pt-5 mt-5 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              <span>{isRtl ? 'يتم التحديث تلقائياً مع كل مشروع جديد يضاف لقاعدة البيانات' : 'Automatically updated with projects in database'}</span>
              <span className="text-emerald-700 dark:text-[#77DCC1] font-bold">Live API ✓</span>
            </div>
          </div>

          {/* الرسم 2: مؤشر إشغال المقاعد الكلي (Circular Radial Progress Doughnut) */}
          <div className="bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 rounded-3xl p-6 shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-emerald-700 dark:text-[#77DCC1]" />
                  {t('dashboard.occupancy_rate_title')}
                </h3>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-400 mb-4 leading-relaxed">
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
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{displayOccupancyPercentage}%</span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    {isRtl ? 'نسبة الإشغال' : 'Occupancy'}
                  </span>
                </div>
              </div>

              {/* تفاصيل المقاعد الثلاثية */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-2.5 bg-slate-50 dark:bg-[#152550]/60 rounded-xl border border-slate-300/80 dark:border-[#2499F2]/20">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5 font-semibold">{t('dashboard.reserved_seats')}</span>
                  <span className="text-sm font-black text-emerald-700 dark:text-[#77DCC1]">{displayOccupiedSeats}</span>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-[#152550]/60 rounded-xl border border-slate-300/80 dark:border-[#2499F2]/20">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5 font-semibold">{t('dashboard.available_seats')}</span>
                  <span className="text-sm font-black text-[#1875bb] dark:text-[#28C8C0]">{displayAvailableSeats}</span>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-[#152550]/60 rounded-xl border border-slate-300/80 dark:border-[#2499F2]/20">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5 font-semibold">{t('dashboard.total_capacity')}</span>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-200">{displayMaxSeats}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/5 text-center text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              {isRtl ? `الشاغر المتاح للطلبة: ${totalAvailableSeats} مقعداً (${vacantPercentage}%)` : `${totalAvailableSeats} open seats remaining (${vacantPercentage}%)`}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 5. الأقسام التفصيلية المخصصة حسب دور المستخدم */}

      {/* دور الشركة: فرص التعاون والتحديات المنشورة لشركتكم */}
      {currentUser.role === 'company' && (
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-[#2499F2] dark:text-[#28C8C0]" />
              <span>{isRtl ? `فرص التعاون والتحديات المنشورة لشركتكم (${myCompanyProjects.length})` : `Your Posted Challenges & Opportunities (${myCompanyProjects.length})`}</span>
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
            <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/70 to-blue-50/40 dark:from-[#101E42] dark:via-[#13234b] dark:to-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/30 rounded-3xl p-8 sm:p-10 text-center shadow-sm">
              <div className="max-w-xl mx-auto space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2499F2]/15 to-[#28C8C0]/25 border border-[#2499F2]/30 flex items-center justify-center text-[#2499F2] dark:text-[#28C8C0] mx-auto shadow-inner">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">
                    {isRtl ? 'مرحباً بكم كشريك صناعي في منصة مشاريع التخرج!' : 'Welcome Partner Company to Capstone Market!'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed max-w-lg mx-auto">
                    {isRtl
                      ? 'حسابكم جديد وجاهز للعمل. اطرحوا الآن أول تحدٍ تقني أو فكرة مشروع لتمكين نخبة الطلاب الخريجين من ابتكار الحلول تحت إشراف أكاديمي معتمد.'
                      : 'Your account is ready. Post your first technical challenge to engage senior students under academic faculty supervision.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-start">
                  <div className="p-3.5 bg-white dark:bg-[#152550] rounded-2xl border border-slate-200 dark:border-white/5 shadow-xs">
                    <span className="font-bold text-xs text-[#2499F2] block mb-1">1. {isRtl ? 'طرح التحدي' : 'Post Challenge'}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal block">{isRtl ? 'حدد وصف المشروع والمهارات المطلوبة' : 'Define problem and target skills'}</span>
                  </div>
                  <div className="p-3.5 bg-white dark:bg-[#152550] rounded-2xl border border-slate-200 dark:border-white/5 shadow-xs">
                    <span className="font-bold text-xs text-[#28C8C0] block mb-1">2. {isRtl ? 'الاعتماد الأكاديمي' : 'Faculty Approval'}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal block">{isRtl ? 'يراجع المشرف الأكاديمي المشروع ويعتمده' : 'Supervisors review and approve'}</span>
                  </div>
                  <div className="p-3.5 bg-white dark:bg-[#152550] rounded-2xl border border-slate-200 dark:border-white/5 shadow-xs">
                    <span className="font-bold text-xs text-emerald-600 dark:text-[#77DCC1] block mb-1">3. {isRtl ? 'استقبال الطلاب' : 'Receive Teams'}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal block">{isRtl ? 'يتقدم الطلاب لبدء التنفيذ وتشكيل الفرق' : 'Students apply and begin building'}</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:from-[#1D7BC3] hover:to-[#20aba3] text-white px-7 py-3 rounded-xl text-xs font-bold transition shadow-lg shadow-[#2499F2]/25 active:scale-95 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{t('company.post_project_btn')}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myCompanyProjects.map((p) => {
                const projectApps = applications.filter((a) => a.project_id === p.id);
                const curM = p.currentMembers || 0;
                const maxM = p.maxMembers || 4;
                const isProjectFull = curM >= maxM;

                return (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-[#2499F2]/40 p-5 rounded-2xl flex flex-col justify-between transition-all duration-200 shadow-sm"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] bg-slate-100 dark:bg-[#152550] text-slate-800 dark:text-slate-300 border border-slate-300/80 dark:border-[#2499F2]/20 px-2.5 py-0.5 rounded-md font-semibold">
                          {translateMajor(p.category)}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            p.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/10 dark:text-[#77DCC1] dark:border-[#28C8C0]/30'
                              : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                          }`}
                        >
                          {p.status === 'approved'
                            ? t('company.status_approved')
                            : t('company.status_pending')}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white mb-2">{p.title}</h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 mb-3 leading-relaxed">{p.description}</p>

                      <div className="text-xs text-slate-600 dark:text-slate-400 mb-2 flex items-center justify-between font-medium">
                        <span>{t('company.capacity')}</span>
                        <strong className="text-slate-900 dark:text-white font-bold">
                          {t('company.seats_reserved', {
                            current: curM,
                            max: maxM
                          })}
                        </strong>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-[#152550] rounded-full h-2 overflow-hidden mb-4">
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

                    <div className="pt-3 border-t border-slate-300/80 dark:border-white/5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openApplicationsModal(p.id)}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-[#152550] dark:hover:bg-[#182b5c] text-slate-800 dark:text-white text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95 border border-slate-300/80 dark:border-[#2499F2]/20 font-bold"
                      >
                        <Users className="w-3.5 h-3.5 text-[#2499F2] dark:text-[#28C8C0]" />
                        {t('company.applicants_requests', {
                          count: projectApps.length
                        })}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveChatProject(p)}
                        className="bg-slate-100 dark:bg-[#152550] hover:bg-slate-200 dark:hover:bg-[#182b5c] border border-slate-300/80 dark:border-[#2499F2]/20 text-slate-800 dark:text-slate-200 text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95 font-semibold"
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
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
              {currentUser?.name || ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/approvals"
              className="p-5 bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-amber-400 dark:hover:border-amber-500/50 rounded-2xl transition-all duration-200 group shadow-sm hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{isRtl ? 'المشاريع بانتظار الاعتماد' : 'Pending Approvals'}</span>
                <CheckCircle2 className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition">
                {pendingApprovalsCount}
              </div>
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold mt-2 inline-flex items-center gap-1">
                {isRtl ? 'مراجعة وتدقيق المشاريع' : 'Review Projects'} <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              to="/reports"
              className="p-5 bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-[#2499F2] dark:hover:border-[#2499F2]/50 rounded-2xl transition-all duration-200 group shadow-sm hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{isRtl ? 'مراحل التقارير' : 'Report Milestones'}</span>
                <Clock className="w-5 h-5 text-[#2499F2] dark:text-[#28C8C0]" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-[#2499F2] dark:group-hover:text-[#28C8C0] transition">
                {reportsTimeline.length} {isRtl ? 'مراحل' : 'Phases'}
              </div>
              <span className="text-[11px] text-[#1875bb] dark:text-[#28C8C0] font-bold mt-2 inline-flex items-center gap-1">
                {isRtl ? 'متابعة تقييم الطلبة' : 'Student Submissions'} <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              to="/teams"
              className="p-5 bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 hover:border-emerald-400 dark:hover:border-[#28C8C0]/50 rounded-2xl transition-all duration-200 group shadow-sm hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{isRtl ? 'شعبة التخرج 1' : 'Graduation Section 1'}</span>
                <Users className="w-5 h-5 text-emerald-600 dark:text-[#77DCC1]" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-[#77DCC1] transition">
                {studentsList.length} {isRtl ? 'طالباً مسجلاً' : 'Students'}
              </div>
              <span className="text-[11px] text-emerald-800 dark:text-[#77DCC1] font-bold mt-2 inline-flex items-center gap-1">
                {isRtl ? 'إدارة الملاحظات والتسكين' : 'Manage Students'} <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>

          {/* معاينة سريعة للمشاريع المعلقة للمشرف مع أزرار الاعتماد المباشر */}
          {pendingApprovalsCount > 0 && (
            <div className="bg-white dark:bg-[#101E42] border border-amber-300 dark:border-amber-500/30 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>{isRtl ? 'مشاريع بانتظار قرار الاعتماد الفوري' : 'Projects Pending Immediate Approval'}</span>
                </h4>
                <Link to="/approvals" className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-bold">
                  {isRtl ? 'عرض الكل' : 'View All'} ({pendingApprovalsCount})
                </Link>
              </div>

              <div className="space-y-2">
                {rawProjects.filter((p) => p.status === 'pending').slice(0, 3).map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 dark:bg-[#152550]/70 rounded-xl flex items-center justify-between gap-3 text-xs border border-slate-300/80 dark:border-[#2499F2]/20">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white block truncate">{p.title}</span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">{translateMajor(p.category)}</span>
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
            <div className="p-5 bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {isRtl ? 'طلبات الانضمام والشراكة' : 'Submitted Applications'}
                </h4>
                <span className="text-xs bg-blue-50 text-[#1875bb] dark:bg-[#2499F2]/10 dark:text-[#2499F2] px-2.5 py-0.5 rounded-full font-bold border border-blue-200 dark:border-transparent">
                  {myApplications.length}
                </span>
              </div>
              {myApplications.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
                  {isRtl ? 'لم تقدم طلبات انضمام بعد. تصفح المشاريع وقدم طلبك الآن!' : 'No applications submitted yet. Browse projects to apply!'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myApplications.map((app) => (
                    <div
                      key={app.id}
                      className="p-3 bg-slate-50 dark:bg-[#152550]/60 rounded-xl flex items-center justify-between text-xs border border-slate-300/80 dark:border-[#2499F2]/20"
                    >
                      <span className="text-slate-800 dark:text-slate-300 font-semibold">
                        {isRtl ? `طلب رقم #${app.id}` : `Application #${app.id}`}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          app.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/10 dark:text-[#77DCC1] dark:border-[#28C8C0]/30'
                            : app.status === 'rejected'
                              ? 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
                              : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                        }`}
                      >
                        {app.status === 'accepted' ? (isRtl ? 'مقبول' : 'Accepted') : app.status === 'rejected' ? (isRtl ? 'مرفوض' : 'Rejected') : (isRtl ? 'قيد المراجعة' : 'Pending')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 bg-white dark:bg-[#101E42] border border-slate-300/80 dark:border-[#2499F2]/20 rounded-2xl flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {isRtl ? 'المرحلة القادمة لتسليم التقارير' : 'Upcoming Milestone'}
                  </h4>
                  <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                </div>
                {reportsTimeline.length > 0 ? (
                  <>
                    <p className="text-xs text-slate-900 dark:text-slate-200 font-bold leading-snug">
                      {reportsTimeline[0]?.title}
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-2 font-semibold">
                      {isRtl ? `الموعد النهائي: ${reportsTimeline[0]?.deadlineDay || ''} (${reportsTimeline[0]?.deadlineDate || ''})` : `Deadline: ${reportsTimeline[0]?.deadlineDay || ''} (${reportsTimeline[0]?.deadlineDate || ''})`}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isRtl ? 'لا توجد تقارير أو مراحل تسليم مجدولة حالياً.' : 'No upcoming milestones scheduled.'}
                  </p>
                )}
              </div>
              <div className="pt-4 mt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
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
