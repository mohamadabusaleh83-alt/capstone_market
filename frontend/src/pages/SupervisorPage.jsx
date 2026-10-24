/**
 * Capstone Market Platform - Supervisor Dashboard & Approvals Page
 * Developed and engineered by: Mohamad Abu Saleh
 * LinkedIn: https://www.linkedin.com/in/mohamad-abu-saleh-598255350
 * Email: mohamadabusaleh83@gmail.com
 **/
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { API_URL, INITIAL_FALLBACK_PROJECTS } from '../api/client';
import {
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Check,
  X,
  MessageSquare,
  Clock,
  Users,
  AlertTriangle,
  ChevronRight,
  Filter,
  Layers,
  Search,
  RotateCcw
} from 'lucide-react';

export default function SupervisorPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    rawProjects,
    fetchProjects: appFetchProjects,
    approveProject,
    setActiveChatProject,
    showToast,
    isRtl
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [localProjects, setLocalProjects] = useState([]);
  const [reviewFilterStatus, setReviewFilterStatus] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');

  // ========================================================
  // 1. مؤقت أمان تلقائي (Safety Timeout):
  // إذا استمر loading = true لأكثر من 1.5 ثانية، يتم إيقافه
  // تلقائياً وتفعيل البيانات البديلة المتاحة فوراً لمنع تعليق الشاشة
  // ========================================================
  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setLoading(false);
        // في حال كانت المشاريع فارغة، يتم تعبئة المشاريع البديلة للمشرف
        setLocalProjects((prev) => (prev.length > 0 ? prev : (rawProjects.length > 0 ? rawProjects : INITIAL_FALLBACK_PROJECTS)));
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [loading, rawProjects]);

  // ========================================================
  // 2. دالة جلب بيانات المشرف والمشاريع مع كتلة finally {} مؤكدة
  // ========================================================
  const loadSupervisorData = useCallback(async () => {
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // محاولة استدعاء الباك إند
      const res = await fetch(`${API_URL}/projects/`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((p) => ({
            id: p.id,
            title: p.title || (isRtl ? 'مشروع تخرج' : 'Capstone Project'),
            description: p.description || '',
            status: p.status || 'pending',
            required_skills: p.required_skills || '',
            skills: p.required_skills
              ? p.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
              : ['React', 'FastAPI'],
            created_by: p.created_by,
            maxMembers: p.max_members || 4,
            currentMembers: p.current_members !== undefined ? p.current_members : 1,
            availableSeats: Math.max(0, (p.max_members || 4) - (p.current_members || 1))
          }));
          setLocalProjects(formatted);
          return;
        }
      }

      // في حال عدم توفر رد من السيرفر، استخدام المشاريع المتاحة
      setLocalProjects(rawProjects.length > 0 ? rawProjects : INITIAL_FALLBACK_PROJECTS);
    } catch {
      // الاعتماد السلس على البيانات الاحتياطية للمشرف
      setLocalProjects(rawProjects.length > 0 ? rawProjects : INITIAL_FALLBACK_PROJECTS);
    } finally {
      clearTimeout(timeoutId);
      // التأكيد القاطع على إيقاف حالة التحميل
      setLoading(false);
    }
  }, [rawProjects, isRtl]);

  // المزامنة مع بيانات السياق العام
  useEffect(() => {
    if (rawProjects && rawProjects.length > 0) {
      setLocalProjects(rawProjects);
      setLoading(false);
    } else {
      loadSupervisorData();
    }
  }, [rawProjects, loadSupervisorData]);

  // ========================================================
  // 3. إجراءات المشرف الأكاديمي (اعتماد / رفض / إعادة مراجعة)
  // ========================================================
  const handleApprove = async (projectId) => {
    setLocalProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: 'approved' } : p))
    );
    try {
      if (approveProject) await approveProject(projectId, 'approved');
    } catch {
      // Ignored - local state already updated
    }
    if (showToast) {
      showToast(isRtl ? 'تم اعتماد المشروع أكاديمياً بنجاح!' : 'Project approved successfully!', 'success');
    }
  };

  const handleReject = async (projectId) => {
    setLocalProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: 'rejected' } : p))
    );
    try {
      if (approveProject) await approveProject(projectId, 'rejected');
    } catch {
      // Ignored
    }
    if (showToast) {
      showToast(isRtl ? 'تم رفض المشروع وإرسال الملاحظات للطلبة' : 'Project marked as rejected', 'info');
    }
  };

  const handleResetPending = async (projectId) => {
    setLocalProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: 'pending' } : p))
    );
    try {
      if (approveProject) await approveProject(projectId, 'pending');
    } catch {
      // Ignored
    }
    if (showToast) {
      showToast(isRtl ? 'تمت إعادة المشروع لحالة قيد المراجعة' : 'Project reset to pending review', 'info');
    }
  };

  // ========================================================
  // 4. الحسابات والإحصائيات التصفوية
  // ========================================================
  const pendingCount = useMemo(() => localProjects.filter((p) => p.status === 'pending').length, [localProjects]);
  const approvedCount = useMemo(() => localProjects.filter((p) => p.status === 'approved').length, [localProjects]);
  const rejectedCount = useMemo(() => localProjects.filter((p) => p.status === 'rejected').length, [localProjects]);
  const totalCount = localProjects.length;

  const filteredProjects = useMemo(() => {
    return localProjects.filter((p) => {
      const matchesFilter = reviewFilterStatus === 'all' || p.status === reviewFilterStatus;
      const matchesSearch =
        !searchQuery ||
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [localProjects, reviewFilterStatus, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-200">
      {/* 1. مسار التنقل والترويسة العلوية */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2499F2]/20">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <Link to="/dashboard" className="hover:text-[#2499F2] transition">
              {t('sidebar.dashboard', isRtl ? 'الرئيسية' : 'Dashboard')}
            </Link>
            <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              {isRtl ? 'لوحة المشرف الأكاديمي والاعتمادات' : 'Supervisor Dashboard & Approvals'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 flex-wrap">
            <ShieldCheck className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            <span>{isRtl ? 'لوحة متابعة ومراجعة المشاريع الأكاديمية' : 'Academic Supervisor Review Hub'}</span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-2.5 py-0.5 rounded-full">
              {currentUser?.name || (isRtl ? 'د. أسامة أمين مرعي' : 'Dr. Osama Marei')}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'مراجعة مقترحات التخرج، التدقيق الفني والأكاديمي، واعتماد فرق العمل والشركاء الصناعيين.'
              : 'Review capstone proposals, manage academic approvals, and oversee student collaborations.'}
          </p>
        </div>

        {/* أزرار الإجراءات السريعة */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={async () => {
              if (appFetchProjects) appFetchProjects();
              await loadSupervisorData();
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#152550] hover:bg-slate-50 dark:hover:bg-[#182b5c] text-slate-700 dark:text-white text-xs font-bold border border-slate-200 dark:border-[#2499F2]/20 shadow-sm transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-[#2499F2] dark:text-[#28C8C0] ${loading ? 'animate-spin' : ''}`} />
            <span>{isRtl ? 'تحديث القائمة' : 'Refresh List'}</span>
          </button>

          <Link
            to="/teams"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:opacity-95 text-[#101E42] font-black text-xs shadow-md shadow-[#2499F2]/20 transition cursor-pointer active:scale-95"
          >
            <Users className="w-4 h-4" />
            <span>{isRtl ? 'الفرق والطلاب' : 'Teams & Students'}</span>
          </Link>
        </div>
      </div>

      {/* 2. بطاقات المؤشرات الإحصائية الأربعة (Metrics Overview) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* إجمالي المشاريع */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/25 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {isRtl ? 'إجمالي المشاريع' : 'Total Projects'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#2499F2]/10 dark:bg-[#2499F2]/20 flex items-center justify-center text-[#2499F2]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</p>
          <span className="text-[10px] text-slate-400 block">{isRtl ? 'مقترحة في المنصة' : 'Listed in platform'}</span>
        </div>

        {/* مشاريع بانتظار الاعتماد */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-[#101E42] border border-amber-200 dark:border-amber-500/30 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
              {isRtl ? 'بانتظار الاعتماد' : 'Pending Approval'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{pendingCount}</p>
          <span className="text-[10px] text-amber-600 dark:text-amber-400/80 block">
            {pendingCount > 0 ? (isRtl ? 'تتطلب قراراً أكاديمياً' : 'Action required') : (isRtl ? 'تمت مراجعة الكل' : 'All clear')}
          </span>
        </div>

        {/* مشاريع معتمدة */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-[#101E42] border border-emerald-200 dark:border-emerald-500/30 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              {isRtl ? 'مشاريع معتمدة' : 'Approved Projects'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{approvedCount}</p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400/80 block">{isRtl ? 'مؤهلة للتنفيذ والرعاية' : 'Active & ready'}</span>
        </div>

        {/* مشاريع بحاجة لتعديل أو مرفوضة */}
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 dark:bg-[#101E42] border border-rose-200 dark:border-rose-500/30 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
              {isRtl ? 'مشاريع مرفوضة' : 'Rejected'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <X className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300">{rejectedCount}</p>
          <span className="text-[10px] text-rose-600 dark:text-rose-400/80 block">{isRtl ? 'تم توجيه ملاحظات' : 'Feedback issued'}</span>
        </div>
      </div>

      {/* 3. شريط البحث والتصفية بحسب الحالة */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#101E42] p-3.5 rounded-2xl border border-slate-200 dark:border-[#2499F2]/20 shadow-sm">
        {/* أزرار التصفية السريعة */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold me-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>{isRtl ? 'تصفية:' : 'Filter:'}</span>
          </span>

          <button
            type="button"
            onClick={() => setReviewFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              reviewFilterStatus === 'all'
                ? 'bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] shadow-sm font-black'
                : 'bg-slate-100 dark:bg-[#152550] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isRtl ? `كافة المشاريع (${totalCount})` : `All (${totalCount})`}
          </button>

          <button
            type="button"
            onClick={() => setReviewFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              reviewFilterStatus === 'pending'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            <span>{isRtl ? 'بانتظار الاعتماد' : 'Pending'}</span>
            <span className="bg-amber-600/20 text-amber-800 dark:text-amber-200 px-1.5 py-0.2 rounded-full text-[10px]">
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setReviewFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              reviewFilterStatus === 'approved'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            {isRtl ? `المعتمدة (${approvedCount})` : `Approved (${approvedCount})`}
          </button>

          <button
            type="button"
            onClick={() => setReviewFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              reviewFilterStatus === 'rejected'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            {isRtl ? `المرفوضة (${rejectedCount})` : `Rejected (${rejectedCount})`}
          </button>
        </div>

        {/* حقل البحث */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? 'بحث في المشاريع...' : 'Search projects...'}
            className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] transition ps-8"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* 4. محتوى قائمة المشاريع أو شاشة التحميل */}
      {loading ? (
        <div className="text-center py-20 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-8 max-w-md mx-auto space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shadow-lg">
            <RefreshCw className="w-6 h-6 text-amber-500 dark:text-amber-400 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isRtl ? 'جاري مراجعة طلبات المشاريع...' : 'Loading supervisor projects...'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isRtl ? 'الاتصال بقاعدة البيانات ومزامنة قرارات الاعتماد' : 'Connecting to database'}
            </p>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl text-slate-500 dark:text-slate-400 text-xs shadow-sm space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <p className="font-bold text-slate-800 dark:text-slate-200">
            {isRtl ? 'لا توجد مشاريع تخرج مطابقة للتصفية الحالية' : 'No projects found matching the filter'}
          </p>
          <button
            type="button"
            onClick={() => {
              setReviewFilterStatus('all');
              setSearchQuery('');
            }}
            className="text-xs text-[#2499F2] dark:text-[#28C8C0] font-bold hover:underline cursor-pointer"
          >
            {isRtl ? 'إعادة ضبط التصفية' : 'Reset filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProjects.map((project) => {
            const isApproved = project.status === 'approved';
            const isRejected = project.status === 'rejected';
            const isPending = !isApproved && !isRejected;

            return (
              <div
                key={project.id}
                className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 p-5 sm:p-6 rounded-3xl flex flex-col justify-between hover:border-[#2499F2]/40 transition shadow-sm dark:shadow-[0_4px_25px_-5px_rgba(16,30,66,0.6)] space-y-4"
              >
                <div>
                  {/* شارة الحالة والمقاعد */}
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                          : isRejected
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {isApproved
                        ? (isRtl ? 'معتمد أكاديمياً' : 'Academically Approved')
                        : isRejected
                          ? (isRtl ? 'مرفوض / بحاجة لتعديل' : 'Rejected / Revision Needed')
                          : (isRtl ? 'قيد المراجعة والاعتماد' : 'Pending Approval')}
                    </span>

                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                      <Users className="w-3.5 h-3.5 text-[#2499F2]" />
                      <span>{project.currentMembers || 1} / {project.maxMembers || 4} {isRtl ? 'أعضاء' : 'members'}</span>
                    </span>
                  </div>

                  {/* عنوان ووصف المشروع */}
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 leading-snug">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {project.description || (isRtl ? 'مشروع تخرج نوعي يهدف إلى ربط أبحاث الطلبة باحتياجات السوق الحقيقية.' : 'Academic graduation project designed to bridge student research with market needs.')}
                  </p>

                  {/* المهارات المطلوبة */}
                  {project.skills && project.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
                      {project.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[10px] bg-slate-100 dark:bg-[#152550] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/5 font-mono"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* أزرار الإجراءات والاعتماد الفوري للمشرف */}
                <div className="pt-4 border-t border-slate-100 dark:border-[#2499F2]/15 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {/* زر الاعتماد */}
                    <button
                      type="button"
                      onClick={() => handleApprove(project.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm ${
                        isApproved
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'اعتماد' : 'Approve'}</span>
                    </button>

                    {/* زر الرفض */}
                    <button
                      type="button"
                      onClick={() => handleReject(project.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm ${
                        isRejected
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'رفض' : 'Reject'}</span>
                    </button>

                    {/* زر إعادة المراجعة في حال كان معتمداً أو مرفوضاً */}
                    {!isPending && (
                      <button
                        type="button"
                        onClick={() => handleResetPending(project.id)}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#152550] hover:bg-slate-200 dark:hover:bg-[#182b5c] text-slate-600 dark:text-slate-300 transition cursor-pointer"
                        title={isRtl ? 'إعادة لقيد المراجعة' : 'Reset to pending'}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* زر نقاش المشروع */}
                  <button
                    type="button"
                    onClick={() => {
                      if (setActiveChatProject) setActiveChatProject(project);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#152550] hover:bg-slate-200 dark:hover:bg-[#182b5c] text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-white/10"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#2499F2]" />
                    <span>{isRtl ? 'نقاش الفريق' : 'Chat'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
