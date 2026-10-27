import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ToastContainer from '../components/ToastContainer';
import ChatModal from '../components/ChatModal';
import SkillsModal from '../components/SkillsModal';
import CreateProjectModal from '../components/CreateProjectModal';
import ApplyModal from '../components/ApplyModal';
import ApplicationsModal from '../components/ApplicationsModal';
import StudentOnboardingModal from '../components/StudentOnboardingModal';

export default function MainLayout() {
  const { t } = useTranslation();
  const { isRtl } = useApp();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#0B152E] dark:text-slate-100 flex flex-col font-sans transition-colors duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
      <Navbar />

      <div className="flex-1 flex relative overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto flex flex-col justify-between p-4 md:p-6 bg-slate-100/90 dark:bg-[#0B152E]/90 transition-colors duration-200">
          <div className="flex-1">
            <Outlet />
          </div>

          {/* تذييل المنصة العام وتوثيق المطور */}
          <footer className="mt-8 pt-4 border-t border-slate-300/80 dark:border-[#2499F2]/20 text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {t('credits.brand')} - Capstone Market &copy; {new Date().getFullYear()}
              </span>
              <span className="hidden sm:inline text-slate-400">|</span>
              <Link
                to="/about"
                className="font-bold text-[#2499F2] hover:text-[#1B87D9] dark:text-[#28C8C0] dark:hover:text-[#77DCC1] transition-colors inline-flex items-center gap-1"
              >
                {isRtl ? 'عن المنصة' : 'About Platform'}
              </Link>
              <span className="hidden sm:inline text-slate-400">|</span>
              <span>{t('credits.rights')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{t('credits.developed_by')}</span>
              <a
                href="https://www.linkedin.com/in/mohamad-abu-saleh-598255350"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-[#2499F2] hover:text-[#0A66C2] dark:text-[#28C8C0] dark:hover:text-[#77DCC1] transition-colors"
                title="Mohamad Abu Saleh - LinkedIn Profile"
              >
                <svg className="w-3.5 h-3.5 fill-current text-[#0A66C2] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
                <span>{t('credits.developer_name')}</span>
              </a>
            </div>
          </footer>
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <ToastContainer />
      <ChatModal />
      <SkillsModal />
      <CreateProjectModal />
      <ApplyModal />
      <ApplicationsModal />
      <StudentOnboardingModal />
    </div>
  );
}
