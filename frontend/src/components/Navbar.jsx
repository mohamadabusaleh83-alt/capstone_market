import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import {
  Menu,
  Bell,
  RefreshCw,
  UserCheck
} from 'lucide-react';

export default function Navbar() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
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
  const navigate = useNavigate();

  // الإشعار يُعلَّم كمقروء ويفتح الصفحة المرتبطة به (I-33)
  const openNotification = (n) => {
    if (!n.is_read) handleMarkNotificationRead(n.id);
    if (n.link) {
      setIsNotificationsOpen(false);
      navigate(n.link);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="h-16 bg-white/95 dark:bg-[#101E42]/95 backdrop-blur-md border-b border-slate-200/60 dark:border-white/5 sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between gap-2 shadow-xs transition-colors duration-200">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {currentUser && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#152550] hover:bg-slate-200 dark:hover:bg-[#182b5c] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-[#2499F2]/20 md:hidden transition cursor-pointer shadow-xs active:scale-95 flex items-center justify-center"
            aria-label={t('nav.sidebar_toggle', 'القائمة الجانبية')}
            title={t('nav.sidebar_toggle', 'القائمة الجانبية')}
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link
          to={currentUser ? '/' : '/about'}
          title={t('nav.back_home')}
          className="flex items-center gap-2.5 cursor-pointer hover:scale-105 transition-transform duration-200 select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#0B152E] border border-slate-200 dark:border-[#2499F2]/30 flex items-center justify-center shadow-md shadow-[#2499F2]/10 dark:shadow-[#2499F2]/20 overflow-hidden shrink-0 group-hover:border-[#2499F2]/60 transition-colors">
            <img src="/logo.svg" alt={t('nav.platform_title')} className="w-7 h-7 object-contain" />
          </div>
          <div className="hidden sm:block">
            <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-wide block leading-tight group-hover:text-[#2499F2] dark:group-hover:text-[#28C8C0] transition-colors">
              {t('nav.platform_title')}
            </span>
            <span className="text-[10px] text-[#2499F2] dark:text-[#28C8C0] font-sans font-semibold hidden sm:inline-block">
              Capstone Market
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* زر تبديل الوضع الليلي / النهاري (Theme Toggle) */}
        <ThemeToggle />

        {/* زر تبديل اللغة (Language Switcher) المثبت بجانب الإشعارات وتسجيل الخروج */}
        <LanguageSwitcher />

        {/* أيقونة الإشعارات والتنبيهات التفاعلية (للمستخدم المسجل فقط) */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-[#152550] hover:bg-slate-200 dark:hover:bg-[#182b5c] text-slate-700 dark:text-slate-200 hover:text-[#2499F2] dark:hover:text-white transition cursor-pointer border border-slate-200 dark:border-[#2499F2]/20 shadow-sm"
              title={t('notifications.title')}
              aria-label={t('notifications.title')}
            >
              <Bell className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
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
                } mt-2 w-[calc(100vw-1.5rem)] max-w-80 sm:w-96 sm:max-w-none bg-white/95 dark:bg-[#101E42]/98 backdrop-blur-xl border border-slate-200 dark:border-[#2499F2]/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                <div className="p-3.5 bg-slate-50 dark:bg-[#0B152E] border-b border-slate-200 dark:border-[#2499F2]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{t('notifications.title')}</span>
                    <span className="text-[10px] bg-slate-200 dark:bg-[#152550] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono">
                      {notifications.length}
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="text-[10px] text-[#2499F2] dark:text-[#28C8C0] hover:text-blue-500 dark:hover:text-[#77DCC1] font-semibold cursor-pointer transition active:scale-95"
                    >
                      {t('notifications.mark_all_read')}
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                  {isLoadingNotifications && notifications.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#2499F2] dark:text-[#28C8C0]" />
                      <span>{t('notifications.loading')}</span>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-10 px-4 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#152550] flex items-center justify-center text-slate-400 dark:text-slate-400">
                        <Bell className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{t('notifications.empty')}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400">
                        {isRtl ? 'ستظهر الإشعارات الفورية هنا عند تلقي أي تحديث' : 'Real-time alerts will appear here'}
                      </span>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => openNotification(n)}
                        className={`p-3 text-xs transition cursor-pointer flex items-start gap-2.5 ${
                          n.is_read
                            ? 'bg-white/60 dark:bg-[#101E42]/60 hover:bg-slate-50 dark:hover:bg-[#152550]/60 opacity-75'
                            : 'bg-slate-50/90 dark:bg-[#152550]/90 hover:bg-slate-100/90 dark:hover:bg-[#182b5c] border-s-2 border-[#2499F2]'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            n.is_read ? 'bg-transparent' : 'bg-[#2499F2] dark:bg-[#28C8C0]'
                          }`}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white">{n.title}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-400">
                              {new Date(n.created_at).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* كبسولة بروفايل موحدة وأنيقة (أيقونة مستخدم صغيرة + الاسم + شارة الدور بلون تركوازي هادئ) */}
        {currentUser && (
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-[#152550] border border-slate-200 dark:border-[#2499F2]/20 px-3 py-1.5 rounded-full shadow-xs">
            <UserCheck className="w-3.5 h-3.5 text-[#28C8C0] shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[110px] sm:max-w-[160px]">
              {currentUser.name}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#28C8C0]/15 dark:bg-[#28C8C0]/20 text-[#101E42] dark:text-[#77DCC1] border border-[#28C8C0]/30 shrink-0">
              {getRoleLabel(currentUser.role)}
            </span>
          </div>
        )}

        {!currentUser && (
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#1D7BC3] hover:from-[#1D7BC3] hover:to-[#175E95] text-white text-xs font-bold shadow-md shadow-[#2499F2]/20 active:scale-95 transition-all cursor-pointer"
          >
            <span>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
