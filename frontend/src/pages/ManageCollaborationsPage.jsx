import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import {
  Users,
  Building2,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  Search,
  MessageSquare
} from 'lucide-react';

export default function ManageCollaborationsPage() {
  const { t } = useTranslation();
  const { rawProjects, applications, isRtl, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');

  // استخراج كافة اتفاقيات وشراكات التعاون الفعلية من قاعدة البيانات
  const collabList = useMemo(() => {
    return (applications || [])
      .filter((a) => a.status === 'accepted')
      .map((app) => {
        const proj = (rawProjects || []).find((p) => p.id === app.project_id);
        return {
          id: app.id,
          company: proj?.company_name || (isRtl ? 'حاضنة التخرج والابتكار' : 'Capstone Innovation Hub'),
          project: app.project_title || proj?.title || (isRtl ? `مشروع #${app.project_id}` : `Project #${app.project_id}`),
          students: app.student_name || (isRtl ? `طالب #${app.student_id}` : `Student #${app.student_id}`),
          scope: app.message?.includes('Role:') ? app.message.split('Role:')[1]?.split(']')[0]?.trim() : (isRtl ? 'تنفيذ وتطوير تكنولوجي' : 'Tech Execution'),
          supervisorEndorsement: proj?.status === 'approved' ? 'approved' : 'pending',
          date: app.created_at ? new Date(app.created_at).toISOString().split('T')[0] : '2026-10-20'
        };
      });
  }, [applications, rawProjects, isRtl]);

  const handleEndorse = (id) => {
    showToast(isRtl ? 'تمت المصادقة الأكاديمية على اتفاقية التعاون بنجاح!' : 'Collaboration officially endorsed!', 'success');
  };

  const filtered = collabList.filter(
    (c) =>
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.project.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              {isRtl ? 'الإشراف على التعاون' : 'Supervise Collaborations'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#2499F2]" />
            <span>{isRtl ? 'الإشراف الأكاديمي على طلبات التعاون والشراكات' : 'Academic Supervision of Industry Partnerships'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'مراجعة ومصادقة اتفاقيات الرعاية والتعاون المتبادلة بين الفرق الطلابية والشركات.'
              : 'Review, endorse, and academically certify sponsorship agreements between students and industry.'}
          </p>
        </div>
      </div>

      {/* البحث السريع */}
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-2xl p-3 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder={isRtl ? 'ابحث بالشركة أو المشروع...' : 'Search by company or project...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] ps-9"
          />
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5 pointer-events-none" />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          {collabList.length} {isRtl ? 'شراكات مسجلة' : 'Agreements'}
        </div>
      </div>

      {/* جدول الشراكات */}
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs min-w-[640px]">
            <thead className="bg-slate-50 dark:bg-[#0B152E] text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'الشركة الشريكة' : 'Partner Company'}</th>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'مشروع التخرج المستهدف' : 'Target Project'}</th>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'الفريق الطلابي' : 'Student Team'}</th>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'نطاق الرعاية' : 'Scope'}</th>
                <th className="py-3.5 px-4 text-center">{isRtl ? 'المصادقة الأكاديمية' : 'Academic Endorsement'}</th>
                <th className="py-3.5 px-4 text-end">{isRtl ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-[#152550]/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#2499F2]" />
                    <span>{item.company}</span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-700 dark:text-slate-200 font-medium">
                    {item.project}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {item.students}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {item.scope}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.supervisorEndorsement === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                      }`}
                    >
                      {item.supervisorEndorsement === 'approved' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isRtl ? 'مصادق عليه' : 'Endorsed'}</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>{isRtl ? 'بانتظار المصادقة' : 'Pending'}</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-end">
                    {item.supervisorEndorsement === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => handleEndorse(item.id)}
                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] font-black text-[11px] shadow-sm transition cursor-pointer active:scale-95"
                      >
                        {isRtl ? 'مصادقة واعتماد' : 'Endorse'}
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        ✓ {isRtl ? 'معتمد رسمياً' : 'Certified'}
                      </span>
                    )}
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
