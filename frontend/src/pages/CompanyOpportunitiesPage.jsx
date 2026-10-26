import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Briefcase,
  Plus,
  Users,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Send,
  X
} from 'lucide-react';

export default function CompanyOpportunitiesPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { isRtl, showToast } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStipend, setNewStipend] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const defaultDemoOps = [
    {
      id: 1,
      title: isRtl
        ? 'برنامج رعاية مشاريع الذكاء الاصطناعي وهندسة البيانات'
        : 'AI & Data Engineering Capstone Sponsorship Cohort',
      description: isRtl
        ? 'تمويل كامل لتكاليف السيرفرات السحابية ونماذج OpenAI لفرق التخرج في هندسة النظم، مع مكافأة شهرية.'
        : 'Full cloud server coverage and monthly stipends for graduating AI & data engineering teams.',
      stipend: '1,500$ + بيئة سحابية',
      status: 'active',
      applicantsCount: 6,
      viewsCount: 142,
      createdDate: '2026-10-10'
    },
    {
      id: 2,
      title: isRtl
        ? 'فرصة تدريب وتوظيف لمطوري واجهات React و Tailwind'
        : 'React & Front-End Graduate Internship Track',
      description: isRtl
        ? 'انضمام طالبين للعمل مع الفريق الهندسي في الشركة خلال الفصل الأخير من مشروع التخرج.'
        : 'Internship placement for two students to collaborate with our enterprise engineering team.',
      stipend: 'مكافأة تدريب شهرية 400$',
      status: 'active',
      applicantsCount: 9,
      viewsCount: 210,
      createdDate: '2026-10-12'
    }
  ];

  const [opportunities, setOpportunities] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const user = localStorage.getItem('app_user_role');
      const userId = user ? JSON.parse(user).id : 'guest';
      const saved = localStorage.getItem(`company_opportunities_${userId}`);
      if (saved) return JSON.parse(saved);
      return userId === 'company-1' ? defaultDemoOps : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      const saved = localStorage.getItem(`company_opportunities_${currentUser.id}`);
      if (saved) {
        setOpportunities(JSON.parse(saved));
      } else if (currentUser.id === 'company-1') {
        setOpportunities(defaultDemoOps);
      } else {
        setOpportunities([]);
      }
    } catch {
      setOpportunities([]);
    }
  }, [currentUser?.id]);

  const handleCreateOpportunity = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newOp = {
      id: Date.now(),
      title: newTitle,
      description: newDescription,
      stipend: newStipend || 'مكافأة ورعاية مميزة',
      status: 'active',
      applicantsCount: 0,
      viewsCount: 1,
      createdDate: new Date().toISOString().split('T')[0]
    };

    const updated = [newOp, ...opportunities];
    setOpportunities(updated);
    if (currentUser?.id && typeof window !== 'undefined') {
      localStorage.setItem(`company_opportunities_${currentUser.id}`, JSON.stringify(updated));
    }
    setIsModalOpen(false);
    setNewTitle('');
    setNewStipend('');
    setNewDescription('');
    showToast(isRtl ? 'تم نشر الفرصة الجديدة بنجاح!' : 'New opportunity published successfully!', 'success');
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
              {isRtl ? 'فرص الشركة المنشورة' : 'Posted Opportunities'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-[#2499F2]" />
            <span>{isRtl ? 'فرص الرعاية والتدريب المنشورة من قبل الشركة' : 'Company Published Opportunities'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'إدارة العروض الموجهة للطلبة، متابعة أعداد المتقدمين، وتعيين حزم الرعاية والتمويل.'
              : 'Manage student-facing sponsorship packages, monitor applicants, and track talent pipelines.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:opacity-95 text-[#101E42] font-black text-xs shadow-md shadow-[#2499F2]/20 transition cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-[#101E42]" />
          <span>{isRtl ? '+ نشر فرصة رعاية / تدريب جديدة' : '+ Post New Opportunity'}</span>
        </button>
      </div>

      {/* بطاقات الفرص المنشورة أو الحالة الفارغة المنظمة */}
      {opportunities.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-8 shadow-sm max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#2499F2]/10 border border-[#2499F2]/20 text-[#2499F2] flex items-center justify-center mx-auto shadow-inner">
            <Briefcase className="w-8 h-8 text-[#28C8C0]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {isRtl ? 'لا توجد فرص أو برامج رعاية منشورة حالياً' : 'No Published Opportunities Yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {isRtl
                ? 'اطرح الآن أول فرصة تدريب أو رعاية تكنولوجية لجذب أفضل الكفاءات الطلابية وفرق التخرج الواعدة إلى شركتكم.'
                : 'Publish your first sponsorship track or internship cohort to attract top university talent.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] font-black text-xs shadow-md transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#101E42]" />
            <span>{isRtl ? '+ نشر أول فرصة لشركتك الآن' : '+ Post First Opportunity'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {opportunities.map((op) => (
          <div
            key={op.id}
            className="p-6 rounded-3xl bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#28C8C0]/40 transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'نشطة ومتاحة للتقديم' : 'Active'}</span>
                </span>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{op.viewsCount} مشاهدة</span>
                  </span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {op.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {op.description}
              </p>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B152E] border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#28C8C0]" />
                  <span>{op.stipend}</span>
                </span>
                <span className="text-xs text-[#2499F2] font-bold">
                  {op.applicantsCount} متقدمين
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                {isRtl ? 'تاريخ النشر:' : 'Posted:'} {op.createdDate}
              </span>

              <Link
                to="/collaboration-requests"
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#0B152E] hover:bg-[#2499F2]/15 text-slate-800 dark:text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-[#2499F2]" />
                <span>{isRtl ? 'استعراض المتقدمين' : 'View Applicants'}</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* نافذة منبثقة لنشر فرصة جديدة */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/30 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#28C8C0]" />
                <span>{isRtl ? 'نشر فرصة رعاية / تدريب جديدة' : 'Post New Opportunity'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOpportunity} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                  {isRtl ? 'عنوان الفرصة' : 'Opportunity Title'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isRtl ? 'مثال: رعاية كاملة لمشاريع النظم السحابية...' : 'e.g., Cloud Systems Full Sponsorship...'}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2]"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                  {isRtl ? 'المكافأة أو حزمة الدعم' : 'Stipend / Support Package'}
                </label>
                <input
                  type="text"
                  placeholder={isRtl ? 'مثال: مكافأة شهرية 500$ + تغطية خوادم AWS' : 'e.g., $500 monthly stipend + AWS credits'}
                  value={newStipend}
                  onChange={(e) => setNewStipend(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2]"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                  {isRtl ? 'تفاصيل الفرصة والشروط' : 'Description & Eligibility'}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={isRtl ? 'وضح المهارات المطلوبة، نطاق الرعاية، وفرص التوظيف المتاحة...' : 'Describe technical requirements, mentorship scope, and employment potential...'}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] font-black text-xs shadow-md transition cursor-pointer active:scale-95"
              >
                {isRtl ? 'تأكيد ونشر الفرصة فوراً' : 'Confirm & Publish'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
