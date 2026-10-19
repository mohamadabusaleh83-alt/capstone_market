import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Briefcase,
  Plus,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
  FileText,
  Calendar,
  Sparkles,
  ChevronRight,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export default function MyProjectsPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { isRtl, rawProjects, setIsCreateModalOpen, milestones, setSelectedChatProject } = useApp();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'proposals' | 'milestones'

  // جلب المشروع الفعلي أو توفير مشروع تخرج مكتمل التفاصيل للطالب
  const studentProject = rawProjects.find(
    (p) => p.owner_id === currentUser?.id || p.title?.includes('المستودعات') || p.title?.includes('POS')
  ) || {
    id: 101,
    title: isRtl
      ? 'نظام إدارة المستودعات ونقاط البيع السحابي (POS)'
      : 'Cloud Warehouse & POS Inventory Management System',
    description: isRtl
      ? 'نظام متكامل يربط حركة المخزون بنقاط البيع السحابية مع خوارزميات التنبؤ باحتياجات التوريد والربط مع الفواتير الإلكترونية.'
      : 'Comprehensive system connecting real-time inventory with cloud POS, featuring supply chain prediction algorithms and e-invoicing.',
    supervisor: 'د. أسامة أمين مرعي',
    status: 'approved',
    statusLabel: isRtl ? 'معتمد أكاديمياً' : 'Academically Approved',
    progress: 75,
    members: [
      { name: 'أحمد منصور', role: 'مطور واجهات ومحلل أعمال', avatar: '👨‍🎓' },
      { name: 'محمد النجار', role: 'مهندس نظم خلفية وقواعد بيانات', avatar: '👨‍💻' }
    ],
    techStack: ['React', 'FastAPI', 'PostgreSQL', 'Docker', 'TailwindCSS'],
    companyPartner: 'شركة النور للحلول البرمجية'
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
              {isRtl ? 'مشروعي / المشاريع الخاصة' : 'My Projects'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-[#2499F2]" />
            <span>{isRtl ? 'مشروع التخرج الخاص بي' : 'My Capstone Project'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'متابعة مراحل المشروع، الاعتماد الأكاديمي، التقارير الدورية، والشركاء الصناعيين.'
              : 'Track capstone progress, faculty approvals, milestone deliverables, and company partnerships.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:opacity-95 text-[#101E42] font-black text-xs shadow-md shadow-[#2499F2]/20 transition cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-[#101E42]" />
          <span>{isRtl ? 'إضافة / اقتراح مشروع تخرج' : 'Add / Propose Project'}</span>
        </button>
      </div>

      {/* بطاقة المشروع الرئيسية الفخمة */}
      <div className="bg-[#101E42] text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl border border-[#2499F2]/25">
        <div className="absolute top-0 end-0 w-96 h-96 bg-[#28C8C0]/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{studentProject.statusLabel}</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-[#2499F2]/20 text-[#77DCC1] border border-[#2499F2]/30 text-xs font-bold">
                مشروع تخرج 2
              </span>
            </div>

            <div className="text-xs text-slate-300 flex items-center gap-1.5 font-mono">
              <Calendar className="w-4 h-4 text-[#28C8C0]" />
              <span>الفصل الأكاديمي الحالي 2026</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {studentProject.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {studentProject.description}
            </p>
          </div>

          {/* شريط الإنجاز العام */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2 max-w-2xl">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">{isRtl ? 'نسبة التقدم العام في المشروع:' : 'Overall Project Progress:'}</span>
              <span className="text-[#28C8C0] font-mono text-sm">{studentProject.progress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#2499F2] to-[#28C8C0] h-full rounded-full transition-all duration-500"
                style={{ width: `${studentProject.progress}%` }}
              />
            </div>
          </div>

          {/* معلومات المشرف والشركة والتقنيات */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#0B152E]/80 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400">{isRtl ? 'المشرف الأكاديمي' : 'Supervisor'}</div>
                <div className="text-xs font-bold text-white truncate">{studentProject.supervisor}</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0B152E]/80 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2499F2]/20 text-[#2499F2] flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400">{isRtl ? 'الجهة الراعية / الشريكة' : 'Partner Company'}</div>
                <div className="text-xs font-bold text-white truncate">{studentProject.companyPartner}</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0B152E]/80 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400">{isRtl ? 'أعضاء الفريق' : 'Team Members'}</div>
                <div className="text-xs font-bold text-white truncate">طالبين (مكتمل)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* أعضاء الفريق والتقارير الإشرافية */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* بطاقة أعضاء الفريق */}
        <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/10">
            <Users className="w-4 h-4 text-[#2499F2]" />
            <span>{isRtl ? 'فريق العمل الطلابي' : 'Student Team Members'}</span>
          </h3>

          <div className="space-y-3">
            {studentProject.members.map((member, i) => (
              <div
                key={i}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B152E] border border-slate-200 dark:border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{member.avatar}</div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{member.name}</div>
                    <div className="text-[11px] text-slate-500">{member.role}</div>
                  </div>
                </div>
                <span className="text-[10px] bg-[#28C8C0]/15 text-[#28C8C0] px-2 py-0.5 rounded-full font-bold">
                  {i === 0 ? (isRtl ? 'قائد الفريق' : 'Lead') : (isRtl ? 'عضو' : 'Member')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              to="/teams"
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-[#0B152E] hover:bg-[#2499F2]/15 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#2499F2]" />
              <span>{isRtl ? 'عرض شُعب التخرج والملتقى' : 'View Teams Hub'}</span>
            </Link>
          </div>
        </div>

        {/* مراحل التسليم والتقارير الأكاديمية */}
        <div className="lg:col-span-2 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#28C8C0]" />
              <span>{isRtl ? 'مراحل التسليم والتقارير الدورية' : 'Milestone Deliverables'}</span>
            </h3>
            <Link
              to="/reports"
              className="text-xs text-[#2499F2] hover:underline font-bold"
            >
              {isRtl ? 'فتح مركز التقارير الكامل ←' : 'Open Reports Page →'}
            </Link>
          </div>

          <div className="space-y-3">
            {milestones.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B152E] border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                    {m.title}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>{isRtl ? 'الموعد:' : 'Deadline:'} {m.deadlineDay}</span>
                    <span>•</span>
                    <span className="text-amber-500 font-semibold">{m.supervisorFeedback}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                      m.status === 'submitted'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                    }`}
                  >
                    {m.status === 'submitted' ? (isRtl ? '✓ تم التسليم' : 'Submitted') : (isRtl ? '⏳ قيد الإنجاز' : 'Pending')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
