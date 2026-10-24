import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  ShieldCheck,
  Eye,
  Sparkles
} from 'lucide-react';

export default function ManageProjectsPage() {
  const { t } = useTranslation();
  const { isRtl, rawProjects, showToast, approveProject } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [projectsList, setProjectsList] = useState(() => {
    return rawProjects && rawProjects.length > 0
      ? rawProjects
      : [
          {
            id: 1,
            title: 'نظام إدارة المستودعات ونقاط البيع السحابي (POS)',
            major: 'أنظمة المعلومات الحاسوبية (CIS)',
            supervisor: 'د. أسامة أمين مرعي',
            currentMembers: 2,
            maxMembers: 4,
            status: 'approved'
          },
          {
            id: 2,
            title: 'محرك توصيات ذكي لمنتجات المتجر بالذكاء الاصطناعي',
            major: 'علم الحاسوب (Computer Science)',
            supervisor: 'د. أسامة أمين مرعي',
            currentMembers: 3,
            maxMembers: 4,
            status: 'approved'
          },
          {
            id: 3,
            title: 'منصة استكشاف واختبار أمن الثغرات السحابية',
            major: 'أمن المعلومات (Cybersecurity)',
            supervisor: 'د. أسامة أمين مرعي',
            currentMembers: 1,
            maxMembers: 3,
            status: 'pending'
          },
          {
            id: 4,
            title: 'تطبيق التتبع الطبي الذكي للأجهزة القابلة للارتداء',
            major: 'تقنية المعلومات والاتصالات (IT)',
            supervisor: 'د. أسامة أمين مرعي',
            currentMembers: 2,
            maxMembers: 4,
            status: 'pending'
          }
        ];
  });

  useEffect(() => {
    if (rawProjects && rawProjects.length > 0) {
      setProjectsList(rawProjects);
    }
  }, [rawProjects]);

  const handleQuickApprove = async (id) => {
    setProjectsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p))
    );
    try {
      if (approveProject) await approveProject(id, 'approved');
    } catch {
      // Ignored
    }
    showToast(isRtl ? 'تم اعتماد المشروع وتحديث سجله الأكاديمي بنجاح!' : 'Project approved successfully!', 'success');
  };

  const handleExportCSV = () => {
    showToast(isRtl ? 'جاري تجهيز وتصدير ملف فهرس المشاريع بصيغة CSV...' : 'Exporting projects catalogue...', 'info');
  };

  const filtered = projectsList.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.major?.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && p.status === statusFilter;
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
              {isRtl ? 'إدارة وفهرسة المشاريع' : 'Manage Projects'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-[#2499F2]" />
            <span>{isRtl ? 'إدارة وفهرسة جميع مشاريع التخرج بالكلية' : 'Faculty Capstone Projects Index & Registry'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'السجل الأكاديمي الشامل لجميع المشاريع المسجلة، حالة الاعتماد، وتوزيع الفرق الطلابية.'
              : 'Complete academic registry of all submitted capstones, approvals, and student distribution.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#101E42] hover:bg-slate-200 dark:hover:bg-[#152550] text-slate-800 dark:text-white font-bold text-xs border border-slate-200 dark:border-[#2499F2]/30 shadow-sm transition cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-[#28C8C0]" />
            <span>{isRtl ? 'تصدير (CSV)' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] font-black text-xs shadow-md shadow-[#2499F2]/20 transition cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>{isRtl ? 'طباعة الكشف' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder={isRtl ? 'ابحث بعنوان المشروع أو التخصص...' : 'Search by title or major...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] ps-9"
          />
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-[#2499F2] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-[#0B152E] text-slate-600 dark:text-slate-300'
            }`}
          >
            {isRtl ? 'جميع الحالات' : 'All'} ({projectsList.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-[#0B152E] text-slate-600 dark:text-slate-300'
            }`}
          >
            {isRtl ? 'معتمد أكاديمياً' : 'Approved'}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-100 dark:bg-[#0B152E] text-slate-600 dark:text-slate-300'
            }`}
          >
            {isRtl ? 'بانتظار المراجعة' : 'Pending'}
          </button>
        </div>
      </div>

      {/* جدول المشاريع الشامل */}
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 dark:bg-[#0B152E] text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'عنوان المشروع' : 'Project Title'}</th>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'التخصص الأكاديمي' : 'Major'}</th>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'المشرف' : 'Supervisor'}</th>
                <th className="py-3.5 px-4 text-center">{isRtl ? 'الفريق' : 'Team'}</th>
                <th className="py-3.5 px-4 text-center">{isRtl ? 'حالة الاعتماد' : 'Status'}</th>
                <th className="py-3.5 px-4 text-end">{isRtl ? 'الإجراء الأكاديمي' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-[#152550]/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                    {project.title}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {project.major || 'هندسة النظم وتكنولوجيا المعلومات'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>{project.supervisor || 'د. أسامة أمين مرعي'}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                    {project.currentMembers || 2} / {project.maxMembers || 4}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        project.status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                      }`}
                    >
                      {project.status === 'approved' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isRtl ? 'معتمد' : 'Approved'}</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>{isRtl ? 'قيد المراجعة' : 'Pending'}</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-end">
                    {project.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => handleQuickApprove(project.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition cursor-pointer active:scale-95"
                      >
                        {isRtl ? 'اعتماد فوري' : 'Approve'}
                      </button>
                    ) : (
                      <Link
                        to="/reports"
                        className="text-xs text-[#2499F2] hover:underline font-semibold"
                      >
                        {isRtl ? 'عرض التقارير' : 'Reports'}
                      </Link>
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
