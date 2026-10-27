import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import {
  Briefcase,
  Building2,
  Sparkles,
  ChevronRight,
  Send,
  Search
} from 'lucide-react';

export default function OpportunitiesPage() {
  const { t } = useTranslation();
  const { rawProjects, applyToProject, isRtl, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('all');

  // استخراج الفرص والتحديات الحقيقية من المشاريع المسجلة بالمنصة
  const opportunitiesList = useMemo(() => {
    return (rawProjects || []).map((p) => {
      const skillsArr = Array.isArray(p.skills) && p.skills.length > 0
        ? p.skills
        : (typeof p.required_skills === 'string' && p.required_skills
          ? p.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
          : []);

      return {
        id: p.id,
        company: p.company_name || '—',
        title: p.title,
        description: p.description,
        stipend: p.stipend || '—',
        track: p.category || 'CIS / CS',
        skills: skillsArr,
        slots: `${p.availableSeats !== undefined ? p.availableSeats : (p.available_seats ?? '—')} ${isRtl ? 'مقاعد شاغرة' : 'open seats'}`
      };
    });
  }, [rawProjects, isRtl]);

  const handleApplyOpportunity = async (companyOrOp, title) => {
    try {
      const isObj = typeof companyOrOp === 'object' && companyOrOp !== null;
      const opTitle = isObj ? companyOrOp.title : title;
      const opId = isObj ? companyOrOp.id : rawProjects.find((p) => p.title === opTitle)?.id;
      if (applyToProject) {
        await applyToProject({
          projectId: opId,
          role: isRtl ? 'طالب خريج ومطور' : 'Graduate Student Developer',
          message: isRtl ? `التقديم على فرصة رعاية وتدريب: ${opTitle}` : `Application for sponsorship: ${opTitle}`
        });
      } else {
        showToast(
          isRtl
            ? `تم تقديم طلبك بنجاح لفرصة (${opTitle})!`
            : `Your application has been submitted to ${opTitle}!`,
          'success'
        );
      }
    } catch {
      // Ignored
    }
  };

  const filtered = opportunitiesList.filter((op) => {
    const matchesSearch =
      op.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    if (selectedTrack === 'all') return matchesSearch;
    return matchesSearch && op.track.toLowerCase().includes(selectedTrack.toLowerCase());
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
              {isRtl ? 'فرص الشركات والرعاية' : 'Company Opportunities'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-[#2499F2]" />
            <span>{isRtl ? 'فرص الشركات والرعاية والتدريب الأكاديمي' : 'Company Sponsorships & Career Opportunities'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'استكشف عروض الرعاية المالية والتقنية لمشاريع التخرج، وبرامج التدريب المؤهلة للتوظيف.'
              : 'Explore financial sponsorships, tech grants, and pre-graduation employment pipelines.'}
          </p>
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={isRtl ? 'ابحث بالشركة، المهارات أو عنوان الفرصة...' : 'Search by company, tech, or title...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] ps-9"
          />
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex gap-2">
          {['all', 'AI', 'IoT', 'Security'].map((track) => (
            <button
              key={track}
              type="button"
              onClick={() => setSelectedTrack(track)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedTrack === track
                  ? 'bg-[#2499F2] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-[#0B152E] text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {track === 'all' ? (isRtl ? 'الكل' : 'All') : track}
            </button>
          ))}
        </div>
      </div>

      {/* بطاقات الفرص */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((op) => (
          <div
            key={op.id}
            className="p-5 rounded-3xl bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#28C8C0]/40 transition group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#2499F2] dark:text-[#77DCC1] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{op.company}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  {op.slots}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#2499F2] transition-colors">
                {op.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {op.description}
              </p>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B152E] border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#28C8C0]" />
                <span>{op.stipend}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {op.skills.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-md bg-[#2499F2]/10 text-[#2499F2] dark:text-[#77DCC1] text-[10px] font-mono font-semibold"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">

              <button
                type="button"
                onClick={() => handleApplyOpportunity(op.company, op.title)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] font-black text-xs shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isRtl ? 'تقديم الآن' : 'Apply Now'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
