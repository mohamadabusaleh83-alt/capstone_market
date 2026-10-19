import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import {
  Activity,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Filter,
  User,
  ShieldCheck,
  Building2,
  GraduationCap
} from 'lucide-react';

export default function ActivityLogsPage() {
  const { t } = useTranslation();
  const { isRtl, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [logsList] = useState([
    {
      id: 'log-1',
      action: isRtl ? 'اعتماد مشروع تخرج رسمي' : 'Project Approval Certified',
      user: 'د. أسامة أمين مرعي',
      role: 'supervisor',
      details: isRtl
        ? 'تم اعتماد مشروع (نظام إدارة المستودعات ونقاط البيع السحابي) رسمياً.'
        : 'Approved Capstone Project: POS Cloud Warehouse System.',
      ip: '192.168.1.45',
      status: 'success',
      timestamp: 'قبل 15 دقيقة'
    },
    {
      id: 'log-2',
      action: isRtl ? 'إرسال طلب رعاية وشراكة' : 'Partnership Proposal Sent',
      user: 'شركة النور للحلول البرمجية',
      role: 'company',
      details: isRtl
        ? 'تقديم عرض رعاية وتمويل سحابي لمشروع الذكاء الاصطناعي.'
        : 'Submitted sponsorship offer for AI Capstone Project.',
      ip: '192.168.1.82',
      status: 'success',
      timestamp: 'قبل 45 دقيقة'
    },
    {
      id: 'log-3',
      action: isRtl ? 'تسليم تقرير المتطلبات (SRS)' : 'Milestone Report Submitted',
      user: 'أحمد منصور',
      role: 'student',
      details: isRtl
        ? 'رفع وثيقة هندسة المتطلبات والنظام بصيغة PDF.'
        : 'Uploaded SRS Requirements PDF document.',
      ip: '192.168.1.104',
      status: 'success',
      timestamp: 'قبل ساعتين'
    },
    {
      id: 'log-4',
      action: isRtl ? 'تسجيل دخول موحد' : 'Unified User Login',
      user: 'د. أسامة أمين مرعي',
      role: 'supervisor',
      details: isRtl ? 'تسجيل دخول ناجح إلى اللوحة الإشرافية.' : 'Successful login to Supervisor workspace.',
      ip: '192.168.1.45',
      status: 'success',
      timestamp: 'قبل 3 ساعات'
    },
    {
      id: 'log-5',
      action: isRtl ? 'تحديث مهارات الطالب' : 'Student Skills Updated',
      user: 'أحمد منصور',
      role: 'student',
      details: isRtl ? 'إضافة مهارات (FastAPI, Docker, PostgreSQL).' : 'Added technical skill badges.',
      ip: '192.168.1.104',
      status: 'info',
      timestamp: 'اليوم، 10:15 ص'
    }
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast(isRtl ? 'تم تحديث سجل النشاطات الأخير' : 'Audit logs refreshed', 'success');
    }, 500);
  };

  const filtered = logsList.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && log.role === filterType;
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
              {isRtl ? 'سجل العمليات والنشاطات' : 'Activity Audit Log'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-[#2499F2]" />
            <span>{isRtl ? 'سجل العمليات والنشاطات الأخيرة في المنصة' : 'Platform Activity & Audit Logs'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'مراقبة حية لكافة عمليات الاعتماد الأكاديمي، عروض الشركات، وتسليمات الطلاب.'
              : 'Real-time audit log of approvals, milestone hand-ins, and user interactions.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#101E42] hover:bg-slate-200 dark:hover:bg-[#152550] text-slate-800 dark:text-white font-bold text-xs border border-slate-200 dark:border-[#2499F2]/30 shadow-sm transition cursor-pointer active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-[#28C8C0] ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRtl ? 'تحديث السجل' : 'Refresh Logs'}</span>
        </button>
      </div>

      {/* البحث والفلترة */}
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder={isRtl ? 'ابحث بنوع العملية أو المستخدم...' : 'Search action or user...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] ps-9"
          />
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#2499F2] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-[#0B152E] text-slate-600 dark:text-slate-300'
            }`}
          >
            {isRtl ? 'الكل' : 'All'}
          </button>

          <button
            type="button"
            onClick={() => setFilterType('supervisor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'supervisor'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-100 dark:bg-[#0B152E] text-slate-600 dark:text-slate-300'
            }`}
          >
            {isRtl ? 'المشرف الأكاديمي' : 'Supervisor'}
          </button>

          <button
            type="button"
            onClick={() => setFilterType('company')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'company'
                ? 'bg-[#2499F2] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-[#0B152E] text-slate-600 dark:text-slate-300'
            }`}
          >
            {isRtl ? 'الشركات' : 'Companies'}
          </button>

          <button
            type="button"
            onClick={() => setFilterType('student')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'student'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-[#0B152E] text-slate-600 dark:text-slate-300'
            }`}
          >
            {isRtl ? 'الطلاب' : 'Students'}
          </button>
        </div>
      </div>

      {/* قائمة السجلات */}
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 dark:bg-[#0B152E] text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'نوع العملية' : 'Action Type'}</th>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'المستخدم المنفذ' : 'Actor'}</th>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'التفاصيل' : 'Details'}</th>
                <th className="py-3.5 px-4 text-center">{isRtl ? 'عنوان IP' : 'IP'}</th>
                <th className="py-3.5 px-4 text-end">{isRtl ? 'التوقيت' : 'Time'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-[#152550]/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#28C8C0]" />
                    <span>{log.action}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      {log.role === 'supervisor' ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                      ) : log.role === 'company' ? (
                        <Building2 className="w-3.5 h-3.5 text-[#2499F2]" />
                      ) : (
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      <span>{log.user}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-sm truncate">
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-400">
                    {log.ip}
                  </td>
                  <td className="py-3.5 px-4 text-end font-mono text-slate-500 text-[11px]">
                    {log.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
