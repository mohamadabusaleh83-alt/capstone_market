import { Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ToastContainer from '../components/ToastContainer';
import ChatModal from '../components/ChatModal';
import SubmitReportModal from '../components/SubmitReportModal';
import SkillsModal from '../components/SkillsModal';
import CreateProjectModal from '../components/CreateProjectModal';
import ApplyModal from '../components/ApplyModal';
import ApplicationsModal from '../components/ApplicationsModal';

export default function MainLayout() {
  const { isRtl } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      <Navbar />

      <div className="flex-1 flex relative overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/80">
          <Outlet />
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <ToastContainer />
      <ChatModal />
      <SubmitReportModal />
      <SkillsModal />
      <CreateProjectModal />
      <ApplyModal />
      <ApplicationsModal />
    </div>
  );
}
