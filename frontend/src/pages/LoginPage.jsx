import { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import {
  ShieldCheck,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  RefreshCw
} from 'lucide-react';

export default function LoginPage() {
  const { t } = useTranslation();
  const { currentUser, login, register, isLoadingAuth, authError, setAuthError, authSuccess, setAuthSuccess } = useAuth();
  const { isRtl, fetchProjects, fetchApplications } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authRole, setAuthRole] = useState('student');
  const [authFullName, setAuthFullName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  if (currentUser) {
    return <Navigate to={from} replace />;
  }

  const fillDemoCredentials = (role) => {
    setAuthRole(role);
    setAuthError('');
    if (role === 'student') {
      setAuthFullName(isRtl ? 'أحمد منصور' : 'Ahmed Mansour');
      setAuthEmail('student@capstone.ps');
      setAuthPassword('pass1234');
    } else if (role === 'company') {
      setAuthFullName(isRtl ? 'شركة النور للحلول البرمجية' : 'Al-Noor Software Solutions');
      setAuthEmail('company@capstone.ps');
      setAuthPassword('pass1234');
    } else {
      setAuthFullName(isRtl ? 'د. إياد الأحمد' : 'Dr. Eyad Al-Ahmad');
      setAuthEmail('supervisor@capstone.ps');
      setAuthPassword('pass1234');
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
          role: authRole
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-xs py-2.5 px-4 sm:px-6 border-b border-amber-500/20 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 text-amber-300 font-semibold truncate">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">{t('auth.banner_title')}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-slate-400 text-[11px] hidden md:inline">
            {t('auth.banner_subtitle')}
          </span>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-blue-400 mb-1">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {authMode === 'login' ? t('auth.login_title') : t('auth.register_title')}
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {authMode === 'login' ? t('auth.login_desc') : t('auth.register_desc')}
            </p>
          </div>

          {/* أزرار التجربة السريعة */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] text-slate-400 font-medium block text-center">
              {t('auth.demo_title')}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('student')}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-[11px] font-bold border border-emerald-900/40 transition cursor-pointer"
              >
                {t('roles.student')}
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('supervisor')}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[11px] font-bold border border-amber-900/40 transition cursor-pointer"
              >
                {t('roles.supervisor')}
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('company')}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg text-[11px] font-bold border border-blue-900/40 transition cursor-pointer"
              >
                {t('roles.company')}
              </button>
            </div>
          </div>

          {authError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">{t('auth.full_name')}</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder={t('auth.full_name_placeholder')}
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">{t('auth.account_type')}</label>
                  <select
                    value={authRole}
                    onChange={(e) => setAuthRole(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="student">{t('auth.option_student')}</option>
                    <option value="company">{t('auth.option_company')}</option>
                    <option value="supervisor">{t('auth.option_supervisor')}</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-slate-300 block mb-1">{t('auth.email')}</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@capstone.ps"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 text-left ps-3 pe-10"
                  dir="ltr"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute end-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 text-left ps-3 pe-10"
                  dir="ltr"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute end-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoadingAuth}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs transition duration-200 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoadingAuth ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t('auth.connecting')}
                </>
              ) : authMode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  {t('auth.login_submit')}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  {t('auth.register_submit')}
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError('');
                setAuthSuccess('');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 transition cursor-pointer"
            >
              {authMode === 'login'
                ? t('auth.switch_to_register')
                : t('auth.switch_to_login')}
            </button>
          </div>
        </div>
      </div>

      <div className="text-center py-4 text-[11px] text-slate-500 border-t border-slate-900">
        {t('auth.footer')}
      </div>
    </div>
  );
}
