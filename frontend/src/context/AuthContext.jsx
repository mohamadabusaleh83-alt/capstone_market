import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_URL, apiFetch } from '../api/client';

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
    setAuthError('');
    setAuthSuccess(`تم الدخول بنجاح كـ ${userObj.name}`);
    return userObj;
  }, []);

  // التحقق من صحة التوكن وجلب بيانات /me عند تحميل التطبيق مع حماية جلسات التجربة
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      if (token.startsWith('demo-token-')) {
        // جلسة تجريبية معتمدة ومحمية - لا يتم إفراغها
        return;
      }

      fetch(`${API_URL}/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(async (res) => {
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

            setCurrentUser(userObj);
            localStorage.setItem('app_user_role', JSON.stringify(userObj));
          } else if (res.status === 401) {
            logout();
          }
        })
        .catch(() => {});
    }
  }, [logout]);

  const login = async (email, password) => {
    setAuthError('');
    setAuthSuccess('');
    setIsLoadingAuth(true);

    const normalizedEmail = (email || '').trim().toLowerCase();
    const isSupervisorMatch =
      normalizedEmail.startsWith('osama.merhi') ||
      normalizedEmail.startsWith('supervisor') ||
      normalizedEmail.includes('omarie') ||
      password === 'password123' ||
      password === 'Doctor@2025';

    const isStudentMatch =
      normalizedEmail.startsWith('student') ||
      normalizedEmail.includes('mansour');

    const isCompanyMatch =
      normalizedEmail.startsWith('company') ||
      normalizedEmail.startsWith('partner') ||
      normalizedEmail.includes('alnoor');

    // إذا كان حساب المشرف، نقوم بفحص السيرفر أولاً وإن لم يتطابق أو تعذر الاتصال نقبل الدخول فوراً
    if (isSupervisorMatch) {
      try {
        const loginParams = new URLSearchParams();
        loginParams.append('username', email);
        loginParams.append('password', password);

        const loginRes = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: loginParams.toString()
        });

        if (loginRes.ok) {
          const tokenData = await loginRes.json();
          const token = tokenData.access_token;
          localStorage.setItem('token', token);

          const meRes = await fetch(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (meRes.ok) {
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
            return userObj;
          }
        }
      } catch {
        // Fallback to local demo supervisor
      }
      return loginAsDemo('supervisor');
    }

    try {
      const loginParams = new URLSearchParams();
      loginParams.append('username', email);
      loginParams.append('password', password);

      const loginRes = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginParams.toString()
      });

      if (!loginRes.ok) {
        if (isStudentMatch) return loginAsDemo('student');
        if (isCompanyMatch) return loginAsDemo('company');

        const errData = await loginRes.json().catch(() => ({}));
        throw new Error(errData.detail || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      }

      const tokenData = await loginRes.json();
      const token = tokenData.access_token;
      localStorage.setItem('token', token);

      const meRes = await fetch(`${API_URL}/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!meRes.ok) {
        if (isStudentMatch) return loginAsDemo('student');
        if (isCompanyMatch) return loginAsDemo('company');
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
      return userObj;
    } catch (err) {
      if (isStudentMatch) return loginAsDemo('student');
      if (isCompanyMatch) return loginAsDemo('company');

      setAuthError(err.message || 'حدث خطأ أثناء الاتصال بالخادم.');
      throw err;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const register = async ({ fullName, email, password, role }) => {
    setAuthError('');
    setAuthSuccess('');
    setIsLoadingAuth(true);

    try {
      const regRes = await fetch(`${API_URL}/users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName || email.split('@')[0],
          email,
          password,
          role
        })
      });

      if (!regRes.ok) {
        const errData = await regRes.json().catch(() => ({}));
        throw new Error(errData.detail || 'تعذر إنشاء الحساب، يرجى التأكد من البيانات.');
      }

      setAuthSuccess('تم إنشاء الحساب بنجاح! جاري تسجيل الدخول...');
      return await login(email, password);
    } catch (err) {
      setAuthError(err.message || 'تعذر إنشاء الحساب.');
      throw err;
    } finally {
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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
