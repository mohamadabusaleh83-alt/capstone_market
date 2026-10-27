/**
 * Capstone Market Platform
 * Developed and engineered by: Mohamad Abu Saleh
 * LinkedIn: https://www.linkedin.com/in/mohamad-abu-saleh-598255350
 * Email: mohamadabusaleh83@gmail.com
 **/
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// Existing Pages
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import DashboardPage from './pages/DashboardPage';
import AboutPage from './pages/AboutPage';
import SupervisorPage from './pages/SupervisorPage';
import ReportsPage from './pages/ReportsPage';
import TeamsHubPage from './pages/TeamsHubPage';
import StudentCvPage from './pages/StudentCvPage';
import NotFoundPage from './pages/NotFoundPage';

// New Functional Pages for Full Navigation
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MyProjectsPage from './pages/MyProjectsPage';
import CollaborationRequestsPage from './pages/CollaborationRequestsPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import SavedProjectsPage from './pages/SavedProjectsPage';
import CompanyOpportunitiesPage from './pages/CompanyOpportunitiesPage';
import CompanyPartnershipsPage from './pages/CompanyPartnershipsPage';
import ManageProjectsPage from './pages/ManageProjectsPage';
import ManageStudentsPage from './pages/ManageStudentsPage';
import ManageCompaniesPage from './pages/ManageCompaniesPage';
import ManageCollaborationsPage from './pages/ManageCollaborationsPage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import AdminUsersPage from './pages/AdminUsersPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <Routes>
              {/* صفحة تسجيل الدخول الموحد */}
              <Route path="/login" element={<LoginPage />} />

              {/* صفحة عن المنصة متاحة داخل الهيكل الأساسي (MainLayout) */}
              <Route element={<MainLayout />}>
                <Route path="/about" element={<AboutPage />} />
              </Route>

              {/* المسارات المحمية العامة المشتركة داخل الهيكل الأساسي */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                {/* 1. المسارات المشتركة (Shared Routes) */}
                <Route path="/" element={<ProjectsPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                {/* التقارير: الطالب يسلّم، المالك والمشرف يراجعان (الخادم يحدد الصلاحيات لكل تقرير) */}
                <Route path="/reports" element={<ReportsPage />} />
              </Route>

              {/* 2. مسارات دور الطالب (Student Routes) - محمي بدور الطالب والإدارة */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/my-projects" element={<MyProjectsPage />} />
                <Route path="/collaboration-requests" element={<CollaborationRequestsPage />} />
                <Route path="/opportunities" element={<OpportunitiesPage />} />
                <Route path="/cv" element={<StudentCvPage />} />
              </Route>

              {/* 3. مسارات دور الشركة (Company Routes) - محمي بدور الشركة والشركاء والإدارة */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['company', 'partner', 'business', 'admin']}>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/saved-projects" element={<SavedProjectsPage />} />
                <Route path="/company/opportunities" element={<CompanyOpportunitiesPage />} />
                <Route path="/company/partnerships" element={<CompanyPartnershipsPage />} />
              </Route>

              {/* 4. مسارات دور المشرف الأكاديمي والإدارة (Supervisor & Management Routes) */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/supervisor" element={<SupervisorPage />} />
                <Route path="/supervisor/dashboard" element={<SupervisorPage />} />
                <Route path="/approvals" element={<SupervisorPage />} />
                <Route path="/supervisor/reviews" element={<SupervisorPage />} />
                <Route path="/manage/projects" element={<ManageProjectsPage />} />
                <Route path="/manage/students" element={<ManageStudentsPage />} />
                <Route path="/manage/companies" element={<ManageCompaniesPage />} />
                <Route path="/manage/collaborations" element={<ManageCollaborationsPage />} />
                <Route path="/supervisor/reports" element={<ReportsPage />} />
                <Route path="/manage/logs" element={<ActivityLogsPage />} />
                <Route path="/teams" element={<TeamsHubPage />} />
              </Route>

              {/* 5. إدارة المستخدمين (الأدمن فقط) */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/admin/users" element={<AdminUsersPage />} />
              </Route>

              {/* صفحة 404 لأي مسار غير معرّف داخل التطبيق */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
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