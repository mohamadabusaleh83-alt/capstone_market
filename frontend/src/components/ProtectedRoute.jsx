import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

function VerifyingScreen() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#070D1E] flex flex-col items-center justify-center text-slate-300 gap-3">
      <div className="w-8 h-8 border-2 border-[#28C8C0] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-400">{t('common.verifying_permissions')}</span>
    </div>
  );
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, isRoleVerified } = useAuth();
  const location = useLocation();

  // الصفحات المشتركة تُعرض فوراً من بيانات الجلسة المخزنة لتفادي الوميض
  const cachedUser = useMemo(() => {
    if (currentUser) return currentUser;
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('app_user_role');
    const token = localStorage.getItem('token');
    if (!saved || !token) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }, [currentUser]);

  if (!cachedUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // الصفحات الخاصة بدور معيّن: لا نثق بالدور المخزن في localStorage حتى يؤكده الخادم (I-36)
  if (allowedRoles && allowedRoles.length > 0) {
    if (!isRoleVerified || !currentUser) {
      return <VerifyingScreen />;
    }
    if (!allowedRoles.includes(currentUser.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
