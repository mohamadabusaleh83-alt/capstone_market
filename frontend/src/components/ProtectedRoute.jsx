import { useState, useEffect, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, isLoadingAuth } = useAuth();
  const location = useLocation();
  const [safetyTimedOut, setSafetyTimedOut] = useState(false);

  // مؤقت أمان يضمن عدم تعليق الواجهة في شاشة التحميل لأكثر من 1.2 ثانية
  useEffect(() => {
    const timer = setTimeout(() => {
      setSafetyTimedOut(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // التحقق المباشر من التخزين المحلي لمنع حدوث Race Condition أثناء التوجيه
  const activeUser = useMemo(() => {
    if (currentUser) return currentUser;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_user_role');
      const token = localStorage.getItem('token');
      if (saved && token) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  }, [currentUser]);

  // لا يتم حجب الواجهة بالـ Spinner إذا كانت بيانات المستخدم موجودة في الـ State أو localStorage
  if (isLoadingAuth && !activeUser && !safetyTimedOut) {
    return (
      <div className="min-h-screen bg-[#070D1E] flex flex-col items-center justify-center text-slate-300 gap-3">
        <div className="w-8 h-8 border-2 border-[#28C8C0] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-400">جاري التحقق من الصلاحيات...</span>
      </div>
    );
  }

  if (!activeUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(activeUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
