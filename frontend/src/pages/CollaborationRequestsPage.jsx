import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Users,
  Send,
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Building2,
  GraduationCap,
  MessageSquare
} from 'lucide-react';

export default function CollaborationRequestsPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { isRtl, applications, rawProjects, updateApplicationStatus, showToast } = useApp();

  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'

  // استخراج كافة طلبات التعاون الحقيقية من قاعدة البيانات
  const requestsList = useMemo(() => {
    return (applications || []).map((app) => {
      const proj = (rawProjects || []).find((p) => p.id === app.project_id);
      const isReceived =
        currentUser?.role === 'company' ||
        currentUser?.role === 'supervisor' ||
        (proj && String(proj.created_by) === String(currentUser?.id));

      return {
        id: app.id,
        senderName: app.student_name || (isRtl ? `طالب متقدم #${app.student_id}` : `Applicant #${app.student_id}`),
        senderType: 'student',
        targetProject: app.project_title || proj?.title || (isRtl ? `مشروع #${app.project_id}` : `Project #${app.project_id}`),
        roleOffered: app.message?.includes('Role:') ? app.message.split('Role:')[1]?.split(']')[0]?.trim() : (isRtl ? 'طلب انضمام ورعاية' : 'Join & Sponsorship'),
        message: app.message || '',
        createdAt: app.created_at || '2026-10-18T10:30:00Z',
        status: app.status === 'accepted' ? 'approved' : app.status,
        isReceived
      };
    });
  }, [applications, rawProjects, currentUser, isRtl]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const targetStatus = newStatus === 'approved' ? 'accepted' : 'rejected';
      if (updateApplicationStatus) {
        await updateApplicationStatus(id, targetStatus);
      }
    } catch {
      // Ignored
    }
  };

  const filteredRequests = requestsList.filter((req) => {
    if (activeTab === 'received') return req.isReceived;
    return !req.isReceived;
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
              {isRtl ? 'طلبات التعاون' : 'Collaboration Requests'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#28C8C0]" />
            <span>{isRtl ? 'طلبات التعاون والشراكات الأكاديمية والمهنية' : 'Collaboration & Partnership Requests'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'إدارة عروض الرعاية من الشركات، طلبات الانضمام للفرق الطلابية، والمتابعة الأكاديمية.'
              : 'Review sponsorship proposals, team applications, and academic endorsements.'}
          </p>
        </div>
      </div>

      {/* أزرار التبديل السريعة */}
      <div className="flex gap-2 p-1.5 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-2xl w-fit shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'received'
              ? 'bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] font-black shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#152550]'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>{isRtl ? 'الطلبات الواردة (Inbound)' : 'Incoming Requests'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'sent'
              ? 'bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] font-black shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#152550]'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>{isRtl ? 'الطلبات المرسلة (Sent)' : 'Sent Requests'}</span>
        </button>
      </div>

      {/* قائمة بطاقات الطلبات أو الحالة الفارغة المنظمة */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-8 shadow-sm max-w-xl mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#2499F2]/10 border border-[#2499F2]/20 text-[#2499F2] flex items-center justify-center mx-auto">
            <Users className="w-7 h-7 text-[#28C8C0]" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {activeTab === 'received'
              ? (isRtl ? 'لا توجد طلبات واردة حالياً' : 'No incoming requests')
              : (isRtl ? 'لم تقم بإرسال أي طلبات تعاون بعد' : 'No sent requests yet')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {activeTab === 'received'
              ? (isRtl ? 'ستظهر هنا طلبات الانضمام والرعاية الواردة لحسابكم فور وصولها.' : 'Incoming partnership inquiries will appear here.')
              : (isRtl ? 'يمكنك تصفح سوق المشاريع وتقديم طلبات رعاية أو انضمام مباشرة.' : 'Browse the project market to submit collaboration requests.')}
          </p>
          <div className="pt-2">
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] font-black text-xs shadow-md"
            >
              <span>{isRtl ? 'استكشاف المشاريع المتاحة ←' : 'Explore Projects →'}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
        {filteredRequests.map((req) => (
          <div
            key={req.id}
            className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 shadow-sm space-y-4 transition hover:border-[#2499F2]/40"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    req.senderType === 'company'
                      ? 'bg-[#2499F2]/15 text-[#2499F2]'
                      : 'bg-[#28C8C0]/15 text-[#28C8C0]'
                  }`}
                >
                  {req.senderType === 'company' ? <Building2 className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {req.senderName}
                  </h3>
                  <div className="text-xs text-[#2499F2] dark:text-[#77DCC1] font-semibold">
                    {req.targetProject}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    req.status === 'approved'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : req.status === 'rejected'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {req.status === 'approved' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'تمت الموافقة' : 'Approved'}</span>
                    </>
                  ) : req.status === 'rejected' ? (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'تم الرفض' : 'Rejected'}</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'قيد المراجعة' : 'Pending Review'}</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B152E] border border-slate-200 dark:border-white/10 space-y-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isRtl ? 'تفاصيل العرض / الدور المطلوب:' : 'Offered Role / Proposal:'} {req.roleOffered}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                "{req.message}"
              </p>
            </div>

            {/* أزرار الإجراءات التفاعلية */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="text-[11px] text-slate-400 font-mono">
                {isRtl ? 'تاريخ الإرسال:' : 'Submitted:'} {new Date(req.createdAt).toLocaleDateString()}
              </div>

              {req.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(req.id, 'approved')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'قبول الشراكة' : 'Accept Request'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(req.id, 'rejected')}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#0B152E] hover:bg-rose-500/10 text-rose-600 font-bold text-xs border border-slate-200 dark:border-white/10 transition cursor-pointer"
                  >
                    {isRtl ? 'اعتذار' : 'Decline'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
