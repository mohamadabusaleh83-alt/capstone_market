import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  CheckCircle2,
  CheckCircle,
  Users,
  Save,
  X,
  Edit2,
  Trash2
} from 'lucide-react';

export default function TeamsHubPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    studentsList,
    setStudentsList,
    rawProjects,
    applications,
    showToast,
    setShowApplicationsModal,
    translateMajor,
    isRtl
  } = useApp();

  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [editProjectTitle, setEditProjectTitle] = useState('');
  const [editStatusValue, setEditStatusValue] = useState(false);

  const pendingProjectsCount = rawProjects.filter((p) => p.status === 'pending').length;

  if (currentUser?.role === 'supervisor') {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm dark:shadow-[0_4px_25px_-5px_rgba(16,30,66,0.6)]">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-500 dark:text-amber-400" />
              {t('supervisor.teams_management_title')}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {t('supervisor.teams_management_desc')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/approvals"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('supervisor.approve_projects_btn', { count: pendingProjectsCount })}
            </Link>

            <button
              type="button"
              onClick={() => setShowApplicationsModal(true)}
              className="bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:from-[#1D7BC3] hover:to-[#20aba3] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-[#2499F2]/25 active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              {t('supervisor.student_applications_btn', { count: applications.length })}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-2xl overflow-hidden shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)]">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs min-w-[640px]">
            <thead className="bg-slate-50 dark:bg-[#152550] border-b border-slate-200 dark:border-[#2499F2]/20 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="p-3.5 text-start">{t('supervisor.table_academic_id')}</th>
                <th className="p-3.5 text-start">{t('supervisor.table_student_name')}</th>
                <th className="p-3.5 text-start">{t('supervisor.table_course')}</th>
                <th className="p-3.5 text-start">{t('supervisor.table_project_status')}</th>
                <th className="p-3.5 text-start">{t('supervisor.table_supervisor_notes')}</th>
                <th className="p-3.5 text-center">{t('supervisor.table_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {studentsList.map((st) => {
                const isEditing = editingStudentId === st.id;
                return (
                  <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400">{st.academicId}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{st.avatar}</span>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{st.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {translateMajor(st.major)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">{st.course}</td>
                    <td className="p-3.5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editProjectTitle}
                          onChange={(e) => setEditProjectTitle(e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-white w-full"
                        />
                      ) : (
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                            st.isFree
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                          }`}
                        >
                          {st.projectTitle}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-white w-full"
                        />
                      ) : (
                        st.supervisorNote || (
                          <span className="text-slate-400 dark:text-slate-500 italic">{t('supervisor.no_notes')}</span>
                        )
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setStudentsList((prev) =>
                                prev.map((s) =>
                                  s.id === st.id
                                    ? {
                                        ...s,
                                        supervisorNote: editNoteText,
                                        projectTitle: editProjectTitle,
                                        isFree: editStatusValue
                                      }
                                    : s
                                )
                              );
                              setEditingStudentId(null);
                            }}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStudentId(null)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStudentId(st.id);
                              setEditNoteText(st.supervisorNote);
                              setEditProjectTitle(st.projectTitle);
                              setEditStatusValue(st.isFree);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-cyan-600 dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  isRtl
                                    ? `استبعاد الطالب "${st.name}" من الكشف؟`
                                    : `Remove student "${st.name}"?`
                                )
                              ) {
                                setStudentsList((prev) => prev.filter((s) => s.id !== st.id));
                              }
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-rose-600 dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-700 dark:text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    );
  }

  // ملتقى تشكيل الفرق للطلاب والزوار
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm dark:shadow-[0_4px_25px_-5px_rgba(16,30,66,0.6)]">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#28C8C0] dark:text-[#77DCC1]" />
            {t('teams_hub.title')}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            {t('teams_hub.desc')}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-[#152550] px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2499F2]/20 text-xs text-slate-700 dark:text-slate-300">
          {t('teams_hub.ready_students')}{' '}
          <span className="font-bold text-[#28C8C0] dark:text-[#77DCC1]">
            {t('teams_hub.ready_count', {
              count: studentsList.filter((s) => s.isFree).length
            })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {studentsList.map((student) => (
          <div
            key={student.id}
            className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-2xl p-5 flex flex-col justify-between hover:border-[#2499F2]/40 transition shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(16,30,66,0.6)]"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">{student.avatar}</span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{student.name}</h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{student.role}</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                    student.isFree
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  {student.isFree ? t('teams_hub.free_student') : t('teams_hub.in_team')}
                </span>
              </div>

              <div className="mb-3">
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded inline-block">
                  {translateMajor(student.major)}
                </span>
              </div>

              <div className="space-y-1 mb-4">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                  {t('teams_hub.skills_label')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {student.skills.map((sk, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!student.isFree}
              onClick={() => showToast(t('toasts.invite_sent', { name: student.name }), 'success')}
              className={`w-full py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                student.isFree
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 active:scale-95'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {student.isFree
                ? t('teams_hub.invite_to_team')
                : t('teams_hub.assigned_to_project')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
