import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  UserX,
  Mail
} from 'lucide-react';

export default function ManageStudentsPage() {
  const { t } = useTranslation();
  const { isRtl, studentsList, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'linked' | 'free'

  const filtered = studentsList.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.academicId.includes(searchTerm) ||
      st.major.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'linked') return matchesSearch && !st.isFree;
    if (filterType === 'free') return matchesSearch && st.isFree;
    return matchesSearch;
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
              {isRtl ? 'إدارة شؤون الطلاب' : 'Manage Students'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-[#2499F2]" />
            <span>{isRtl ? 'جدول إدارة ومتابعة شؤون الطلاب والفرق المسجلة' : 'Student Registry & Capstone Cohort'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'متابعة ارتباط الطلبة بالمشاريع، مهاراتهم المسجلة، وحالات تشكيل الفرق لشُعب التخرج.'
              : 'Track student project associations, skill profiles, and team formations across sections.'}
          </p>
        </div>

        <Link
          to="/teams"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] font-black text-xs shadow-md shadow-[#2499F2]/20 transition cursor-pointer active:scale-95 shrink-0"
        >
          <GraduationCap className="w-4 h-4" />
          <span>{isRtl ? 'ملتقى الفرق والشُعب' : 'Teams Hub'}</span>
        </Link>
      </div>

      {/* البحث والفلترة */}
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder={isRtl ? 'ابحث بالاسم، الرقم الجامعي، أو التخصص...' : 'Search by name, student ID, or major...'}
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
            {isRtl ? 'جميع الطلاب' : 'All'} ({studentsList.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('linked')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'linked'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-[#0B152E] text-slate-600 dark:text-slate-300'
            }`}
          >
            {isRtl ? 'مرتبط بفريق' : 'Assigned'}
          </button>

          <button
            type="button"
            onClick={() => setFilterType('free')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'free'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-100 dark:bg-[#0B152E] text-slate-600 dark:text-slate-300'
            }`}
          >
            {isRtl ? 'يبحث عن فريق' : 'Looking for Team'}
          </button>
        </div>
      </div>

      {/* جدول الطلاب */}
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 dark:bg-[#0B152E] text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'الرقم الجامعي' : 'Student ID'}</th>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'اسم الطالب' : 'Student Name'}</th>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'التخصص والمساق' : 'Major & Course'}</th>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'المشروع المرتبط' : 'Assigned Project'}</th>
                <th className="py-3.5 px-4 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                <th className="py-3.5 px-4 text-end">{isRtl ? 'المهارات' : 'Skills'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.map((st) => (
                <tr
                  key={st.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-[#152550]/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono text-slate-500 font-semibold">
                    {st.academicId}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-base">{st.avatar}</span>
                    <span>{st.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    <div>{st.major}</div>
                    <div className="text-[10px] text-[#2499F2] font-semibold">{st.course}</div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-800 dark:text-slate-200 font-medium">
                    {st.projectTitle}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        !st.isFree
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                      }`}
                    >
                      {!st.isFree ? (
                        <>
                          <UserCheck className="w-3 h-3" />
                          <span>{isRtl ? 'ضمن فريق' : 'Assigned'}</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-3 h-3" />
                          <span>{isRtl ? 'متاح للانضمام' : 'Available'}</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-end">
                    <div className="flex flex-wrap gap-1 justify-end">
                      {st.skills.slice(0, 3).map((sk) => (
                        <span
                          key={sk}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0B152E] text-slate-600 dark:text-slate-300 text-[10px] font-mono"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
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
