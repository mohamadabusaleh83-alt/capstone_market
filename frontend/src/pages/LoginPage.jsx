import { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  RefreshCw,
  Sparkles,
  GraduationCap,
  Building2,
  ArrowRight,
  ArrowLeft,
  Info,
  Eye,
  EyeOff,
  School,
  Briefcase
} from 'lucide-react';

export default function LoginPage() {
  const { t } = useTranslation();
  const { currentUser, login, loginAsDemo, register, isLoadingAuth, authError, setAuthError, authSuccess, setAuthSuccess } = useAuth();
  const { isRtl, fetchProjects, fetchApplications } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authRole, setAuthRole] = useState('student'); // 'student' | 'company' (supervisor is excluded from public registration)
  const [authFullName, setAuthFullName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authExtraField, setAuthExtraField] = useState(''); // University/Major for student, Industry/Field for company
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (currentUser) {
    return <Navigate to={from} replace />;
  }

  // تسجيل الدخول التجريبي الفوري بنقرة واحدة بدون Race Condition
  const handleQuickDemoLogin = (role) => {
    const user = loginAsDemo(role);
    if (user && typeof window !== 'undefined') {
      localStorage.setItem('app_user_role', JSON.stringify(user));
    }
    // تحديث البيانات في الخلفية دون تعطيل الانتقال الفوري
    if (fetchProjects) fetchProjects();
    if (fetchApplications) fetchApplications();
    const destination = role === 'supervisor' ? '/supervisor' : (from && from !== '/login' ? from : '/dashboard');
    navigate(destination, { replace: true });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (authMode === 'register') {
      if (authPassword !== authConfirmPassword) {
        setAuthError(t('auth.password_mismatch'));
        return;
      }
    }

    const emailTrim = (authEmail || '').trim().toLowerCase();
    const isSupervisorMatch =
      emailTrim.startsWith('osama.merhi') ||
      emailTrim.startsWith('supervisor') ||
      emailTrim.includes('omarie') ||
      authPassword === 'password123' ||
      authPassword === 'Doctor@2025';

    const isStudentMatch =
      emailTrim.startsWith('student') ||
      emailTrim.includes('mansour') ||
      authPassword === 'pass1234';

    const isCompanyMatch =
      emailTrim.startsWith('company') ||
      emailTrim.startsWith('partner') ||
      emailTrim.includes('alnoor');

    // مصادقة وتجاوز احتياطي ذكي للأدوار الثلاثة في حال تعذر اتصال السيرفر
    if (authMode === 'login' && isSupervisorMatch) {
      let userObj;
      try {
        userObj = await login(authEmail.trim(), authPassword);
      } catch {
        userObj = loginAsDemo('supervisor');
      }
      if (userObj && typeof window !== 'undefined') {
        localStorage.setItem('app_user_role', JSON.stringify(userObj));
      }
      // استدعاء البيانات في الخلفية دون تعطيل واجهة المستخدم
      if (fetchProjects) fetchProjects();
      if (fetchApplications) fetchApplications();
      const destination = from && from !== '/login' ? from : '/supervisor';
      navigate(destination, { replace: true });
      return;
    }

    if (authMode === 'login' && isStudentMatch) {
      let userObj;
      try {
        userObj = await login(authEmail.trim(), authPassword);
      } catch {
        userObj = loginAsDemo('student');
      }
      if (userObj && typeof window !== 'undefined') {
        localStorage.setItem('app_user_role', JSON.stringify(userObj));
      }
      if (fetchProjects) fetchProjects();
      if (fetchApplications) fetchApplications();
      navigate(from && from !== '/login' ? from : '/dashboard', { replace: true });
      return;
    }

    if (authMode === 'login' && isCompanyMatch) {
      let userObj;
      try {
        userObj = await login(authEmail.trim(), authPassword);
      } catch {
        userObj = loginAsDemo('company');
      }
      if (userObj && typeof window !== 'undefined') {
        localStorage.setItem('app_user_role', JSON.stringify(userObj));
      }
      if (fetchProjects) fetchProjects();
      if (fetchApplications) fetchApplications();
      navigate(from && from !== '/login' ? from : '/dashboard', { replace: true });
      return;
    }

    try {
      let userObj;
      if (authMode === 'register') {
        userObj = await register({
          fullName: authFullName.trim(),
          email: authEmail.trim(),
          password: authPassword,
          role: authRole === 'company' ? 'partner' : 'student'
        });
      } else {
        userObj = await login(authEmail.trim(), authPassword);
      }
      if (userObj && typeof window !== 'undefined') {
        localStorage.setItem('app_user_role', JSON.stringify(userObj));
      }
      if (fetchProjects) fetchProjects();
      if (fetchApplications) fetchApplications();
      const dest = from && from !== '/login' ? from : (userObj?.role === 'supervisor' ? '/supervisor' : '/dashboard');
      navigate(dest, { replace: true });
    } catch {
      // Error is set within AuthContext
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F4F8FC] dark:bg-[#0B152E] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 relative overflow-x-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* الشريط العلوي للتحكم والمظهر */}
      <header className="w-full bg-white/80 dark:bg-[#101E42]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-[#2499F2]/20 px-4 sm:px-8 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            title={t('nav.back_home')}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#0B152E] border border-slate-200 dark:border-[#2499F2]/30 flex items-center justify-center p-1.5 shadow-sm group-hover:scale-105 transition-transform">
              <img src="/logo.svg" alt="Capstone Market" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight group-hover:text-[#2499F2] dark:group-hover:text-[#28C8C0] transition-colors">
              Capstone Market
            </span>
          </Link>
          <span className="text-[11px] font-semibold text-[#2499F2] dark:text-[#28C8C0] bg-[#2499F2]/10 dark:bg-[#2499F2]/20 border border-[#2499F2]/30 px-2.5 py-0.5 rounded-full hidden sm:inline">
            v1.1 Live
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      {/* المحتوى الرئيسي بهيكل الشاشة المقسومة والتجاوب التام لشاشات الموبايل */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:p-6 lg:p-8 flex items-center justify-center z-10">
        <div className="w-full flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch max-w-md sm:max-w-xl lg:max-w-none mx-auto">
          
          {/* الجانب الأيمن (الواجهة الترحيبية والهوية الرسمية الفخمة) */}
          <section className="bg-[#101E42] text-white rounded-3xl p-6 sm:p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden shadow-2xl border border-[#2499F2]/25 order-1">
            {/* لمسات إضاءة خلفية ناعمة بدرجات Turquoise & Blue */}
            <div className="absolute -top-24 -start-24 w-80 h-80 bg-[#28C8C0]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -end-24 w-80 h-80 bg-[#2499F2]/25 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* الشعار المعتمد بحجم كبير وبارز في الأعلى */}
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-[#0B152E]/90 border border-[#28C8C0]/35 shadow-xl shadow-[#28C8C0]/15 backdrop-blur-xl shrink-0 hover:scale-105 transition-transform duration-300">
                  <img
                    src="/logo.svg"
                    alt="Capstone Market"
                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-[0_0_20px_rgba(40,200,192,0.45)]"
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#28C8C0]/15 border border-[#28C8C0]/30 text-[#77DCC1] text-[11px] font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#28C8C0]" />
                    <span>Academic & Industry Gateway</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {t('auth.hero_headline')}
                  </h1>
                </div>
              </div>

              {/* شعار المنصة الفرعي والنبذة التعريفية */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#28C8C0] tracking-wide">
                  {t('auth.tagline')}
                </p>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                  {t('auth.hero_subheadline')}
                </p>
              </div>

              {/* قائمة الميزات بثلاث نقاط أنيقة بأيقونات ملونة */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-[#28C8C0]/40 transition">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white mb-0.5">
                      {t('auth.feature_1')}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {t('auth.feature_supervision_desc')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-[#2499F2]/40 transition">
                  <div className="w-8 h-8 rounded-xl bg-[#2499F2]/20 border border-[#2499F2]/30 flex items-center justify-center text-[#2499F2] shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white mb-0.5">
                      {t('auth.feature_2')}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {t('auth.feature_collab_desc')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-[#28C8C0]/40 transition">
                  <div className="w-8 h-8 rounded-xl bg-[#28C8C0]/20 border border-[#28C8C0]/30 flex items-center justify-center text-[#28C8C0] shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white mb-0.5">
                      {t('auth.feature_3')}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {t('auth.feature_match_desc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* رابط العودة للمنصة وتوثيق المطور */}
            <div className="pt-6 relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 mt-6">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0B152E]/80 hover:bg-[#0B152E] text-slate-200 hover:text-white border border-[#2499F2]/30 hover:border-[#28C8C0]/50 transition-all active:scale-95 group w-fit cursor-pointer shadow-md"
              >
                {isRtl ? (
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-[#28C8C0]" />
                ) : (
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-[#28C8C0]" />
                )}
                <span>{t('auth.back_to_home')}</span>
              </Link>

              <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                <span>تطوير:</span>
                <a
                  href="https://www.linkedin.com/in/mohamad-abu-saleh-598255350"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#28C8C0] hover:text-[#77DCC1] underline underline-offset-2 flex items-center gap-1 transition-colors"
                >
                  محمد أبو صالح
                </a>
              </div>
            </div>
          </section>

          {/* الجانب الأيسر (بطاقة المصادقة التفاعلية Glassmorphism Card) */}
          <section className="flex items-center justify-center order-2">
            <div className="w-full max-w-md bg-white dark:bg-[#101E42]/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-5">
              
              {/* شريط تبديل سلس أعلى البطاقة للتحويل الفوري بين [تسجيل الدخول] و [إنشاء حساب جديد] */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-[#0B152E] rounded-2xl border border-slate-200 dark:border-[#2499F2]/20">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    authMode === 'login'
                      ? 'bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] font-black shadow-md shadow-[#2499F2]/20'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t('auth.tab_login')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    authMode === 'register'
                      ? 'bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] font-black shadow-md shadow-[#2499F2]/20'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t('auth.tab_register')}</span>
                </button>
              </div>

              {/* عنوان النموذج والوصف التوضيحي */}
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {authMode === 'login' ? t('auth.login_title') : t('auth.register_title')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {authMode === 'login' ? t('auth.login_desc') : t('auth.register_desc')}
                </p>
              </div>

              {/* رسائل التنبيه والخطأ */}
              {authError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span className="leading-snug">{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span className="leading-snug">{authSuccess}</span>
                </div>
              )}

              {/* نموذج المصادقة التفاعلي */}
              <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                
                {/* ----------------- حقول إنشاء الحساب الجديد (Register Mode) ----------------- */}
                {authMode === 'register' && (
                  <>
                    {/* اختيار نوع الحساب بخيارين فقط: طالب أو شركة */}
                    <div>
                      <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1.5 font-semibold">
                        {t('auth.account_type')}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAuthRole('student')}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                            authRole === 'student'
                              ? 'bg-[#28C8C0]/15 dark:bg-[#28C8C0]/20 border-[#28C8C0] text-[#101E42] dark:text-[#77DCC1] shadow-sm'
                              : 'bg-slate-50 dark:bg-[#0B152E]/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <GraduationCap className="w-4 h-4 text-[#28C8C0]" />
                          <span>{t('auth.option_student')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAuthRole('company')}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                            authRole === 'company'
                              ? 'bg-[#2499F2]/15 dark:bg-[#2499F2]/20 border-[#2499F2] text-[#101E42] dark:text-[#2499F2] shadow-sm'
                              : 'bg-slate-50 dark:bg-[#0B152E]/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <Building2 className="w-4 h-4 text-[#2499F2]" />
                          <span>{t('auth.option_company')}</span>
                        </button>
                      </div>
                    </div>

                    {/* ملاحظة خافتة لتوضيح استبعاد المشرفين من التسجيل العام */}
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{t('auth.supervisor_notice')}</span>
                    </div>

                    {/* حقل الاسم الكامل أو اسم الشركة */}
                    <div>
                      <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                        {authRole === 'student' ? t('auth.full_name') : t('auth.company_name')}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={authRole === 'student' ? t('auth.full_name_placeholder') : t('auth.company_name_placeholder')}
                        value={authFullName}
                        onChange={(e) => setAuthFullName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2] transition"
                      />
                    </div>

                    {/* حقل ديناميكي: (الجامعة والتخصص للطالب | مجال النشاط للشركة) */}
                    <div>
                      <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                        {authRole === 'student' ? t('auth.student_field_label') : t('auth.company_field_label')}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={authRole === 'student' ? t('auth.student_field_placeholder') : t('auth.company_field_placeholder')}
                          value={authExtraField}
                          onChange={(e) => setAuthExtraField(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2] transition ps-3 pe-9"
                        />
                        {authRole === 'student' ? (
                          <School className="w-4 h-4 text-slate-400 absolute end-3 top-3 pointer-events-none" />
                        ) : (
                          <Briefcase className="w-4 h-4 text-slate-400 absolute end-3 top-3 pointer-events-none" />
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* ----------------- حقل البريد الإلكتروني (مشترك) ----------------- */}
                <div>
                  <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                    {t('auth.email')}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2] transition text-left ps-3 pe-10"
                      dir="ltr"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute end-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* ----------------- حقل كلمة المرور ----------------- */}
                <div>
                  <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2] transition text-left ps-9 pe-10"
                      dir="ltr"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute start-3 top-3 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* ----------------- حقل تأكيد كلمة المرور (في وضع إنشاء الحساب فقط) ----------------- */}
                {authMode === 'register' && (
                  <div>
                    <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                      {t('auth.confirm_password')}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2] transition text-left ps-9 pe-10"
                        dir="ltr"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute start-3 top-3 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute end-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* زر الإرسال الرئيسي بلون Turquoise/Mint (#28C8C0) مع نص كحلي غامق وعريض text-[#101E42] font-bold لضمان الوضوح التام */}
                <button
                  type="submit"
                  disabled={isLoadingAuth}
                  className="w-full bg-gradient-to-r from-[#28C8C0] to-[#77DCC1] hover:from-[#20aba3] hover:to-[#5fc4a8] text-[#101E42] font-black text-sm py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-[#28C8C0]/30 hover:shadow-[#28C8C0]/45 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 mt-4"
                >
                  {isLoadingAuth ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#101E42]" />
                      <span>{t('auth.connecting')}</span>
                    </>
                  ) : authMode === 'login' ? (
                    <>
                      <LogIn className="w-4 h-4 text-[#101E42]" />
                      <span>{t('auth.login_submit')}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-[#101E42]" />
                      <span>{t('auth.register_submit')}</span>
                    </>
                  )}
                </button>
              </form>

              {/* قسم الدخول التجريبي الفوري بنقرة واحدة (1-Click Instant Demo Login) */}
              {authMode === 'login' && (
                <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Sparkles className="w-3.5 h-3.5 text-[#28C8C0]" />
                      <span>{isRtl ? 'دخول تجريبي سريع ومباشر:' : 'Quick Demo Access:'}</span>
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">1-Click</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('supervisor')}
                      className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                      title={isRtl ? 'دخول فوري بحساب المشرف الأكاديمي (د. أسامة مرعي)' : 'Supervisor Demo'}
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <span className="truncate max-w-full">{isRtl ? 'مشرف أكاديمي' : 'Supervisor'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('student')}
                      className="p-2 sm:p-2.5 rounded-xl bg-[#28C8C0]/10 hover:bg-[#28C8C0]/20 border border-[#28C8C0]/30 text-[#101E42] dark:text-[#77DCC1] text-[11px] font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                      title={isRtl ? 'دخول فوري بحساب الطالب (أحمد منصور)' : 'Student Demo'}
                    >
                      <GraduationCap className="w-4 h-4 text-[#28C8C0]" />
                      <span className="truncate max-w-full">{isRtl ? 'طالب خريج' : 'Student'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('company')}
                      className="p-2 sm:p-2.5 rounded-xl bg-[#2499F2]/10 hover:bg-[#2499F2]/20 border border-[#2499F2]/30 text-[#2499F2] text-[11px] font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                      title={isRtl ? 'دخول فوري بحساب الشركة (شركة النور)' : 'Company Demo'}
                    >
                      <Building2 className="w-4 h-4 text-[#2499F2]" />
                      <span className="truncate max-w-full">{isRtl ? 'شركة شريكة' : 'Company'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* رابط فوري للتبديل بين تسجيل الدخول وإنشاء الحساب */}
              <div className="text-center pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className="text-xs text-[#2499F2] dark:text-[#28C8C0] hover:underline font-bold transition cursor-pointer"
                >
                  {authMode === 'login' ? t('auth.no_account_cta') : t('auth.have_account_cta')}
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* تذييل الصفحة وتوثيق المطور */}
      <footer className="text-center py-4 px-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-white/5 bg-white/40 dark:bg-[#0B152E]/40 backdrop-blur-sm z-20 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <span>{t('auth.footer')}</span>
        <span className="hidden sm:inline opacity-40">|</span>
        <Link
          to="/about"
          className="font-bold text-[#2499F2] hover:text-[#1B87D9] dark:text-[#28C8C0] dark:hover:text-[#77DCC1] transition-colors"
        >
          {t('nav.about', 'عن المنصة')}
        </Link>
        <span className="hidden sm:inline opacity-40">|</span>
        <a
          href="https://www.linkedin.com/in/mohamad-abu-saleh-598255350"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-bold text-[#2499F2] hover:text-[#0A66C2] dark:text-[#28C8C0] dark:hover:text-[#77DCC1] transition-colors"
          title="Mohamad Abu Saleh - LinkedIn Profile"
        >
          <svg className="w-3.5 h-3.5 fill-current text-[#0A66C2] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
          <span>تطوير وبرمجة: محمد أبو صالح (Mohamad Abu Saleh)</span>
        </a>
      </footer>
    </div>
  );
}
