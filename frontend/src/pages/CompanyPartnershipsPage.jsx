import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import {
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  MessageSquare,
  FileText,
  ShieldCheck,
  Calendar,
  ExternalLink
} from 'lucide-react';

export default function CompanyPartnershipsPage() {
  const { t } = useTranslation();
  const { isRtl, setSelectedChatProject, showToast } = useApp();

  const partnershipsList = [
    {
      id: 1,
      projectTitle: isRtl
        ? 'نظام إدارة المستودعات ونقاط البيع السحابي (POS)'
        : 'Cloud Warehouse & POS Inventory Management System',
      teamLead: 'أحمد منصور',
      membersCount: 2,
      supervisor: 'د. أسامة أمين مرعي',
      progress: 75,
      currentMilestone: isRtl ? 'وثيقة المتطلبات والهيكلية المعمارية (SRS)' : 'SRS & Architecture Specification',
      nextDelivery: '2026-10-27',
      status: 'active',
      statusLabel: isRtl ? 'شراكة نشطة' : 'Active Partnership'
    },
    {
      id: 2,
      projectTitle: isRtl
        ? 'محرك توصيات ذكي لمنتجات المتاجر بالذكاء الاصطناعي'
        : 'AI-Powered E-Commerce Recommendation Engine',
      teamLead: 'سارة خليل',
      membersCount: 3,
      supervisor: 'د. أسامة أمين مرعي',
      progress: 50,
      currentMilestone: isRtl ? 'النموذج الأولي واختبار التوافق' : 'Prototype & Model Benchmarking',
      nextDelivery: '2026-11-17',
      status: 'active',
      statusLabel: isRtl ? 'شراكة نشطة' : 'Active Partnership'
    }
  ];

  const handleOpenChat = (title) => {
    setSelectedChatProject({ title });
    showToast(isRtl ? `تم فتح غرفة التواصل مع فريق (${title})` : `Opened chat with team`, 'info');
  };

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
              {isRtl ? 'الشراكات النشطة' : 'Active Partnerships'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#28C8C0]" />
            <span>{isRtl ? 'المشاريع والفرق المتعاونة حالياً ومتابعة الإنجاز' : 'Active Partnerships & Capstone Teams'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'متابعة حية للفرق الطلابية التي ترعاها الشركة، مؤشرات الإنجاز، والتنسيق المباشر مع المشرف الأكاديمي.'
              : 'Monitor sponsored student teams, progress indicators, deliverables, and academic supervision.'}
          </p>
        </div>
      </div>

      {/* قائمة الشراكات النشطة */}
      <div className="space-y-4">
        {partnershipsList.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-3xl bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 shadow-sm space-y-5 hover:border-[#2499F2]/40 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{item.statusLabel}</span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {item.membersCount} {isRtl ? 'طلاب في الفريق' : 'Students'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {item.projectTitle}
                </h3>
              </div>

              <div className="text-end">
                <div className="text-xs text-slate-400">{isRtl ? 'نسبة الإنجاز:' : 'Progress:'}</div>
                <div className="text-lg font-mono font-black text-[#28C8C0]">{item.progress}%</div>
              </div>
            </div>

            {/* شريط الإنجاز */}
            <div className="w-full bg-slate-100 dark:bg-[#0B152E] rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#2499F2] to-[#28C8C0] h-full rounded-full transition-all duration-500"
                style={{ width: `${item.progress}%` }}
              />
            </div>

            {/* تفاصيل التسليم والمشرف */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#0B152E] border border-slate-200 dark:border-white/10 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">{isRtl ? 'المشرف الأكاديمي:' : 'Supervisor:'}</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>{item.supervisor}</span>
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">{isRtl ? 'المرحلة الحالية:' : 'Current Milestone:'}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {item.currentMilestone}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">{isRtl ? 'موعد التسليم القادم:' : 'Next Deliverable:'}</span>
                <span className="font-mono text-[#2499F2] font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.nextDelivery}</span>
                </span>
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="text-xs text-slate-500">
                {isRtl ? 'قائد الفريق الطلابي:' : 'Team Lead:'} <span className="font-bold text-slate-800 dark:text-slate-200">{item.teamLead}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenChat(item.projectTitle)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] font-black text-xs shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'غرفة النقاش والشات' : 'Project Chat'}</span>
                </button>

                <Link
                  to="/reports"
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#0B152E] hover:bg-[#2499F2]/15 text-slate-800 dark:text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-[#2499F2]" />
                  <span>{isRtl ? 'سجل التقارير' : 'View Reports'}</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
