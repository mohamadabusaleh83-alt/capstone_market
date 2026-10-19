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
import SupervisorApprovalPage from './pages/SupervisorApprovalPage';
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

              {/* المسارات المحمية داخل الهيكل الأساسي (MainLayout) */}
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

                {/* 2. مسارات دور الطالب (Student Routes) */}
                <Route path="/my-projects" element={<MyProjectsPage />} />
                <Route path="/collaboration-requests" element={<CollaborationRequestsPage />} />
                <Route path="/opportunities" element={<OpportunitiesPage />} />
                <Route path="/cv" element={<StudentCvPage />} />

                {/* 3. مسارات دور الشركة (Company Routes) */}
                <Route path="/saved-projects" element={<SavedProjectsPage />} />
                <Route path="/company/opportunities" element={<CompanyOpportunitiesPage />} />
                <Route path="/company/partnerships" element={<CompanyPartnershipsPage />} />

                {/* 4. مسارات دور المشرف الأكاديمي والإدارة (Supervisor & Management Routes) */}
                <Route path="/approvals" element={<SupervisorApprovalPage />} />
                <Route path="/supervisor/reviews" element={<SupervisorApprovalPage />} />
                <Route path="/manage/projects" element={<ManageProjectsPage />} />
                <Route path="/manage/students" element={<ManageStudentsPage />} />
                <Route path="/manage/companies" element={<ManageCompaniesPage />} />
                <Route path="/manage/collaborations" element={<ManageCollaborationsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/supervisor/reports" element={<ReportsPage />} />
                <Route path="/manage/logs" element={<ActivityLogsPage />} />
                <Route path="/teams" element={<TeamsHubPage />} />

                {/* صفحة 404 لأي مسار غير معرّف داخل التطبيق */}
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