import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const {
    isRtl,
    notifications,
    notificationsTotal,
    loadMoreNotifications,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead
  } = useApp();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread' | 'academic' | 'collab'

  const displayList = notifications || [];

  const filteredNotifications = displayList.filter((notif) => {
    if (activeFilter === 'unread') return !notif.is_read;
    // التصنيف من رابط الإشعار (يعمل بالعربية والإنجليزية)
    if (activeFilter === 'academic') return ['/reports', '/supervisor', '/my-projects'].includes(notif.link);
    if (activeFilter === 'collab') return ['/company/opportunities', '/projects'].includes(notif.link);
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* مسار التنقل والترويسة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2499F2]/20">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <Link to="/dashboard" className="hover:text-[#2499F2] transition">
              {t('sidebar.dashboard', 'الرئيسية')}
            </Link>
            <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              {isRtl ? 'مركز الإشعارات' : 'Notifications Center'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-[#28C8C0]" />
            <span>{isRtl ? 'مركز الإشعارات والتنبيهات الأكاديمية' : 'Notifications & Alerts Center'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'متابعة حية للقرارات الأكاديمية، عروض الشركات، وتحديثات مشاريع التخرج.'
              : 'Real-time updates on academic decisions, corporate offers, and capstone milestones.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleMarkAllNotificationsRead}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:opacity-95 text-[#101E42] font-black text-xs shadow-md shadow-[#2499F2]/20 transition cursor-pointer active:scale-95 shrink-0"
        >
          <CheckCheck className="w-4 h-4 text-[#101E42]" />
          <span>{isRtl ? 'تحديد الكل كمقروء' : 'Mark All as Read'}</span>
        </button>
      </div>

      {/* أشرطة التصفية والإحصاء السريع */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-2xl p-2.5 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#2499F2] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#152550]'
            }`}
          >
            {isRtl ? 'جميع الإشعارات' : 'All'} ({displayList.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('unread')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'unread'
                ? 'bg-[#28C8C0] text-[#101E42] shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#152550]'
            }`}
          >
            <span>{isRtl ? 'غير المقروءة' : 'Unread'}</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('academic')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === 'academic'
                ? 'bg-[#2499F2] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#152550]'
            }`}
          >
            {isRtl ? 'تنبيهات أكاديمية' : 'Academic'}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('collab')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === 'collab'
                ? 'bg-[#2499F2] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#152550]'
            }`}
          >
            {isRtl ? 'شراكات وتعاون' : 'Collaborations'}
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 px-2 font-medium">
          {isRtl ? 'يتم التحديث فورياً' : 'Live synced'}
        </div>
      </div>

      {/* قائمة الإشعارات التفاعلية */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-8 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#2499F2]/10 border border-[#2499F2]/20 text-[#2499F2] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-[#28C8C0]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {isRtl ? 'لا توجد إشعارات مطابقة' : 'No notifications found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isRtl ? 'أنت على اطلاع كامل بجميع التحديثات والقرارات.' : 'You are all caught up with recent updates.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkNotificationRead(notif.id)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-start gap-4 cursor-pointer relative overflow-hidden group ${
                notif.is_read
                  ? 'bg-white/80 dark:bg-[#101E42]/60 border-slate-200 dark:border-white/5 opacity-80 hover:opacity-100'
                  : 'bg-white dark:bg-[#101E42] border-[#2499F2]/40 dark:border-[#28C8C0]/40 shadow-md dark:shadow-[0_4px_20px_rgba(40,200,192,0.1)]'
              }`}
            >
              {!notif.is_read && (
                <div className="absolute top-0 start-0 w-1.5 h-full bg-gradient-to-b from-[#2499F2] to-[#28C8C0]" />
              )}

              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  notif.type === 'academic'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                    : 'bg-[#2499F2]/15 text-[#2499F2] dark:text-[#28C8C0] border border-[#2499F2]/25'
                }`}
              >
                {notif.type === 'academic' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>
                      {notif.created_at
                        ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'الآن'}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                  {notif.message}
                </p>

                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-[#2499F2] dark:text-[#28C8C0] font-semibold group-hover:underline">
                    {isRtl ? 'عرض التفاصيل والرد ←' : 'View details & respond →'}
                  </span>
                  {!notif.is_read && (
                    <span className="px-2 py-0.5 rounded-full bg-[#28C8C0]/15 text-[#28C8C0] text-[10px] font-bold">
                      {isRtl ? 'جديد' : 'New'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {notifications.length < notificationsTotal && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={loadMoreNotifications}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#101E42] border border-slate-300 dark:border-[#2499F2]/30 text-slate-800 dark:text-white cursor-pointer"
            >
              {t('common.load_more')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
