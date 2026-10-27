/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_URL, apiFetch, isAbortError, formatFriendlyError } from '../api/client';

export const DEMO_FALLBACK_USERS = {
  supervisor: {
    id: 'supervisor-1',
    name: 'د. أسامة أمين مرعي',
    email: 'osama.merhi@capstone.ps',
    role: 'supervisor',
    rawRole: 'supervisor',
    title: 'مشرف أكاديمي'
  },
  student: {
    id: 'student-1',
    name: 'أحمد منصور',
    email: 'student@capstone.ps',
    role: 'student',
    rawRole: 'student',
    title: 'طالب خريج'
  },
  company: {
    id: 'company-1',
    name: 'شركة النور للحلول البرمجية',
    email: 'company@capstone.ps',
    role: 'company',
    rawRole: 'partner',
    title: 'شريك تجاري / شركة'
  }
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('app_user_role');
    const token = localStorage.getItem('token');
    return (saved && token) ? JSON.parse(saved) : null;
  });

  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      // إبطال التوكن على الخادم (I-19)؛ طلب مستقل لا ينتظره المستخدم ولا يعيد استدعاء logout
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          keepalive: true
        }).catch(() => {});
      }
      localStorage.removeItem('token');
      localStorage.removeItem('app_user_role');
    }
    setCurrentUser(null);
  }, []);

  // تسجيل الدخول التجريبي الفوري بنقرة واحدة (Mock / Demo Auth Bypass)
  const loginAsDemo = useCallback((role = 'supervisor') => {
    const userObj = DEMO_FALLBACK_USERS[role] || DEMO_FALLBACK_USERS.supervisor;
    const token = `demo-token-${role}-${Date.now()}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('app_user_role', JSON.stringify(userObj));
    }
    setCurrentUser(userObj);
    setIsLoadingAuth(false);
    setAuthError('');
    setAuthSuccess(`تم الدخول بنجاح كـ ${userObj.name}`);
    return userObj;
  }, []);

  // مؤقت أمان تلقائي: يمنع بقاء isLoadingAuth معلقاً لأكثر من 12 ثانية في حال حدوث تجميد غير متوقع
  useEffect(() => {
    let timer;
    if (isLoadingAuth) {
      timer = setTimeout(() => {
        setIsLoadingAuth(false);
      }, 12000);
    }
    return () => clearTimeout(timer);
  }, [isLoadingAuth]);

  // التحقق من صحة التوكن وجلب بيانات /me عند تحميل التطبيق مع حماية جلسات التجربة ومؤقت أمان كافٍ (10 ثوانٍ)
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      if (token.startsWith('demo-token-')) {
        setIsLoadingAuth(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      fetch(`${API_URL}/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      })
        .then(async (res) => {
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            const normalizedRole = (data.role === 'partner' || data.role === 'business') ? 'company' : data.role;
            const titleByRole = {
              student: 'طالب خريج',
              supervisor: 'مشرف أكاديمي',
              company: 'شريك تجاري / شركة',
              admin: 'مسؤول النظام'
            };

            const userObj = {
              id: data.id,
              name: data.full_name,
              email: data.email,
              role: normalizedRole,
              rawRole: data.role,
              title: titleByRole[normalizedRole] || data.role
            };

            localStorage.setItem('app_user_role', JSON.stringify(userObj));
            setCurrentUser(userObj);
          } else if (res.status === 401) {
            logout();
          }
        })
        .catch(() => {})
        .finally(() => {
          clearTimeout(timeoutId);
          setIsLoadingAuth(false);
        });
    } else {
      setIsLoadingAuth(false);
    }
  }, [logout]);

  const login = async (email, password) => {
    setAuthError('');
    setAuthSuccess('');
    setIsLoadingAuth(true);

    let timeoutId = null;
    let meTimeoutId = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 10000);

      const loginParams = new URLSearchParams();
      loginParams.append('username', (email || '').trim().toLowerCase());
      loginParams.append('password', password || '');

      const loginRes = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginParams.toString(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!loginRes.ok) {
        const errData = await loginRes.json().catch(() => ({}));
        throw new Error(errData.detail || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      }

      const tokenData = await loginRes.json();
      const token = tokenData.access_token;
      localStorage.setItem('token', token);

      const meController = new AbortController();
      meTimeoutId = setTimeout(() => meController.abort(), 10000);

      const meRes = await fetch(`${API_URL}/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: meController.signal
      });

      clearTimeout(meTimeoutId);

      if (!meRes.ok) {
        throw new Error('فشل جلب بيانات وصلاحيات المستخدم.');
      }

      const userData = await meRes.json();
      const normalizedRole = (userData.role === 'partner' || userData.role === 'business') ? 'company' : userData.role;
      const titleByRole = {
        student: 'طالب خريج',
        supervisor: 'مشرف أكاديمي',
        company: 'شريك تجاري / شركة',
        admin: 'مسؤول النظام'
      };

      const userObj = {
        id: userData.id,
        name: userData.full_name,
        email: userData.email,
        role: normalizedRole,
        rawRole: userData.role,
        title: titleByRole[normalizedRole] || userData.role
      };

      localStorage.setItem('app_user_role', JSON.stringify(userObj));
      setCurrentUser(userObj);
      setIsLoadingAuth(false);
      return userObj;
    } catch (err) {
      const friendlyMsg = formatFriendlyError(err);
      setAuthError(friendlyMsg);
      const friendlyErr = new Error(friendlyMsg);
      friendlyErr.name = isAbortError(err) ? 'AbortError' : (err.name || 'Error');
      throw friendlyErr;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (meTimeoutId) clearTimeout(meTimeoutId);
      setIsLoadingAuth(false);
    }
  };

  const register = async ({ fullName, email, password, role }) => {
    setAuthError('');
    setAuthSuccess('');
    setIsLoadingAuth(true);

    let timeoutId = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 10000);

      const regRes = await fetch(`${API_URL}/users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName || email.split('@')[0],
          email,
          password,
          role
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!regRes.ok) {
        const errData = await regRes.json().catch(() => ({}));
        throw new Error(errData.detail || 'تعذر إنشاء الحساب، يرجى التأكد من البيانات.');
      }

      setAuthSuccess('تم إنشاء الحساب بنجاح! جاري تسجيل الدخول...');
      return await login(email, password);
    } catch (err) {
      const friendlyMsg = formatFriendlyError(err);
      setAuthError(friendlyMsg);
      const friendlyErr = new Error(friendlyMsg);
      friendlyErr.name = isAbortError(err) ? 'AbortError' : (err.name || 'Error');
      throw friendlyErr;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setIsLoadingAuth(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isLoadingAuth,
        authError,
        setAuthError,
        authSuccess,
        setAuthSuccess,
        login,
        loginAsDemo,
        register,
        logout,
        apiFetch: (endpoint, options) => apiFetch(endpoint, options, logout)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
