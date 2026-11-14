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
import { API_URL } from '../api/client';
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
  Sparkles,
  Building2,
  Trash2,
  GraduationCap,
  FileText
} from 'lucide-react';
import MajorBadge from '../components/MajorBadge';
import DeleteProjectModal from '../components/DeleteProjectModal';
import SupervisorAIAnalysisView from '../components/SupervisorAIAnalysisView';
import { STANDARDIZED_IT_MAJORS, matchStandardMajor } from '../api/majors';

export default function SupervisorPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    rawProjects,
    applications = [],
    fetchProjects: appFetchProjects,
    fetchApplications,
    approveProject,
    updateProjectSeats,
    deleteProject,
    updateApplicationStatus,
    setActiveChatProject,
    openUserCv,
    showToast,
    isRtl
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [localProjects, setLocalProjects] = useState([]);
  const [reviewFilterStatus, setReviewFilterStatus] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [appFeedbackMap, setAppFeedbackMap] = useState({});
  const [projectFeedbackMap, setProjectFeedbackMap] = useState({});
  const [projectSeatsMap, setProjectSeatsMap] = useState({});
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [approvalsActiveTab, setApprovalsActiveTab] = useState('nominations'); // 'nominations' | 'projects'
  const [nominationMajorFilter, setNominationMajorFilter] = useState('all');
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

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
        setLocalProjects((prev) => (prev.length > 0 ? prev : (rawProjects.length > 0 ? rawProjects : [])));
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
      // المشرف يحتاج التوكن لرؤية المشاريع المعلقة والمرفوضة
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/projects/`, {
        signal: controller.signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map((p) => {
            const totalSeats = p.total_seats ?? p.seats ?? p.max_members ?? 4;
            const acceptedStudents = p.accepted_students_count ?? p.current_members ?? 0;
            const remainingSeats = p.remaining_seats ?? p.available_seats ?? Math.max(0, totalSeats - acceptedStudents);
            return {
              id: p.id,
              title: p.title || (isRtl ? 'مشروع تخرج' : 'Capstone Project'),
              description: p.description || '',
              status: p.status || 'pending',
              required_skills: p.required_skills || '',
              skills: p.required_skills
                ? p.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
                : [],
              created_by: p.created_by,
              supervisor_id: p.supervisor_id || null,
              supervisor_feedback: p.supervisor_feedback || null,
              seats: totalSeats,
              total_seats: totalSeats,
              maxMembers: totalSeats,
              max_members: totalSeats,
              currentMembers: acceptedStudents,
              current_members: acceptedStudents,
              accepted_students_count: acceptedStudents,
              availableSeats: remainingSeats,
              available_seats: remainingSeats,
              remaining_seats: remainingSeats,
              submitted_applications_count: p.submitted_applications_count ?? 0,
              decided_at: p.decided_at || null,
              rejected_at: p.rejected_at || null
            };
          });
          setLocalProjects(formatted);
          return;
        }
      }

      setLocalProjects(rawProjects || []);
    } catch {
      setLocalProjects(rawProjects || []);
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
  // 3. إجراءات المشرف الأكاديمي (اعتماد ترشيحات ومشاريع)
  // ========================================================
  const handleApprove = async (projectId) => {
    const feedback = projectFeedbackMap[projectId] || '';
    const rawSeats = projectSeatsMap[projectId];
    const seats = rawSeats ? parseInt(rawSeats, 10) : null;

    setLocalProjects((prev) =>
      prev.map((p) => (p.id === projectId ? {
        ...p,
        status: 'approved',
        supervisor_feedback: feedback,
        seats: seats || p.seats || p.maxMembers || 4,
        total_seats: seats || p.total_seats || p.maxMembers || 4,
        maxMembers: seats || p.maxMembers || 4
      } : p))
    );
    try {
      if (approveProject) await approveProject(projectId, 'approved', feedback, seats);
      if (appFetchProjects) await appFetchProjects();
      await loadSupervisorData();
      if (showToast) {
        showToast(isRtl ? 'تم اعتماد المشروع أكاديمياً بنجاح!' : 'Project approved successfully!', 'success');
      }
    } catch {
      // Ignored - error toast shown by context
    }
  };

  const handleReject = async (projectId) => {
    const feedback = projectFeedbackMap[projectId] || '';
    setLocalProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: 'rejected', supervisor_feedback: feedback } : p))
    );
    try {
      if (approveProject) await approveProject(projectId, 'rejected', feedback);
      if (appFetchProjects) await appFetchProjects();
      await loadSupervisorData();
      if (showToast) {
        showToast(isRtl ? 'تم رفض المشروع وإرسال الملاحظات' : 'Project marked as rejected', 'info');
      }
    } catch {
      // Ignored
    }
  };

  const handleUpdateSeats = async (projectId) => {
    const rawSeats = projectSeatsMap[projectId];
    const seats = parseInt(rawSeats, 10);
    if (!seats || seats < 1) {
      showToast(isRtl ? 'يرجى إدخال عدد مقاعد صحيح وموجب' : 'Please enter a valid positive integer for seats', 'error');
      return;
    }
    try {
      if (updateProjectSeats) {
        await updateProjectSeats(projectId, seats);
        if (appFetchProjects) await appFetchProjects();
        await loadSupervisorData();
      }
    } catch {
      // Ignored
    }
  };

  // اعتماد ترشيح الطالب أكاديمياً وتفعيل مساحة العمل له
  const handleApproveApplication = async (appId) => {
    setIsSubmittingAction(true);
    try {
      const feedback = appFeedbackMap[appId] || '';
      await updateApplicationStatus(appId, 'academically_approved', feedback);
      if (appFetchProjects) await appFetchProjects();
      if (fetchApplications) await fetchApplications();
      showToast(isRtl ? 'تم الاعتماد الأكاديمي الرسمي وتفعيل مساحة العمل للطالب!' : 'Academic approval granted and workspace unlocked!', 'success');
    } catch {
      // Handled in context
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // رفض ترشيح الطالب وتوجيه الملاحظات
  const handleRejectApplication = async (appId) => {
    setIsSubmittingAction(true);
    try {
      const feedback = appFeedbackMap[appId] || '';
      await updateApplicationStatus(appId, 'rejected', feedback);
      if (fetchApplications) await fetchApplications();
      showToast(isRtl ? 'تم رفض الترشيح وتوجيه الملاحظات للطالب والشركة' : 'Nomination rejected with feedback', 'info');
    } catch {
      // Handled in context
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // ========================================================
  // 4. الحسابات والإحصائيات التصفوية
  // ========================================================
  const pendingCount = useMemo(() => localProjects.filter((p) => p.status === 'pending').length, [localProjects]);
  const approvedCount = useMemo(() => localProjects.filter((p) => p.status === 'approved').length, [localProjects]);
  const rejectedCount = useMemo(() => localProjects.filter((p) => p.status === 'rejected').length, [localProjects]);
  const totalCount = localProjects.length;

  const studentApplications = useMemo(() => {
    return (applications || []).filter(
      (a) => ['applied', 'pending', 'company_accepted', 'pending_academic_approval'].includes(a.status)
    );
  }, [applications]);

  const filteredStudentApplications = useMemo(() => {
    return studentApplications.filter((app) => {
      if (nominationMajorFilter === 'all') return true;
      const appMajor = (app.major || app.student_major || '').trim().toLowerCase();
      if (nominationMajorFilter === 'other') {
        return appMajor && !matchStandardMajor(appMajor);
      }
      const matched = matchStandardMajor(appMajor);
      return matched?.key === nominationMajorFilter;
    });
  }, [studentApplications, nominationMajorFilter]);

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeletingProject(true);
    try {
      const ok = await deleteProject(projectToDelete.id);
      if (ok) {
        setLocalProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
        setProjectToDelete(null);
      }
    } finally {
      setIsDeletingProject(false);
    }
  };

  // المشرف يدير المشاريع غير المسندة أو المسندة إليه فقط (الأدمن يدير الكل) - مطابق لقواعد الخادم
  const canManage = useCallback((project) => {
    if (currentUser?.role === 'admin') return true;
    return !project?.supervisor_id || project.supervisor_id === currentUser?.id;
  }, [currentUser?.role, currentUser?.id]);

  const canManageApp = useCallback((app) => {
    const project = localProjects.find((p) => p.id === app.project_id) || rawProjects.find((p) => p.id === app.project_id);
    return canManage(project);
  }, [localProjects, rawProjects, canManage]);

  const assignedElsewhereNote = (
    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
      {isRtl ? 'مسند لمشرف آخر - للاطلاع فقط' : 'Assigned to another supervisor - view only'}
    </p>
  );

  const pendingProjectsList = useMemo(() => {
    return localProjects.filter((p) => p.status === 'pending');
  }, [localProjects]);

  // عرض تدريجي للقوائم الطويلة (24 عنصراً في كل مرة)
  const PAGE_SIZE = 24;
  const [pendingVisible, setPendingVisible] = useState(PAGE_SIZE);
  const [listVisible, setListVisible] = useState(PAGE_SIZE);
  const showMoreButton = (remaining, onClick) => (
    <div className="flex justify-center pt-2">
      <button
        type="button"
        onClick={onClick}
        className="px-5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#101E42] border border-slate-300 dark:border-[#2499F2]/30 text-slate-800 dark:text-white cursor-pointer"
      >
        {t('common.show_more', { count: remaining })}
      </button>
    </div>
  );

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
              {currentUser?.name || ''}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* 2.5. قسم طلبات اعتماد المشاريع والترشيحات المعلقة (Pending Academic Approvals) */}
      <section className="bg-white dark:bg-[#101E42] border border-amber-200/80 dark:border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isRtl ? 'طلبات انضمام الطلاب ومقترحات المشاريع المعلقة' : 'Pending Academic Approvals & Student Applications'}
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono">
                  {studentApplications.length + pendingProjectsList.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isRtl
                  ? 'المشرف الأكاديمي يملك الصلاحية الحصرية لمنح الاعتماد النهائي للطلبات وتحديد مقاعد المشاريع وتفعيل مساحات العمل.'
                  : 'Faculty supervisor holds exclusive authority to evaluate student applications, set seat capacities, and grant final project approval.'}
              </p>
            </div>
          </div>

          {/* تبديل التبويبات بين طلبات الطلاب ومقترحات المشاريع */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-[#152550] rounded-2xl border border-slate-200 dark:border-white/5 shrink-0">
            <button
              type="button"
              onClick={() => setApprovalsActiveTab('nominations')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                approvalsActiveTab === 'nominations'
                  ? 'bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRtl ? 'طلبات الطلاب الأكاديمية' : 'Student Applications'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/40 text-slate-900 font-bold">
                {studentApplications.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setApprovalsActiveTab('projects')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                approvalsActiveTab === 'projects'
                  ? 'bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isRtl ? 'مقترحات المشاريع' : 'Project Proposals'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/40 text-slate-900 font-bold">
                {pendingProjectsList.length}
              </span>
            </button>
          </div>
        </div>

        {/* محتوى التبويب الأول: طلبات الطلاب الأكاديمية */}
        {approvalsActiveTab === 'nominations' && (
          <div className="space-y-4">
            {/* شريط الفلترة حسب التخصص الأكاديمي */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-[#152550]/40 border border-slate-200/80 dark:border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <GraduationCap className="w-4 h-4 text-[#2499F2]" />
                <span>{t('majors.filter_by_major', isRtl ? 'تصفية حسب التخصص:' : 'Filter by Major:')}</span>
              </div>
              <div className="w-full sm:w-64">
                <select
                  value={nominationMajorFilter}
                  onChange={(e) => setNominationMajorFilter(e.target.value)}
                  className="w-full bg-white dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#2499F2] transition cursor-pointer"
                >
                  <option value="all">{t('majors.all', isRtl ? 'جميع التخصصات' : 'All Majors')} ({studentApplications.length})</option>
                  {STANDARDIZED_IT_MAJORS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {isRtl ? m.ar : m.en}
                    </option>
                  ))}
                  <option value="other">{t('majors.other', isRtl ? 'أخرى / تحديد تخصص آخر' : 'Other / Add Custom')}</option>
                </select>
              </div>
            </div>

            {filteredStudentApplications.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 dark:bg-[#152550]/40 border border-slate-200/80 dark:border-white/5 text-slate-500 dark:text-slate-400 text-xs space-y-1.5">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {studentApplications.length === 0
                    ? (isRtl ? 'لا توجد طلبات انضمام طلاب معلقة حالياً' : 'No pending student applications')
                    : (isRtl ? 'لا توجد طلبات مطابقة للتخصص المحدد' : 'No applications matching the selected major')}
                </p>
                {nominationMajorFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setNominationMajorFilter('all')}
                    className="text-xs text-[#2499F2] dark:text-[#28C8C0] font-bold hover:underline cursor-pointer"
                  >
                    {isRtl ? 'عرض جميع التخصصات' : 'Show All Majors'}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStudentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#152550]/60 border border-amber-300/80 dark:border-amber-500/30 flex flex-col justify-between space-y-4 hover:border-amber-400 transition shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-sm shrink-0">
                            🎓
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                                {app.student_name || `#${app.student_id}`}
                              </h3>
                              <MajorBadge major={app.major || app.student_major} />
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                              {app.student_email}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 flex items-center gap-1 shrink-0 animate-pulse">
                          <Clock className="w-3 h-3" />
                          <span>{isRtl ? 'طلب انضمام بانتظارك' : 'Pending Review'}</span>
                        </span>
                      </div>

                      {/* تفاصيل المشروع والشركة */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#101E42] border border-slate-200 dark:border-white/10 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">{isRtl ? 'المشروع:' : 'Project:'}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={app.project_title}>
                            {app.project_title}
                          </span>
                        </div>
                        {app.company_name && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">{isRtl ? 'الشركة الراعية:' : 'Company:'}</span>
                            <span className="font-bold text-[#2499F2] flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>{app.company_name}</span>
                            </span>
                          </div>
                        )}
                        {app.student_major && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">{isRtl ? 'التخصص:' : 'Major:'}</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{app.student_major}</span>
                          </div>
                        )}
                        {app.message && (
                          <div className="pt-1.5 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-600 dark:text-slate-400 italic">
                            &quot;{app.message}&quot;
                          </div>
                        )}
                      </div>

                      {/* عرض السيرة الذاتية للطالب إن وجدت للمشرف */}
                      {app.student_has_cv && (
                        <div>
                          <button
                            type="button"
                            onClick={() => openUserCv(app.student_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#152550] hover:bg-slate-200 dark:hover:bg-[#182b5c] text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-white/10 shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#2499F2]" />
                            <span>{isRtl ? 'عرض السيرة الذاتية الأكاديمية (CV)' : 'View Academic CV'}</span>
                          </button>
                        </div>
                      )}

                      {/* حقل ملاحظات وتوجيهات المشرف */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {isRtl ? 'ملاحظات وتوجيهات المشرف الأكاديمي:' : 'Supervisor Notes & Guidance:'}
                        </label>
                        <input
                          type="text"
                          value={appFeedbackMap[app.id] || ''}
                          onChange={(e) => setAppFeedbackMap((prev) => ({ ...prev, [app.id]: e.target.value }))}
                          placeholder={isRtl ? 'اكتب ملاحظاتك الأكاديمية أو شروط الاعتماد هنا...' : 'Enter academic approval notes...'}
                          className="w-full bg-white dark:bg-[#101E42] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] transition"
                        />
                      </div>
                    </div>

                    {/* أزرار القرار الأكاديمي */}
                    {canManageApp(app) ? (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApproveApplication(app.id)}
                        disabled={isSubmittingAction}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'اعتماد أكاديمي رسمي وتفعيل مساحة العمل 🎓' : 'Academic Sign-Off & Unlock Workspace'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectApplication(app.id)}
                        disabled={isSubmittingAction}
                        className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'رفض' : 'Reject'}</span>
                      </button>
                    </div>
                    ) : assignedElsewhereNote}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* محتوى التبويب الثاني: مقترحات المشاريع الجديدة بانتظار الاعتماد */}
        {approvalsActiveTab === 'projects' && (
          <div>
            {pendingProjectsList.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 dark:bg-[#152550]/40 border border-slate-200/80 dark:border-white/5 text-slate-500 dark:text-slate-400 text-xs space-y-1.5">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {isRtl ? 'لا توجد مشاريع جديدة بانتظار الاعتماد حالياً' : 'No project proposals pending approval'}
                </p>
                <p className="text-[11px]">
                  {isRtl ? 'كافة مقترحات مشاريع التخرج تمت مراجعتها واتخاذ القرار بشأنها.' : 'All capstone proposals have been reviewed.'}
                </p>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingProjectsList.slice(0, pendingVisible).map((project) => (
                  <div
                    key={project.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#152550]/60 border border-amber-300/80 dark:border-amber-500/30 flex flex-col justify-between space-y-4 hover:border-amber-400 transition shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                            {project.title}
                          </h3>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            {isRtl ? `مقترح مشروع #${project.id}` : `Proposal #${project.id}`}
                          </span>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 flex items-center gap-1 shrink-0 animate-pulse">
                          <Clock className="w-3 h-3" />
                          <span>{isRtl ? 'بانتظار الاعتماد' : 'Pending'}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {project.description || (isRtl ? 'مشروع تخرج مقترح يربط بين الجانب الأكاديمي وسوق العمل.' : 'Proposed graduation project.')}
                      </p>

                      {/* تحليل الذكاء الاصطناعي للمشروع إن وجد (Phase 2) */}
                      <SupervisorAIAnalysisView project={project} isRtl={isRtl} />

                      {/* تحديد المقاعد والملاحظات */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {isRtl ? 'عدد المقاعد:' : 'Seats Capacity:'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={projectSeatsMap[project.id] ?? (project.seats || project.maxMembers || 4)}
                            onChange={(e) => setProjectSeatsMap((prev) => ({ ...prev, [project.id]: e.target.value }))}
                            className="w-full bg-white dark:bg-[#101E42] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white font-mono font-bold focus:outline-none focus:border-[#2499F2] transition"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {isRtl ? 'ملاحظات المشرف على المشروع:' : 'Supervisor Feedback & Notes:'}
                          </label>
                          <input
                            type="text"
                            value={projectFeedbackMap[project.id] || ''}
                            onChange={(e) => setProjectFeedbackMap((prev) => ({ ...prev, [project.id]: e.target.value }))}
                            placeholder={isRtl ? 'اكتب ملاحظات التعديل أو شروط القبول...' : 'Enter feedback notes...'}
                            className="w-full bg-white dark:bg-[#101E42] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] transition"
                          />
                        </div>
                      </div>
                    </div>

                    {/* أزرار القرار الأكاديمي للمشروع */}
                    {canManage(project) ? (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(project.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'اعتماد المشروع رسمياً 🎓' : 'Approve Project'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReject(project.id)}
                        className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold transition active:scale-95 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'رفض' : 'Reject'}</span>
                      </button>
                    </div>
                    ) : assignedElsewhereNote}
                  </div>
                ))}
              </div>
              {pendingProjectsList.length > pendingVisible && showMoreButton(pendingProjectsList.length - pendingVisible, () => setPendingVisible((n) => n + PAGE_SIZE))}
              </>
            )}
          </div>
        )}
      </section>

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
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.slice(0, listVisible).map((project) => {
            const isApproved = project.status === 'approved';
            const isRejected = project.status === 'rejected';
            const isPending = !isApproved && !isRejected;
            const manageable = canManage(project);

            const totalSeats = project.total_seats ?? project.seats ?? project.maxMembers ?? 4;
            const acceptedCount = project.accepted_students_count ?? project.currentMembers ?? 0;
            const remainingSeats = project.remaining_seats ?? project.availableSeats ?? Math.max(0, totalSeats - acceptedCount);
            const submittedCount = project.submitted_applications_count ?? 0;
            const isSeatsFull = remainingSeats <= 0 || acceptedCount >= totalSeats;

            return (
              <div
                key={project.id}
                className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 p-5 sm:p-6 rounded-3xl flex flex-col justify-between hover:border-[#2499F2]/40 transition shadow-sm dark:shadow-[0_4px_25px_-5px_rgba(16,30,66,0.6)] space-y-4"
              >
                <div className="space-y-3">
                  {/* شارة الحالة والمقاعد */}
                  <div className="flex justify-between items-start gap-2">
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
                        ? (isRtl ? 'معتمد أكاديمياً 🎓' : 'Academically Approved')
                        : isRejected
                          ? (isRtl ? 'مرفوض / بحاجة لتعديل' : 'Rejected / Revision Needed')
                          : (isRtl ? 'قيد المراجعة والاعتماد' : 'Pending Approval')}
                    </span>

                    {isSeatsFull ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40 animate-pulse font-mono">
                        {isRtl ? 'المقاعد مكتملة (Seats Full)' : 'Seats Full'}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                        <Users className="w-3.5 h-3.5 text-[#2499F2]" />
                        <span>{acceptedCount} / {totalSeats} {isRtl ? 'مقاعد مشغولة' : 'seats filled'}</span>
                      </span>
                    )}
                  </div>

                  {/* عنوان ووصف المشروع */}
                  <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {project.description || (isRtl ? 'مشروع تخرج نوعي يهدف إلى ربط أبحاث الطلبة باحتياجات السوق الحقيقية.' : 'Academic graduation project designed to bridge student research with market needs.')}
                  </p>

                  {/* تفاصيل إحصاءات المقاعد والطلبات */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#152550]/40 border border-slate-200/80 dark:border-white/5 text-[11px]">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">{isRtl ? 'إجمالي المقاعد:' : 'Total Seats:'}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{totalSeats}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">{isRtl ? 'المقبولون:' : 'Accepted:'}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{acceptedCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">{isRtl ? 'المتبقي:' : 'Remaining:'}</span>
                      <span className={`font-bold font-mono ${isSeatsFull ? 'text-rose-600 dark:text-rose-400' : 'text-[#2499F2]'}`}>
                        {isSeatsFull ? (isRtl ? 'مكتملة' : 'Full') : remainingSeats}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">{isRtl ? 'الطلبات:' : 'Applied:'}</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{submittedCount}</span>
                    </div>
                  </div>

                  {/* سبب الرفض إن وجد */}
                  {isRejected && project.supervisor_feedback && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300">
                      <span className="font-bold block mb-0.5">{isRtl ? 'سبب الرفض والملاحظات الأكاديمية:' : 'Rejection Reason & Academic Notes:'}</span>
                      <span>{project.supervisor_feedback}</span>
                    </div>
                  )}

                  {/* المهارات المطلوبة */}
                  {project.skills && project.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
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
                <div className="pt-4 border-t border-slate-100 dark:border-[#2499F2]/15 space-y-2">
                  {manageable ? (
                    <div>
                      {isPending && (
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                              {isRtl ? 'عدد المقاعد:' : 'Seats:'}
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={projectSeatsMap[project.id] ?? totalSeats}
                              onChange={(e) => setProjectSeatsMap((prev) => ({ ...prev, [project.id]: e.target.value }))}
                              className="w-20 bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-white font-mono font-bold focus:outline-none focus:border-[#2499F2]"
                            />
                          </div>

                          <input
                            type="text"
                            value={projectFeedbackMap[project.id] || ''}
                            onChange={(e) => setProjectFeedbackMap((prev) => ({ ...prev, [project.id]: e.target.value }))}
                            placeholder={isRtl ? 'ملاحظات وتوجيهات المشرف...' : 'Academic notes...'}
                            className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2]"
                          />

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(project.id)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isRtl ? 'اعتماد المشروع' : 'Approve'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReject(project.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-200 dark:border-rose-800"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>{isRtl ? 'رفض' : 'Reject'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {isApproved && (
                        <div className="flex items-center justify-between gap-2 mb-2 p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                              {isRtl ? 'تعديل المقاعد:' : 'Edit Seats:'}
                            </span>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={projectSeatsMap[project.id] ?? totalSeats}
                              onChange={(e) => setProjectSeatsMap((prev) => ({ ...prev, [project.id]: e.target.value }))}
                              className="w-16 bg-white dark:bg-[#0B152E] border border-slate-300 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-white font-mono font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateSeats(project.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#2499F2] hover:bg-[#1d7bc3] text-white transition cursor-pointer shadow-sm"
                            >
                              {isRtl ? 'حفظ' : 'Save'}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        {/* زر الحذف النهائي للمشروع للمشرف */}
                        <button
                          type="button"
                          onClick={() => setProjectToDelete(project)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white border border-rose-200 dark:border-rose-800 transition cursor-pointer active:scale-95 shadow-sm"
                          title={t('delete_project.tooltip', 'حذف المشروع نهائياً')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t('delete_project.button', 'حذف المشروع')}</span>
                        </button>

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
                  ) : assignedElsewhereNote}
                </div>
              </div>
            );
          })}
        </div>
        {filteredProjects.length > listVisible && showMoreButton(filteredProjects.length - listVisible, () => setListVisible((n) => n + PAGE_SIZE))}
        </>
      )}

      {/* مودال التأكيد الصارم لحذف المشروع نهائياً للمشرف */}
      <DeleteProjectModal
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        project={projectToDelete}
        isDeleting={isDeletingProject}
        onConfirm={handleConfirmDeleteProject}
      />
    </div>
  );
}
