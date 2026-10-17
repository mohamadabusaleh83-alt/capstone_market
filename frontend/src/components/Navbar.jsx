import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import LanguageSwitcher from './LanguageSwitcher';
import {
  Menu,
  GraduationCap,
  Bell,
  RefreshCw,
  UserCheck,
  LogOut
} from 'lucide-react';

export default function Navbar() {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const {
    isRtl,
    isSidebarOpen,
    setIsSidebarOpen,
    notifications,
    isLoadingNotifications,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    getRoleLabel
  } = useApp();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 md:hidden transition cursor-pointer"
          aria-label={t('nav.sidebar_toggle')}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base text-white tracking-wide block leading-tight">
              {t('nav.platform_title')}
            </span>
            <span className="text-[10px] text-blue-400 font-mono hidden sm:inline-block">
              {t('nav.platform_version')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* زر تبديل اللغة (Language Switcher) المثبت بجانب الإشعارات وتسجيل الخروج */}
        <LanguageSwitcher />

        {/* أيقونة الإشعارات والتنبيهات التفاعلية */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700/60 shadow-sm"
            title={t('notifications.title')}
            aria-label={t('notifications.title')}
          >
            <Bell className="w-4 h-4 text-blue-400" />
            {unreadCount > 0 && (
              <span
                className={`absolute -top-1 ${
                  isRtl ? '-left-1' : '-right-1'
                } bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse shadow-md shadow-rose-500/50`}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* القائمة المنسدلة للإشعارات */}
          {isNotificationsOpen && (
            <div
              className={`absolute ${
                isRtl ? 'left-0' : 'right-0'
              } mt-2 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white">{t('notifications.title')}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                    {notifications.length}
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllNotificationsRead}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer transition active:scale-95"
                  >
                    {t('notifications.mark_all_read')}
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {isLoadingNotifications && notifications.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                    <span>{t('notifications.loading')}</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 px-4 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-600">
                      <Bell className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-slate-300">{t('notifications.empty')}</span>
                    <span className="text-[10px] text-slate-500">
                      {isRtl ? 'ستظهر الإشعارات الفورية هنا عند تلقي أي تحديث' : 'Real-time alerts will appear here'}
                    </span>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && handleMarkNotificationRead(n.id)}
                      className={`p-3 text-xs transition cursor-pointer flex items-start gap-2.5 ${
                        n.is_read
                          ? 'bg-slate-900/60 hover:bg-slate-850/60 opacity-75'
                          : 'bg-slate-850/90 hover:bg-slate-800 border-s-2 border-blue-500'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.is_read ? 'bg-transparent' : 'bg-blue-400'
                        }`}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{n.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(n.created_at).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {currentUser && (
          <>
            <span
              className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${
                currentUser.role === 'supervisor'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                  : currentUser.role === 'company'
                    ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
              }`}
            >
              {getRoleLabel(currentUser.role)}
            </span>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>{currentUser.name}</span>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                title={t('nav.logout_tooltip')}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('nav.logout')}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
