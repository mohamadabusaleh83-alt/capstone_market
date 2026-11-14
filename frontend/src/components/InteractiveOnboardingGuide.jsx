import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Compass,
  MessageSquare,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Building2,
  ArrowRight,
  ArrowLeft,
  X,
  Rocket,
  Check
} from 'lucide-react';

export default function InteractiveOnboardingGuide() {
  const { currentUser } = useAuth();
  const { isRtl, isInteractiveGuideOpen, setIsInteractiveGuideOpen } = useApp();

  const [currentStep, setCurrentStep] = useState(0);

  // إظهار الدليل تلقائياً عند أول دخول للمستخدم في المتصفح
  useEffect(() => {
    if (!currentUser) return;
    const storageKey = `has_seen_onboarding_guide_${currentUser.id || currentUser.email || 'user'}`;
    const hasSeen = localStorage.getItem(storageKey);

    if (!hasSeen) {
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setIsInteractiveGuideOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentUser, setIsInteractiveGuideOpen]);

  // إعادة ضبط الخطوة الأولى عند كل فتح يدوي للدليل
  useEffect(() => {
    if (isInteractiveGuideOpen) {
      setCurrentStep(0);
    }
  }, [isInteractiveGuideOpen]);

  // إغلاق النافذة وتثبيت حالة المشاهدة في التخزين المحلي
  const handleComplete = useCallback(() => {
    if (currentUser) {
      const storageKey = `has_seen_onboarding_guide_${currentUser.id || currentUser.email || 'user'}`;
      localStorage.setItem(storageKey, 'true');
    }
    setIsInteractiveGuideOpen(false);
  }, [currentUser, setIsInteractiveGuideOpen]);

  // الاستماع لزر Escape للإغلاق السلس
  useEffect(() => {
    if (!isInteractiveGuideOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInteractiveGuideOpen, handleComplete]);

  // تحديد نوع الدور لتخصيص المحتوى الذكي
  const userRole = useMemo(() => {
    const raw = (currentUser?.role || '').toLowerCase();
    if (['company', 'partner', 'business'].includes(raw)) return 'partner';
    if (raw === 'supervisor') return 'supervisor';
    if (raw === 'admin') return 'admin';
    return 'student';
  }, [currentUser?.role]);

  // نصوص وخطوات الدليل المخصصة لكل دور بدقة تامة
  const guideContent = useMemo(() => {
    switch (userRole) {
      case 'partner':
        return {
          roleBadge: isRtl ? 'دليل الشريك الصناعي والشركات' : 'Industry Partner Guide',
          roleSub: isRtl ? '3 خطوات أساسية لرعاية وإطلاق مشاريع التخرج الريادية' : '3 Key Steps to Sponsor & Launch Capstone Challenges',
          steps: [
            {
              stepNum: 1,
              icon: Briefcase,
              color: 'from-[#2499F2] to-[#1D7BC3]',
              iconBg: 'bg-[#2499F2]/10 text-[#2499F2] dark:text-[#28C8C0]',
              title: isRtl ? 'اطرح تحدياً برمجياً أو مشروع تخرج' : 'Post a Technical Challenge or Capstone',
              desc: isRtl
                ? 'انشر احتياجات مؤسستك ومشكلاتها الهندسية التي تحتاج إلى حلول رقمية، وحدد المهارات التقنية المطلوبة، والمخصصات المالية أو المكافآت التشجيعية (Stipend)، والحد الأقصى المقترح لأعضاء الفريق الطلابي.'
                : 'Publish real-world engineering and software challenges. Define required skill sets, optional stipend/incentives, and proposed team capacity.',
              highlight: isRtl ? 'المهارات المحددة تغذي خوارزمية المطابقة الذكية لاستقطاب الطلاب الأنسب.' : 'Defined skills power AI-matching to attract top student talent.'
            },
            {
              stepNum: 2,
              icon: Clock,
              color: 'from-amber-500 to-orange-500',
              iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
              title: isRtl ? 'انتظر اعتماد المشرف الأكاديمي وتحديد المقاعد' : 'Await Academic Approval & Seat Allocation',
              desc: isRtl
                ? 'يُحال مشروعك المقترح فورياً إلى المشرفين الأكاديميين لفحص ملاءمته العلمية كمتطلب تخرج معتمد. يملك المشرف الصلاحية الحصرية لضبط وتأكيد عدد المقاعد الأكاديمية (Seat Allocation) واعتماد المشروع.'
                : 'Your proposal is reviewed by academic supervisors for collegiate rigor. The supervisor exclusively sets approved seats and grants institutional validation.',
              highlight: isRtl ? 'المشروع يظهر في السوق العام للطلاب فور صدور الاعتماد الأكاديمي الرسمي.' : 'Projects go live in the public market immediately upon supervisor approval.'
            },
            {
              stepNum: 3,
              icon: MessageSquare,
              color: 'from-emerald-500 to-teal-500',
              iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              title: isRtl ? 'تابع تنفيذ المشروع وتواصل تقنياً مع الطلاب' : 'Monitor Progress & Connect Technically',
              desc: isRtl
                ? 'بعد اعتماد المشرف لترشيح الطلاب واكتمال الفريق، يمكنك استخدام قناة المحادثة الفنية المباشرة لمتابعة المخرجات البرمجية والمراحل التنفيذية، واستقطاب الكفاءات المتميزة للتوظيف المباشر.'
                : 'Once the supervisor accepts candidates, coordinate implementation via the dedicated Technical Chat Channel and recruit top talents.',
              highlight: isRtl ? 'قناة محادثة فنية مباشرة مخصصة لشركتك مع أعضاء الفريق المعتمدين.' : 'Direct technical collaboration channel dedicated to your project team.'
            }
          ]
        };

      case 'supervisor':
        return {
          roleBadge: isRtl ? 'دليل المشرف الأكاديمي' : 'Academic Supervisor Guide',
          roleSub: isRtl ? '3 خطوات لإدارة السيادة العلمية والاعتمادات الأكاديمية' : '3 Key Steps for Academic Governance & Approvals',
          steps: [
            {
              stepNum: 1,
              icon: ShieldCheck,
              color: 'from-[#2499F2] to-indigo-600',
              iconBg: 'bg-[#2499F2]/10 text-[#2499F2] dark:text-[#28C8C0]',
              title: isRtl ? 'راجع مقترحات الشركات واعتمد المناسب منها' : 'Review & Approve Industry Proposals',
              desc: isRtl
                ? 'استعرض مقترحات المشاريع المقدمة حديثاً من الشركات والمؤسسات الشريكة، وافحص تفاصيلها الفنية للتأكد من موافقتها للمعايير الجامعية، ثم اعتمدها بضغطة زر أو قدّم ملاحظات تحسينية.'
                : 'Evaluate company-submitted project proposals for academic merit and capstone standards, with one-click approval or detailed guidance notes.',
              highlight: isRtl ? 'صلاحية حصرية للمشرف فقط لضمان جودة المشاريع الجامعية.' : 'Exclusive supervisor authority ensuring high academic rigor.'
            },
            {
              stepNum: 2,
              icon: Users,
              color: 'from-amber-500 to-amber-600',
              iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
              title: isRtl ? 'اقبل طلبات الطلاب وحدد المقاعد المتاحة' : 'Accept Nominations & Manage Seat Quota',
              desc: isRtl
                ? 'افحص طلبات ترشيح الطلاب وسيرهم الذاتية بصيغة PDF ومعدلاتهم التراكمية، وحدد بدقة عدد المقاعد الأكاديمية المعتمدة لكل مشروع، واعتمد انضمام الطلاب المستحقين للفرق.'
                : 'Review student applications, PDF CVs, and GPAs. Fine-tune seat allocations per project and approve qualified candidates.',
              highlight: isRtl ? 'فحص السيرة الذاتية PDF للطالب وتحديد المقاعد بمرونة كاملة.' : 'Inspect student PDF CVs and set team capacity with full control.'
            },
            {
              stepNum: 3,
              icon: GraduationCap,
              color: 'from-emerald-500 to-teal-500',
              iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              title: isRtl ? 'وجّه الطلاب أكاديمياً عبر قناة الإشراف الخاصة' : 'Mentor Students in Private Supervision Channel',
              desc: isRtl
                ? 'مارس دورك الإشرافي والتوجيهي عبر قناة محادثة إشرافية معزولة تماماً عن الشركات، وتابع تسليم التقارير المرحلية وفصول مشروع التخرج بخصوصية وسرية أكاديمية مطلقة.'
                : 'Supervise research and capstone thesis deliverables in a strictly isolated academic channel protected from external access.',
              highlight: isRtl ? 'عزل أمني صارم ومحمي على مستوى الخادم لسرية التقييم الأكاديمي.' : 'Strict backend-enforced channel isolation ensuring academic privacy.'
            }
          ]
        };

      case 'admin':
        return {
          roleBadge: isRtl ? 'دليل إدارة المنصة' : 'Platform Administrator Guide',
          roleSub: isRtl ? 'نظرة شاملة على الرقابة الأكاديمية وإدارة النظام' : 'Comprehensive System Overview & Governance',
          steps: [
            {
              stepNum: 1,
              icon: Building2,
              color: 'from-[#2499F2] to-cyan-500',
              iconBg: 'bg-[#2499F2]/10 text-[#2499F2] dark:text-[#28C8C0]',
              title: isRtl ? 'إدارة المستخدمين والشراكات المؤسسية' : 'Manage Users & Institutional Partnerships',
              desc: isRtl
                ? 'متابعة حسابات الطلاب، اعتماد حسابات الشركات الشريكة، وتعيين وإسناد صلاحيات المشرفين الأكاديميين بدقة عبر قاعدة البيانات.'
                : 'Administer student accounts, verify corporate partners, and assign supervisor credentials securely.',
              highlight: isRtl ? 'تحكم كامل في الحسابات والأدوار ومصفوفة الصلاحيات.' : 'Full administrative control over accounts, roles, and RBAC.'
            },
            {
              stepNum: 2,
              icon: Compass,
              color: 'from-amber-500 to-orange-500',
              iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
              title: isRtl ? 'متابعة مؤشرات المشاريع والنزاهة الأكاديمية' : 'Monitor Metrics & Academic Integrity',
              desc: isRtl
                ? 'استعراض الإحصائيات الحية لسوق المشاريع، ومتابعة نسب إشغال المقاعد وتوزيع الفرق التخصصية في الجامعة.'
                : 'Track live project market metrics, seat occupancy rates, and departmental capstone distribution.',
              highlight: isRtl ? 'لوحات مراقبة وتقارير إشغال حية ومحدثة لحظياً.' : 'Real-time telemetry and occupancy analytics across all departments.'
            },
            {
              stepNum: 3,
              icon: Sparkles,
              color: 'from-emerald-500 to-teal-500',
              iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              title: isRtl ? 'جاهزية النظام والبيئة السحابية المستقرة' : 'Cloud Reliability & Platform Readiness',
              desc: isRtl
                ? 'المنصة تعمل بتكامل سحابي تام بين الواجهة الأمامية والخلفية وقاعدة بيانات PostgreSQL المدارة بسحابة Neon.'
                : 'Fully integrated cloud infrastructure between Vite frontend, FastAPI backend, and Neon PostgreSQL.',
              highlight: isRtl ? 'بيئة سحابية مؤمنة بنسبة جاهزية 99.9% معزولة الصلاحيات.' : 'Secure, enterprise-grade cloud environment with 99.9% uptime.'
            }
          ]
        };

      case 'student':
      default:
        return {
          roleBadge: isRtl ? 'دليل الطالب المستجد' : 'Student Onboarding Guide',
          roleSub: isRtl ? '3 خطوات أساسية للانطلاق في مشروع تخرجك بنجاح' : '3 Simple Steps to Kickstart Your Capstone Journey',
          steps: [
            {
              stepNum: 1,
              icon: Award,
              color: 'from-[#2499F2] to-blue-600',
              iconBg: 'bg-[#2499F2]/10 text-[#2499F2] dark:text-[#28C8C0]',
              title: isRtl ? 'أكمل ملفك الأكاديمي وسيرتك الذاتية' : 'Complete Profile & Technical Skills',
              desc: isRtl
                ? 'ادخل إلى صفحة السيرة الذاتية (CV) لتسجيل تخصصك ومعدلك الجامعي، وحدد مهاراتك البرمجية والتقنية، وارفع ملف سيرتك الذاتية PDF ليتمكن المشرف الأكاديمي من مراجعة طلبك بدقة.'
                : 'Navigate to your CV page to set your major, GPA, technical skill badges, and upload your PDF resume for supervisor evaluation.',
              highlight: isRtl ? 'مهاراتك المدخلة تُستخدم فوراً لحساب نسبة المطابقة الذكية لكل مشروع.' : 'Your skills dynamically compute your smart match rate for each project.'
            },
            {
              stepNum: 2,
              icon: Compass,
              color: 'from-amber-500 to-orange-500',
              iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
              title: isRtl ? 'تصفح المشاريع المعتمدة وقدّم بطلبك' : 'Browse Approved Projects & Apply',
              desc: isRtl
                ? 'استكشف سوق المشاريع المعتمدة أكاديمياً، ولاحظ نسبة تطابق مهاراتك مع كل تحدي (مثال: 85% مطابقة)، وفلتر المشاريع حسب تخصصك، ثم قدّم طلب ترشيحك بضغطة زر مع رسالة دافع.'
                : 'Explore faculty-approved industry challenges, view your match percentage, filter by academic discipline, and apply with a cover letter.',
              highlight: isRtl ? 'تابع حالة طلبك لحظياً من صفحة مشاريعي حتى اعتماده من المشرف.' : 'Track real-time nomination status in My Projects until supervisor approval.'
            },
            {
              stepNum: 3,
              icon: MessageSquare,
              color: 'from-emerald-500 to-teal-500',
              iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              title: isRtl ? 'تواصل مع الشركة والمشرف في قنوات منفصلة' : 'Connect via Isolated Channels',
              desc: isRtl
                ? 'فور اعتمادك في المشروع، ينفتح لك نظام المحادثات المزدوج: قناة فنية للتنسيق البرمجي والتنفيذي مع ممثلي الشركة، وقناة إشراف أكاديمي خاصة مع الدكتور المشرف بخصوصية تامة.'
                : 'Upon approval, unlock dual-channel chat: a technical channel with company sponsors and a private academic channel with your supervisor.',
              highlight: isRtl ? 'خصوصية تامة: قناة الإشراف مع الدكتور معزولة ومحمية من اطلاع الشركات.' : 'Supervision channel is strictly isolated and inaccessible to companies.'
            }
          ]
        };
    }
  }, [userRole, isRtl]);

  if (!isInteractiveGuideOpen) return null;

  const totalSteps = guideContent.steps.length;
  const currentStepData = guideContent.steps[currentStep];
  const StepIcon = currentStepData.icon;
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-guide-title"
    >
      {/* البطاقة الزجاجية العصرية (Glassmorphism Modal Card) */}
      <div className="relative w-full max-w-xl bg-white/95 dark:bg-[#101E42]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-[#2499F2]/30 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_-15px_rgba(16,30,66,0.9)] overflow-hidden transition-all duration-300">
        {/* خلفيات إضاءة ضبابية خفيفة للتصميم العصري */}
        <div className="absolute -top-20 -end-20 w-48 h-48 rounded-full bg-[#2499F2]/15 dark:bg-[#2499F2]/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -start-20 w-48 h-48 rounded-full bg-[#28C8C0]/15 dark:bg-[#28C8C0]/20 blur-3xl pointer-events-none" />

        {/* شريط التقدم العلوي المتصل (Top Progress Line) */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-[#0B152E] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2499F2] to-[#28C8C0] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* رأس النافذة (Header): الشارة وزر التخطي/الإغلاق */}
        <div className="p-5 sm:p-6 pb-2 flex items-start justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-[#2499F2]/10 dark:bg-[#2499F2]/20 text-[#2499F2] dark:text-[#28C8C0] border border-[#2499F2]/20">
              <Sparkles className="w-3.5 h-3.5 text-[#2499F2] dark:text-[#28C8C0]" />
              <span>{guideContent.roleBadge}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
              {guideContent.roleSub}
            </p>
          </div>

          <button
            type="button"
            onClick={handleComplete}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#152550] transition cursor-pointer shrink-0"
            title={isRtl ? 'إغلاق الدليل' : 'Close Guide'}
            aria-label={isRtl ? 'إغلاق الدليل' : 'Close Guide'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* مؤشر الخطوات التفاعلي (Step Dots & Badges) */}
        <div className="px-5 sm:px-6 py-2 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 relative z-10">
          <div className="flex items-center gap-2">
            {guideContent.steps.map((s, idx) => {
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;
              return (
                <button
                  key={s.stepNum}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] shadow-sm font-black scale-105'
                      : isPast
                        ? 'bg-slate-100 dark:bg-[#152550] text-[#2499F2] dark:text-[#28C8C0] hover:bg-slate-200 dark:hover:bg-[#1a2f6b]'
                        : 'bg-slate-100 dark:bg-[#152550]/60 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  aria-label={`Step ${s.stepNum}`}
                >
                  {isPast ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span>{s.stepNum}</span>
                  )}
                  <span className="hidden sm:inline text-[11px]">
                    {isRtl ? `خطوة ${s.stepNum}` : `Step ${s.stepNum}`}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-400">
            {isRtl ? `الخطوة ${currentStep + 1} من ${totalSteps}` : `${currentStep + 1} of ${totalSteps}`}
          </span>
        </div>

        {/* جسم الخطوة الحالية مع حركة انسيابية ناعمة (Step Body with Slide/Fade) */}
        <div className="p-5 sm:p-7 space-y-4 relative z-10 min-h-[260px] flex flex-col justify-between">
          <div key={currentStep} className="animate-in fade-in zoom-in-95 duration-300 space-y-3.5">
            {/* أيقونة الخطوة ورقمها البارز */}
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl ${currentStepData.iconBg} flex items-center justify-center shrink-0 shadow-sm border border-current/20`}>
                <StepIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2499F2] dark:text-[#28C8C0]">
                  {isRtl ? `المحطة ${currentStep + 1}` : `Milestone ${currentStep + 1}`}
                </span>
                <h3 id="onboarding-guide-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {currentStepData.title}
                </h3>
              </div>
            </div>

            {/* الوصف المفصل للخطوة */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
              {currentStepData.desc}
            </p>

            {/* شارة التمييز / الميزة التوضيحية */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B152E]/90 border border-slate-200/80 dark:border-[#2499F2]/20 flex items-start gap-2.5 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-[#28C8C0] shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-normal">
                {currentStepData.highlight}
              </p>
            </div>
          </div>

          {/* شريط الإجراءات السفلي (Action Footer) */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
            {/* زر التخطي السريع */}
            <button
              type="button"
              onClick={handleComplete}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer px-2 py-1"
            >
              {isRtl ? 'تخطي الشرح' : 'Skip Tour'}
            </button>

            {/* أزرار التنقل (السابق / التالي / ابدأ الآن) */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#152550] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1a2f6b] transition cursor-pointer active:scale-95 border border-slate-200 dark:border-white/10"
                >
                  {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                  <span>{isRtl ? 'السابق' : 'Previous'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black shadow-md transition cursor-pointer active:scale-95 ${
                  isLastStep
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-[#28C8C0] text-slate-950 shadow-emerald-500/20 hover:opacity-95 ring-2 ring-emerald-400/30'
                    : 'bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] shadow-[#2499F2]/20 hover:opacity-95'
                }`}
              >
                <span>
                  {isLastStep
                    ? (isRtl ? 'ابدأ الآن!' : 'Get Started!')
                    : (isRtl ? 'التالي' : 'Next')}
                </span>
                {isLastStep ? (
                  <Rocket className="w-3.5 h-3.5" />
                ) : (
                  isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
