/**
 * Capstone Market Platform - My Project & Progress Page
 * Developed and engineered by: Mohamad Abu Saleh
 * LinkedIn: https://www.linkedin.com/in/mohamad-abu-saleh-598255350
 * Email: mohamadabusaleh83@gmail.com
 **/
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Briefcase,
  Plus,
  CheckCircle2,
  Users,
  ShieldCheck,
  FileText,
  Calendar,
  ChevronRight,
  MessageSquare,
  FolderKanban,
  Compass,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function MyProjectsPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    isRtl,
    rawProjects,
    isLoadingProjects,
    applications,
    setIsCreateModalOpen,
    reportsTimeline,
    setActiveChatProject,
    myProject
  } = useApp();

  // فحص ما إذا كان الطالب مرشحاً من شركة بانتظار الاعتماد الأكاديمي
  const nominatedApp = useMemo(() => {
    if (!currentUser) return null;
    return (applications || []).find(
      (a) =>
        (a?.student_id === currentUser?.id || String(a?.student_id) === String(currentUser?.id)) &&
        (a?.status === 'company_accepted' || a?.status === 'pending_academic_approval')
    );
  }, [currentUser, applications]);

  // جلب المشروع الفعلي التابع للطالب من قاعدة البيانات حصراً دون أي بيانات وهمية
  const studentProject = useMemo(() => {
    if (!currentUser) return null;

    let baseProject = myProject;

    // 1. فحص طلبات الانضمام المعتمدة أكاديمياً ورسمياً في حال لم يكن myProject محملاً بعد
    if (!baseProject) {
      const acceptedApp = (applications || []).find(
        (a) =>
          (a?.student_id === currentUser?.id ||
            (currentUser?.id && String(a?.student_id) === String(currentUser?.id))) &&
          (a?.status === 'accepted' || a?.status === 'academically_approved')
      );
      if (acceptedApp) {
        baseProject = (rawProjects || []).find((p) => p?.id === acceptedApp?.project_id);
      }
    }

    // 2. فحص المشاريع التي أنشأها الطالب بنفسه
    if (!baseProject) {
      baseProject = (rawProjects || []).find(
        (p) =>
          p?.created_by === currentUser?.id ||
          (currentUser?.id && String(p?.created_by) === String(currentUser?.id))
      );
    }

    if (!baseProject) return null;

    const isApproved = baseProject?.status === 'approved';
    const isRejected = baseProject?.status === 'rejected';

    // احتساب تقارير ومراحل هذا المشروع حصراً
    const projMilestones = (reportsTimeline || []).filter(
      (r) => !r.project_id || r.project_id === baseProject.id
    );
    const totalReports = projMilestones.length;
    const approvedReports = projMilestones.filter((r) => r.status === 'approved').length;
    const calculatedProgress = totalReports > 0 ? Math.round((approvedReports / totalReports) * 100) : 0;

    // جلب أعضاء الفريق المقبولين فعلياً بالمشروع
    const acceptedTeam = (applications || [])
      .filter((a) => a.project_id === baseProject.id && a.status === 'accepted')
      .map((a) => ({
        name: a.student_name || (isRtl ? `طالب #${a.student_id}` : `Student #${a.student_id}`),
        role: a.message?.includes('Role:') ? a.message.split('Role:')[1]?.split(']')[0]?.trim() : (isRtl ? 'عضو فريق ومطور' : 'Team Developer'),
        avatar: '👨‍🎓'
      }));

    if (acceptedTeam.length === 0) {
      acceptedTeam.push({
        name: currentUser?.name || (isRtl ? 'طالب خريج' : 'Student'),
        role: isRtl ? 'قائد المشروع ومطور' : 'Project Lead & Developer',
        avatar: '👨‍🎓'
      });
    }

    return {
      id: baseProject.id,
      title: baseProject.title || (isRtl ? 'مشروع تخرج' : 'Capstone Project'),
      description: baseProject.description || '',
      supervisor: baseProject.supervisor_name || null,
      status: baseProject.status || 'pending',
      statusLabel: isApproved
        ? (isRtl ? 'معتمد أكاديمياً' : 'Academically Approved')
        : isRejected
        ? (isRtl ? 'مرفوض' : 'Rejected')
        : (isRtl ? 'قيد المراجعة والاعتماد' : 'Pending Approval'),
      progress: calculatedProgress,
      members: acceptedTeam,
      techStack: Array.isArray(baseProject.skills) && baseProject.skills.length > 0
        ? baseProject.skills
        : (typeof baseProject.required_skills === 'string' && baseProject.required_skills
          ? baseProject.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
          : []),
      companyPartner: baseProject.company_name || null
    };
  }, [currentUser, myProject, applications, rawProjects, reportsTimeline, isRtl]);

  // مراحل التسليم والتقارير الأكاديمية الحقيقية الخاصة بمشروع الطالب
  const milestones = useMemo(() => {
    if (!studentProject?.id) return [];
    return (reportsTimeline || []).filter(
      (r) => !r.project_id || r.project_id === studentProject.id
    );
  }, [reportsTimeline, studentProject?.id]);

  // شاشة التحميل (Loading State)
  if (isLoadingProjects && (!rawProjects || rawProjects.length === 0)) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/25 flex items-center justify-center shadow-lg">
          <RefreshCw className="w-6 h-6 text-[#2499F2] dark:text-[#28C8C0] animate-spin" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {isRtl ? 'جاري تحميل بيانات مشروعك...' : 'Loading your project details...'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isRtl ? 'يرجى الانتظار لحظات ريثما يتم الاتصال بقاعدة البيانات' : 'Connecting to Capstone Market database'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* مسار التنقل والترويسة العلوية */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2499F2]/20">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <Link to="/dashboard" className="hover:text-[#2499F2] transition">
              {t('sidebar.dashboard', isRtl ? 'الرئيسية' : 'Dashboard')}
            </Link>
            <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              {isRtl ? 'مشروعي ومتابعة التخرج' : 'My Project & Progress'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-[#2499F2] dark:text-[#28C8C0]" />
            <span>{isRtl ? 'مشروع التخرج الخاص بي' : 'My Capstone Project'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'متابعة مراحل المشروع، الاعتماد الأكاديمي، التقارير الدورية، والشركاء الصناعيين.'
              : 'Track capstone progress, faculty approvals, milestone deliverables, and company partnerships.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:opacity-95 text-[#101E42] font-black text-xs shadow-md shadow-[#2499F2]/20 transition cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-[#101E42]" />
          <span>{isRtl ? 'إضافة / اقتراح مشروع تخرج' : 'Add / Propose Project'}</span>
        </button>
      </div>

      {/* في حال وجود ترشيح صناعي من شركة بانتظار الاعتماد الأكاديمي */}
      {nominatedApp && (!studentProject || studentProject.status !== 'approved') && (
        <div className="bg-gradient-to-r from-amber-500/10 via-[#2499F2]/10 to-[#28C8C0]/10 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 text-start shadow-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-xl shrink-0">
              🌟
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-2.5 py-0.5 rounded-full">
                {isRtl ? 'ترشيح صناعي من الشركة' : 'Company Nomination'}
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                {isRtl ? 'تم ترشيحك بنجاح من قِبل الشركة الراعية! ⏳ بانتظار الاعتماد الأكاديمي' : 'You have been nominated! ⏳ Awaiting Academic Approval'}
              </h2>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-[#101E42]/80 border border-amber-200/60 dark:border-amber-500/20 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">{isRtl ? 'المشروع المرشح له:' : 'Nominated Project:'}</span>
              <span className="font-bold text-slate-800 dark:text-white">{nominatedApp.project_title || (isRtl ? 'مشروع التخرج' : 'Capstone Project')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">{isRtl ? 'الشركة الراعية:' : 'Company:'}</span>
              <span className="font-bold text-[#2499F2]">{nominatedApp.company_name || (isRtl ? 'شركة معتمدة' : 'Partner Company')}</span>
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
              ? 'قبول الشركة لطلبك هو ترشيح صناعي رسمي. ستُفتح مساحة العمل الفعالة ومراحل رفع التقارير تلقائياً فور اعتماد المشرف الأكاديمي للترشيح.'
              : 'The company acceptance is an official industry nomination. Active workspace and report milestones will unlock automatically once your supervisor approves.'}
          </p>
        </div>
      )}

      {/* في حال عدم وجود مشروع: عرض واجهة فارغة أنيقة ومنظمة (Empty State UI) */}
      {!studentProject ? (
        <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-8 sm:p-14 text-center shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#2499F2]/10 dark:bg-[#2499F2]/20 border border-[#2499F2]/30 flex items-center justify-center text-[#2499F2] dark:text-[#28C8C0] shadow-lg shadow-[#2499F2]/15">
            <FolderKanban className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {isRtl ? 'لم تقم بإنشاء أو الانضمام إلى أي مشروع تخرج بعد' : 'You have not created or joined a capstone project yet'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {isRtl
                ? 'يمكنك اقتراح فكرة مشروع تخرج جديدة وتقديمها للمشرف الأكاديمي، أو استكشاف المشاريع وحلول الشركات المتاحة والتقديم للانضمام إلى فرق العمل.'
                : 'You can propose a new capstone project to your academic supervisor, or explore existing projects to apply and join an active team.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#2499F2] to-[#1D7BC3] hover:from-[#1D7BC3] hover:to-[#175E95] text-white font-black text-xs shadow-md shadow-[#2499F2]/25 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'اقترح / أضف مشروع تخرج الآن' : 'Propose / Add Capstone Project Now'}</span>
            </button>

            <Link
              to="/projects"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 dark:bg-[#152550] hover:bg-slate-200 dark:hover:bg-[#182b5c] text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-white/10 transition cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#28C8C0]" />
              <span>{isRtl ? 'استعراض المشاريع المتاحة' : 'Explore Available Projects'}</span>
            </Link>
          </div>
        </div>
      ) : (
        /* في حال وجود مشروع: عرض البطاقة الرئيسية وتفاصيل المتابعة */
        <div className="space-y-6">
          {/* بطاقة المشروع الرئيسية الفخمة */}
          <div className="bg-[#101E42] text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl border border-[#2499F2]/25">
            <div className="absolute top-0 end-0 w-96 h-96 bg-[#28C8C0]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                      studentProject?.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : studentProject?.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{studentProject?.statusLabel || (isRtl ? 'قيد المتابعة' : 'In Progress')}</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#2499F2]/20 text-[#77DCC1] border border-[#2499F2]/30 text-xs font-bold">
                    {isRtl ? 'مشروع تخرج 2' : 'Capstone 2'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-300 flex items-center gap-1.5 font-mono">
                    <Calendar className="w-4 h-4 text-[#28C8C0]" />
                    <span>{isRtl ? 'الفصل الأكاديمي الحالي 2026' : 'Academic Year 2026'}</span>
                  </div>

                  {setActiveChatProject && (
                    <button
                      type="button"
                      onClick={() => setActiveChatProject(studentProject)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition cursor-pointer"
                      title={isRtl ? 'فتح شات المشروع المباشر' : 'Open project chat'}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#28C8C0]" />
                      <span>{isRtl ? 'شات المشروع' : 'Project Chat'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {studentProject?.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                  {studentProject?.description}
                </p>
              </div>

              {/* شريط الإنجاز العام */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2 max-w-2xl">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">
                    {isRtl ? 'نسبة التقدم العام في المشروع:' : 'Overall Project Progress:'}
                  </span>
                  <span className="text-[#28C8C0] font-mono text-sm">
                    {studentProject?.progress || 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#2499F2] to-[#28C8C0] h-full rounded-full transition-all duration-500"
                    style={{ width: `${studentProject?.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* معلومات المشرف والشركة وأعضاء الفريق */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-3.5 rounded-2xl bg-[#0B152E]/80 border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">
                      {isRtl ? 'المشرف الأكاديمي' : 'Supervisor'}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {studentProject?.supervisor || (isRtl ? 'لم يُسند بعد' : 'Not assigned yet')}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0B152E]/80 border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2499F2]/20 text-[#2499F2] flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">
                      {isRtl ? 'الجهة الراعية / الشريكة' : 'Partner Company'}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {studentProject?.companyPartner || (isRtl ? 'رعاية أكاديمية مباشرة' : 'Direct Academic Track')}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0B152E]/80 border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">
                      {isRtl ? 'أعضاء الفريق' : 'Team Members'}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {studentProject?.members?.length || 1} {isRtl ? 'أعضاء' : 'Members'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* أعضاء الفريق ومراحل التسليم والتقارير */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* بطاقة أعضاء الفريق */}
            <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/10">
                <Users className="w-4 h-4 text-[#2499F2]" />
                <span>{isRtl ? 'فريق العمل الطلابي' : 'Student Team Members'}</span>
              </h3>

              <div className="space-y-3">
                {(studentProject?.members || []).map((member, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B152E] border border-slate-200 dark:border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{member?.avatar || '👨‍🎓'}</div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {member?.name || (isRtl ? 'عضو فريق' : 'Member')}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {member?.role || (isRtl ? 'مطور برمجيات' : 'Developer')}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-[#28C8C0]/15 text-[#28C8C0] px-2 py-0.5 rounded-full font-bold">
                      {i === 0 ? (isRtl ? 'قائد الفريق' : 'Lead') : (isRtl ? 'عضو' : 'Member')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  to="/teams"
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-[#0B152E] hover:bg-[#2499F2]/15 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-[#2499F2]" />
                  <span>{isRtl ? 'عرض شُعب التخرج والملتقى' : 'View Teams Hub'}</span>
                </Link>
              </div>
            </div>

            {/* مراحل التسليم والتقارير الأكاديمية */}
            <div className="lg:col-span-2 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#28C8C0]" />
                  <span>{isRtl ? 'مراحل التسليم والتقارير الدورية' : 'Milestone Deliverables'}</span>
                </h3>
                <Link
                  to="/reports"
                  className="text-xs text-[#2499F2] hover:underline font-bold"
                >
                  {isRtl ? 'فتح مركز التقارير الكامل ←' : 'Open Reports Page →'}
                </Link>
              </div>

              <div className="space-y-3">
                {milestones.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    {isRtl ? 'لا توجد تقارير أو مراحل تسليم مسجلة حالياً.' : 'No milestones scheduled yet.'}
                  </div>
                ) : (
                  milestones.map((m, idx) => (
                    <div
                      key={m?.id ?? idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B152E] border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {m?.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                          {m?.deadlineDay && (
                            <span>
                              {isRtl ? 'الموعد:' : 'Deadline:'} {m.deadlineDay}
                            </span>
                          )}
                          {m?.deadlineDay && m?.supervisorFeedback && <span>•</span>}
                          {m?.supervisorFeedback && (
                            <span className="text-amber-500 font-semibold truncate max-w-md">
                              {m.supervisorFeedback}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                            m?.status === 'submitted'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                          }`}
                        >
                          {m?.status === 'submitted'
                            ? (isRtl ? '✓ تم التسليم' : 'Submitted')
                            : (isRtl ? '⏳ قيد الإنجاز' : 'Pending')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
