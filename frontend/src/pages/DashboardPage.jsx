import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Store,
  PlusCircle,
  RefreshCw,
  Users,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  FileText
} from 'lucide-react';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    rawProjects,
    fetchProjects,
    applications,
    setIsCreateModalOpen,
    setShowApplicationsModal,
    setActiveChatProject,
    translateMajor,
    reportsTimeline
  } = useApp();

  if (!currentUser) return null;

  // المشاريع التي تخص الشركة الحالية
  const myCompanyProjects = rawProjects.filter(
    (p) => p.created_by === currentUser.id || currentUser.role === 'company'
  );

  const pendingApprovalsCount = rawProjects.filter((p) => p.status === 'pending').length;
  const myApplications = applications.filter((a) => a.student_id === currentUser.id);

  // عرض خاص بالشركة
  if (currentUser.role === 'company') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border border-blue-800/50 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-400" />
              {t('company.dashboard_title', { name: currentUser.name })}
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 max-w-xl leading-relaxed">
              {t('company.dashboard_desc')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            {t('company.post_project_btn')}
          </button>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base text-white">
              {t('company.my_projects_title', { count: myCompanyProjects.length })}
            </h3>
            <button
              type="button"
              onClick={fetchProjects}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {t('company.refresh_list')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {myCompanyProjects.map((p) => {
              const projectApps = applications.filter((a) => a.project_id === p.id);
              return (
                <div
                  key={p.id}
                  className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-md">
                        {translateMajor(p.category)}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          p.status === 'approved'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                            : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                        }`}
                      >
                        {p.status === 'approved'
                          ? t('company.status_approved')
                          : t('company.status_pending')}
                      </span>
                    </div>
                    <h4 className="font-bold text-base text-white mb-2">{p.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-3 mb-3">{p.description}</p>

                    <div className="text-xs text-slate-400 mb-2">
                      {t('company.capacity')}{' '}
                      <strong className="text-white">
                        {t('company.seats_reserved', {
                          current: p.currentMembers,
                          max: p.maxMembers
                        })}
                      </strong>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mb-4">
                      <div
                        className={`h-full rounded-full ${
                          p.currentMembers >= p.maxMembers ? 'bg-rose-500' : 'bg-blue-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            ((p.currentMembers || 0) / (p.maxMembers || 4)) * 100
                          )}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setShowApplicationsModal(true)}
                      className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      {t('company.applicants_requests', {
                        count: projectApps.length
                      })}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveChatProject(p)}
                      className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      {t('company.project_chat')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // عرض خاص بالمشرف
  if (currentUser.role === 'supervisor') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 border border-amber-800/40 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              لوحة تحكم المشرف الأكاديمي ({currentUser.name})
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 max-w-xl leading-relaxed">
              إدارة واعتماد مشاريع التخرج، ومتابعة شُعب الطلاب، وتسليمات التقارير الأسبوعية.
            </p>
          </div>
          <Link
            to="/approvals"
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>مراجعة المشاريع المعلقة ({pendingApprovalsCount})</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/approvals"
            className="p-5 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">المشاريع بانتظار الاعتماد</span>
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white group-hover:text-amber-400 transition">
              {pendingApprovalsCount}
            </div>
          </Link>

          <Link
            to="/reports"
            className="p-5 bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">مراحل التقارير</span>
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white group-hover:text-blue-400 transition">
              {reportsTimeline.length} مراحل
            </div>
          </Link>

          <Link
            to="/teams"
            className="p-5 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">شعبة التخرج 1</span>
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white group-hover:text-emerald-400 transition">
              إدارة الفرق
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // عرض خاص بالطالب
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-800/40 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            مرحباً بك، {currentUser.name}
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 max-w-xl leading-relaxed">
            متابعة حالة طلبات الانضمام، مواعيد تسليم التقارير، والوصول السريع لملتقى الفرق والمشاريع.
          </p>
        </div>
        <Link
          to="/cv"
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>تحديث السيرة الذاتية (CV)</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-sm">طلبات الانضمام المقدمة</h3>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-blue-400">
              {myApplications.length}
            </span>
          </div>
          {myApplications.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">لم تقدم طلبات انضمام بعد.</p>
          ) : (
            <div className="space-y-2">
              {myApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-3 bg-slate-800/60 rounded-xl flex items-center justify-between text-xs"
                >
                  <span className="text-slate-300 font-medium">طلب #{app.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      app.status === 'accepted'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : app.status === 'rejected'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm">المرحلة القادمة لتسليم التقارير</h3>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs text-slate-300 font-medium">
              {reportsTimeline[0]?.title}
            </p>
            <p className="text-[11px] text-amber-400 mt-1">
              الموعد النهائي: {reportsTimeline[0]?.deadlineDay} ({reportsTimeline[0]?.deadlineDate})
            </p>
          </div>
          <Link
            to="/reports"
            className="mt-4 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold"
          >
            <span>استعراض كافة التسليمات والملاحظات</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
