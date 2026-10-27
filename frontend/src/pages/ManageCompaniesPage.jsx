import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../api/client';
import {
  Building2,
  Search,
  CheckCircle2,
  ChevronRight,
  Plus
} from 'lucide-react';

export default function ManageCompaniesPage() {
  const { t } = useTranslation();
  const { isRtl, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [companiesList, setCompaniesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiFetch('/users/?role=company')
      .then((res) => (res && res.ok ? res.json() : []))
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setCompaniesList(
            data.map((c) => ({
              id: c.id,
              name: c.full_name,
              industry: c.bio || (isRtl ? 'حلول برمجية وتكنولوجيا' : 'Software & Tech Solutions'),
              contactPerson: c.full_name,
              email: c.email,
              phone: '+970 599 000 000',
              opportunitiesCount: 1,
              sponsoredProjectsCount: 1,
              status: 'accredited',
              accreditationDate: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : '—'
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [isRtl]);

  const filtered = companiesList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchTerm.toLowerCase())
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
              {isRtl ? 'إدارة الشركات والشركاء' : 'Manage Companies'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#2499F2]" />
            <span>{isRtl ? 'سجل الشركات والشركاء الصناعيين المعتمدين' : 'Accredited Industry Partners Registry'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'متابعة الشركات الراعية لمشاريع التخرج، الفرص المنشورة، ومسؤولي التنسيق الأكاديمي.'
              : 'Oversee registered enterprise partners, sponsorship quotas, and academic liaisons.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            showToast(isRtl ? 'سيتم فتح نموذج اعتماد شركة جديدة' : 'Opening company accreditation form', 'info')
          }
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] font-black text-xs shadow-md shadow-[#2499F2]/20 transition cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-[#101E42]" />
          <span>{isRtl ? 'اعتماد شركة جديدة' : 'Accredit New Company'}</span>
        </button>
      </div>

      {/* البحث السريع */}
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-2xl p-3 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder={isRtl ? 'ابحث باسم الشركة أو مجال النشاط...' : 'Search by company or industry...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] ps-9"
          />
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5 pointer-events-none" />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          {companiesList.length} {isRtl ? 'شركات معتمدة' : 'Accredited Partners'}
        </div>
      </div>

      {/* جدول الشركات */}
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs min-w-[640px]">
            <thead className="bg-slate-50 dark:bg-[#0B152E] text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'اسم الشركة / المؤسسة' : 'Company Name'}</th>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'مجال النشاط والقطاع' : 'Industry Domain'}</th>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'مسؤول التواصل' : 'Contact Liaison'}</th>
                <th className="py-3.5 px-4 text-center">{isRtl ? 'الفرص' : 'Offers'}</th>
                <th className="py-3.5 px-4 text-center">{isRtl ? 'المشاريع المرعية' : 'Sponsored Projects'}</th>
                <th className="py-3.5 px-4 text-center">{isRtl ? 'حالة الاعتماد' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.map((company) => (
                <tr
                  key={company.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-[#152550]/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#2499F2]" />
                    <span>{company.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {company.industry}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200">
                    <div className="font-semibold">{company.contactPerson}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{company.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-[#2499F2]">
                    {company.opportunitiesCount}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {company.sponsoredProjectsCount}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isRtl ? 'معتمد أكاديمياً' : 'Accredited'}</span>
                    </span>
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
