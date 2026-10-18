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
  MessageSquare,
  Building2,
  ArrowRight,
  ArrowLeft,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';

export default function LoginPage() {
  const { t } = useTranslation();
  const { currentUser, login, register, isLoadingAuth, authError, setAuthError, authSuccess, setAuthSuccess } = useAuth();
  const { isRtl, fetchProjects, fetchApplications } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authRole, setAuthRole] = useState('student'); // 'student' | 'company' (no public supervisor registration)
  const [authFullName, setAuthFullName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (currentUser) {
    return <Navigate to={from} replace />;
  }

  // التعبئة التجريبية السريعة مع بيانات د. أسامة مرعي المعتمدة رسمياً
  const fillDemoCredentials = (role) => {
    setAuthError('');
    setAuthSuccess('');
    if (role === 'student') {
      setAuthFullName(isRtl ? 'أحمد منصور' : 'Ahmed Mansour');
      setAuthEmail('student@capstone.ps');
      setAuthPassword('pass1234');
    } else if (role === 'company') {
      setAuthFullName(isRtl ? 'شركة النور للحلول البرمجية' : 'Al-Noor Software Solutions');
      setAuthEmail('company@capstone.ps');
      setAuthPassword('pass1234');
    } else {
      setAuthFullName(isRtl ? 'د. أسامة أمين مرعي' : 'Dr. Osama Amin Marie');
      setAuthEmail('omarie@qou.edu');
      setAuthPassword('Doctor@2025');
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'register') {
        await register({
          fullName: authFullName,
          email: authEmail,
          password: authPassword,
          role: authRole === 'company' ? 'partner' : 'student'
        });
      } else {
        await login(authEmail, authPassword);
      }
      await fetchProjects();
      await fetchApplications();
      navigate(from, { replace: true });
    } catch {
      // Error is set in AuthContext
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 relative overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* الشريط العلوي للتحكم والمظهر */}
      <header className="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            title={t('nav.back_home')}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center p-1.5 shadow-sm group-hover:scale-105 transition-transform">
              <img src="/logo.svg" alt={t('nav.platform_title')} className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight hidden sm:inline">
              {t('nav.platform_title')}
            </span>
          </Link>
          <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/60 px-2 py-0.5 rounded-full hidden md:inline">
            v1.1 Live
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      {/* المحتوى الرئيسي بتصميم الشاشة المقسومة (Split-Screen) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 items-center relative z-10 max-w-7xl mx-auto w-full">
        {/* خلفيات إشعاعية ناعمة */}
        <div className="absolute top-1/4 -start-24 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 end-0 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* الجانب الأول: الواجهة الترحيبية والهوية الأكاديمية */}
        <section className="lg:col-span-6 xl:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center space-y-7">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/60 text-cyan-700 dark:text-cyan-300 text-xs font-bold w-fit shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
              <span>{t('auth.banner_subtitle')}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-cyan-500/30 shadow-xl shadow-cyan-500/10 dark:shadow-cyan-500/20 backdrop-blur-xl shrink-0 hover:scale-105 transition-transform duration-300">
                <img
                  src="/logo.svg"
                  alt={t('nav.platform_title')}
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-[0_0_20px_rgba(6,182,212,0.45)]"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 dark:from-cyan-400 dark:via-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
                  {t('auth.hero_headline')}
                </span>
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {t('auth.hero_subheadline')}
            </p>
          </div>

          {/* 3 بطاقات ميزات مصغرة بأيقونات */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-500/40">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-2.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white mb-1">
                {t('auth.feature_match_title')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {t('auth.feature_match_desc')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500/40">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2.5">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white mb-1">
                {t('auth.feature_supervision_title')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {t('auth.feature_supervision_desc')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/40">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2.5">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white mb-1">
                {t('auth.feature_collab_title')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {t('auth.feature_collab_desc')}
              </p>
            </div>
          </div>

          {/* زر العودة المباشر للصفحة الرئيسية */}
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/40 shadow-sm transition-all duration-200 active:scale-95 group w-fit cursor-pointer"
            >
              {isRtl ? (
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              ) : (
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              )}
              <span>{t('auth.back_to_home')}</span>
            </Link>
          </div>
        </section>

        {/* الجانب الثاني: صندوق المصادقة التفاعلي Glassmorphism Card */}
        <section className="lg:col-span-6 xl:col-span-5 p-4 sm:p-8 flex items-center justify-center">
          <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/60 relative overflow-hidden space-y-5">
            {/* مفتاح التنقل بين تسجيل الدخول وإنشاء الحساب */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'login'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t('auth.tab_login')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'register'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t('auth.tab_register')}</span>
              </button>
            </div>

            {/* عنوان الصندوق والوصف التوضيحي */}
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {authMode === 'login' ? t('auth.login_title') : t('auth.register_title')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {authMode === 'login' ? t('auth.login_desc') : t('auth.register_desc')}
              </p>
            </div>

            {/* أزرار التجربة السريعة (تظهر فقط في وضع تسجيل الدخول) */}
            {authMode === 'login' && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block text-center">
                  {t('auth.demo_title')}
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('student')}
                    className="py-1.5 px-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-[10px] sm:text-[11px] font-bold border border-emerald-200 dark:border-emerald-800/60 transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                  >
                    <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('auth.demo_student')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('supervisor')}
                    className="py-1.5 px-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-xl text-[10px] sm:text-[11px] font-bold border border-amber-200 dark:border-amber-800/60 transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span className="truncate">{t('auth.demo_supervisor')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('company')}
                    className="py-1.5 px-1.5 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-750 text-blue-700 dark:text-cyan-400 rounded-xl text-[10px] sm:text-[11px] font-bold border border-blue-200 dark:border-slate-700 transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                  >
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('auth.demo_company')}</span>
                  </button>
                </div>
              </div>
            )}

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

            {/* النموذج التفاعلي (Auth Form) */}
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {/* حقول خاصة بنموذج إنشاء الحساب الجديد */}
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                      {t('auth.full_name')}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t('auth.full_name_placeholder')}
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition shadow-inner"
                    />
                  </div>

                  {/* اختيار نوع الحساب محصوراً فقط بين طالب وشركة */}
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
                            ? 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-500 text-cyan-800 dark:text-cyan-200 shadow-sm'
                            : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <GraduationCap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span>{t('auth.option_student')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAuthRole('company')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                          authRole === 'company'
                            ? 'bg-blue-50 dark:bg-slate-800 border-blue-500 text-blue-800 dark:text-cyan-300 shadow-sm'
                            : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>{t('auth.option_company')}</span>
                      </button>
                    </div>
                  </div>

                  {/* تنبيه خاص للمشرفين الأكاديميين لتوضيح آلية إصدار حساباتهم */}
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{t('auth.supervisor_notice')}</span>
                  </div>
                </>
              )}

              {/* حقل البريد الإلكتروني */}
              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@capstone.ps"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition text-left ps-3 pe-10 shadow-inner"
                    dir="ltr"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute end-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* حقل كلمة المرور مع خيار إظهار/إخفاء */}
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
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition text-left ps-9 pe-10 shadow-inner"
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

              {/* زر الإرسال الموحد الأساسي */}
              <button
                type="submit"
                disabled={isLoadingAuth}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-xl text-xs transition-all duration-200 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 mt-2"
              >
                {isLoadingAuth ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('auth.connecting')}</span>
                  </>
                ) : authMode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{t('auth.login_submit')}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{t('auth.register_submit')}</span>
                  </>
                )}
              </button>
            </form>

            {/* التبديل بين التسجيل والدخول أسفل الصندوق */}
            <div className="text-center pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 font-semibold transition cursor-pointer"
              >
                {authMode === 'login' ? t('auth.switch_to_register') : t('auth.switch_to_login')}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* تذييل الصفحة البسيط والأنيق */}
      <footer className="text-center py-3 text-[11px] text-slate-500 dark:text-slate-500 border-t border-slate-200/80 dark:border-slate-900 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm z-20">
        {t('auth.footer')}
      </footer>
    </div>
  );
}
