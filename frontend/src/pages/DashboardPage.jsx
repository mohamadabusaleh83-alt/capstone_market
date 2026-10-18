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
  PieChart
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
    setActiveChatProject,
    translateMajor,
    reportsTimeline,
    isRtl
  } = useApp();

  // المشاريع التي تخص الشركة الحالية
  const myCompanyProjects = rawProjects.filter(
    (p) => p.created_by === currentUser?.id || currentUser?.role === 'company'
  );

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
  
  const pendingApplicationsCount = applications.filter((a) => a.status === 'pending').length;

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
      'from-blue-500 to-indigo-500',
      'from-emerald-500 to-teal-500',
      'from-purple-500 to-pink-500',
      'from-amber-500 to-orange-500',
      'from-cyan-500 to-blue-500'
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
      {/* 1. ترويسة لوحة التحكم العصرية بتأثير الزجاج (Glassmorphic Header) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 rounded-3xl shadow-sm dark:shadow-xl">
        <div className="absolute -top-24 -end-24 w-64 h-64 bg-cyan-500/5 dark:bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -start-24 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                {t('dashboard.role_overview')}: {currentUser.title}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              {currentUser.role === 'company' && <Store className="w-6 h-6 text-amber-500 dark:text-amber-400" />}
              {currentUser.role === 'supervisor' && <ShieldCheck className="w-6 h-6 text-amber-500 dark:text-amber-400" />}
              {currentUser.role === 'student' && <Briefcase className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />}
              <span>{t('dashboard.title')}</span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              {t('dashboard.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {currentUser.role === 'company' && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-cyan-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('company.post_project_btn')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchProjects}
              className="bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
              title={t('company.refresh_list')}
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="hidden sm:inline">{t('company.refresh_list')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. بطاقات الإحصائيات العصرية Glassmorphism Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* إجمالي المشاريع */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 p-5 rounded-2xl shadow-sm dark:shadow-lg transition-all duration-300 group hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('dashboard.stat_total_projects')}</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-slate-800 border border-cyan-500/20 dark:border-slate-700 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{totalProjects}</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              {isRtl ? 'مشروع مسجل' : 'Projects'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 truncate">
            {isRtl ? `${approvedProjects} معتمد • ${pendingProjects} معلق` : `${approvedProjects} Approved • ${pendingProjects} Pending`}
          </p>
        </div>

        {/* المشاريع المعتمدة */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800/40 p-5 rounded-2xl shadow-sm dark:shadow-lg transition-all duration-300 group hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('dashboard.stat_approved_projects')}</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{approvedProjects}</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
              {totalProjects > 0 ? Math.round((approvedProjects / totalProjects) * 100) : 0}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 truncate">
            {isRtl ? 'جاهزة للتقديم واستقبال الطلبات' : 'Available for student applications'}
          </p>
        </div>

        {/* نسبة إشغال المقاعد */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800/40 p-5 rounded-2xl shadow-sm dark:shadow-lg transition-all duration-300 group hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('dashboard.stat_seats_occupancy')}</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{totalOccupiedSeats}</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              / {totalMaxSeats} {isRtl ? 'مقعد' : 'seats'}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </div>

        {/* الطلبات المعلقة */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800/40 p-5 rounded-2xl shadow-sm dark:shadow-lg transition-all duration-300 group hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('dashboard.stat_pending_apps')}</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{pendingApplicationsCount}</span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
              {isRtl ? 'بانتظار القرار' : 'Awaiting Review'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 truncate">
            {isRtl ? `إجمالي الطلبات الكلية: ${applications.length}` : `Total applications: ${applications.length}`}
          </p>
        </div>
      </div>

      {/* 3. الرسوم البيانية التفاعلية الديناميكية المتصلة ببيانات السيرفر الفعلية */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* الرسم 1: توزيع المشاريع حسب التقنيات والمسارات (Bar Chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
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
                        <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <span className="text-slate-900 dark:text-white font-bold">{item.count} {isRtl ? 'مشاريع' : 'projects'}</span>
                        <span className="text-slate-400 dark:text-slate-500">({item.percent}%)</span>
                      </div>
                    </div>
                    {/* شريط الرسم البياني */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800/90 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${item.gradient} transition-all duration-700`}
                        style={{ width: `${Math.max(8, item.percent)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{isRtl ? 'يتم التحديث تلقائياً مع كل مشروع جديد يضاف لقاعدة البيانات' : 'Automatically updated with projects in database'}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Live API ✓</span>
          </div>
        </div>

        {/* الرسم 2: مؤشر إشغال المقاعد الكلي (Circular Radial Progress Doughnut) */}
        <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                {/* مسار الخلفية الرمادي */}
                <circle
                  cx="65"
                  cy="65"
                  r={circleRadius}
                  className="text-slate-200 dark:text-slate-800"
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
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">{t('dashboard.reserved_seats')}</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{totalOccupiedSeats}</span>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">{t('dashboard.available_seats')}</span>
                <span className="text-sm font-black text-cyan-600 dark:text-cyan-400">{totalAvailableSeats}</span>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">{t('dashboard.total_capacity')}</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-300">{totalMaxSeats}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800/80 text-center text-[11px] text-slate-500 dark:text-slate-400">
            {isRtl ? `الشاغر المتاح للطلبة: ${totalAvailableSeats} مقعداً` : `${totalAvailableSeats} open seats remaining`}
          </div>
        </div>
      </div>

      {/* 4. الأقسام المخصصة حسب دور المستخدم الحالي (Role Details) */}
      {currentUser.role === 'company' && (
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span>{t('company.my_projects_title', { count: myCompanyProjects.length })}</span>
            </h3>
            <button
              type="button"
              onClick={fetchProjects}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {t('company.refresh_list')}
            </button>
          </div>

          {myCompanyProjects.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3 shadow-sm">
              <Briefcase className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">{isRtl ? 'لم تقم شركتك بطرح أي مشاريع حتى الآن.' : 'No projects posted yet.'}</p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
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
                    className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-5 rounded-2xl flex flex-col justify-between transition-all duration-200 shadow-sm"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-md">
                          {translateMajor(p.category)}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            p.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                          }`}
                        >
                          {p.status === 'approved'
                            ? t('company.status_approved')
                            : t('company.status_pending')}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white mb-2">{p.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-3">{p.description}</p>

                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                        <span>{t('company.capacity')}</span>
                        <strong className="text-slate-800 dark:text-white">
                          {t('company.seats_reserved', {
                            current: curM,
                            max: maxM
                          })}
                        </strong>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-4">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isProjectFull ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (curM / maxM) * 100)}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setShowApplicationsModal(true)}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        {t('company.applicants_requests', {
                          count: projectApps.length
                        })}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveChatProject(p)}
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
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

      {currentUser.role === 'supervisor' && (
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <span>{isRtl ? 'إجراءات ومتابعة المشرف السريعة' : 'Supervisor Quick Actions'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/approvals"
              className="p-5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 rounded-2xl transition-all duration-200 group shadow-sm hover:-translate-y-0.5"
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
              className="p-5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500/50 rounded-2xl transition-all duration-200 group shadow-sm hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">{isRtl ? 'مراحل التقارير' : 'Report Milestones'}</span>
                <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">
                {reportsTimeline.length} {isRtl ? 'مراحل' : 'Phases'}
              </div>
              <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold mt-2 inline-flex items-center gap-1">
                {isRtl ? 'متابعة تقييم الطلبة' : 'Student Submissions'} <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              to="/teams"
              className="p-5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 rounded-2xl transition-all duration-200 group shadow-sm hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">{isRtl ? 'شعبة التخرج 1' : 'Graduation Section 1'}</span>
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                {isRtl ? 'كشف الطلاب' : 'Student Roster'}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 inline-flex items-center gap-1">
                {isRtl ? 'إدارة الملاحظات والتسكين' : 'Manage Students'} <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </div>
      )}

      {currentUser.role === 'student' && (
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{isRtl ? 'حالة طلباتك والتسليمات الأكاديمية' : 'Your Applications & Submissions'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{isRtl ? 'طلبات الانضمام المقدمة' : 'Submitted Applications'}</h4>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-cyan-700 dark:text-cyan-400 font-bold">
                  {myApplications.length}
                </span>
              </div>
              {myApplications.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
                  {isRtl ? 'لم تقدم طلبات انضمام بعد. تصفح المشاريع وقدم طلبك الآن!' : 'No applications submitted yet. Browse projects to apply!'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myApplications.map((app) => (
                    <div
                      key={app.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs border border-slate-200 dark:border-slate-700/50"
                    >
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{isRtl ? `طلب رقم #${app.id}` : `Application #${app.id}`}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          app.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
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

            <div className="p-5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{isRtl ? 'المرحلة القادمة لتسليم التقارير' : 'Upcoming Milestone'}</h4>
                  <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-bold leading-snug">
                  {reportsTimeline[0]?.title}
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
                  {isRtl ? `الموعد النهائي: ${reportsTimeline[0]?.deadlineDay} (${reportsTimeline[0]?.deadlineDate})` : `Deadline: ${reportsTimeline[0]?.deadlineDay} (${reportsTimeline[0]?.deadlineDate})`}
                </p>
              </div>
              <div className="pt-4 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <Link
                  to="/reports"
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 flex items-center gap-1 font-bold transition"
                >
                  <span>{isRtl ? 'استعراض كافة التسليمات' : 'View Submissions'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/cv"
                  className="text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 shadow-sm"
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
