import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import DashboardPage from './pages/DashboardPage';
import SupervisorApprovalPage from './pages/SupervisorApprovalPage';
import ReportsPage from './pages/ReportsPage';
import TeamsHubPage from './pages/TeamsHubPage';
import StudentCvPage from './pages/StudentCvPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
          <Routes>
            {/* صفحة تسجيل الدخول والتسجيل */}
            <Route path="/login" element={<LoginPage />} />

            {/* المسارات المحمية داخل الهيكل الأساسي (MainLayout) */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* استعراض المشاريع والمطابقة الذكية */}
              <Route path="/" element={<ProjectsPage />} />
              <Route path="/projects" element={<Navigate to="/" replace />} />

              {/* لوحة التحكم الخاصة بكل دور */}
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* اعتماد المشاريع الأكاديمية (خاص بالمشرف الأكاديمي فقط) */}
              <Route
                path="/approvals"
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <SupervisorApprovalPage />
                  </ProtectedRoute>
                }
              />

              {/* متابعة وتسليم التقارير */}
              <Route path="/reports" element={<ReportsPage />} />

              {/* ملتقى تشكيل الفرق وشُعب التخرج */}
              <Route path="/teams" element={<TeamsHubPage />} />

              {/* السيرة الذاتية للطالب */}
              <Route
                path="/cv"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentCvPage />
                  </ProtectedRoute>
                }
              />

              {/* صفحة 404 لأي مسار غير معرف داخل التطبيق */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Fallback عام */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
  );
}