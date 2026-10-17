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
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              {t('supervisor.teams_management_title')}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {t('supervisor.teams_management_desc')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/approvals"
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('supervisor.approve_projects_btn', { count: pendingProjectsCount })}
            </Link>

            <button
              type="button"
              onClick={() => setShowApplicationsModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <CheckCircle className="w-4 h-4" />
              {t('supervisor.student_applications_btn', { count: applications.length })}
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="p-3.5 text-start">{t('supervisor.table_academic_id')}</th>
                <th className="p-3.5 text-start">{t('supervisor.table_student_name')}</th>
                <th className="p-3.5 text-start">{t('supervisor.table_course')}</th>
                <th className="p-3.5 text-start">{t('supervisor.table_project_status')}</th>
                <th className="p-3.5 text-start">{t('supervisor.table_supervisor_notes')}</th>
                <th className="p-3.5 text-center">{t('supervisor.table_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {studentsList.map((st) => {
                const isEditing = editingStudentId === st.id;
                return (
                  <tr key={st.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3.5 font-mono text-slate-400">{st.academicId}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{st.avatar}</span>
                        <div>
                          <span className="font-bold text-white block">{st.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {translateMajor(st.major)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-300">{st.course}</td>
                    <td className="p-3.5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editProjectTitle}
                          onChange={(e) => setEditProjectTitle(e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white w-full"
                        />
                      ) : (
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                            st.isFree
                              ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                              : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                          }`}
                        >
                          {st.projectTitle}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white w-full"
                        />
                      ) : (
                        st.supervisorNote || (
                          <span className="text-slate-500 italic">{t('supervisor.no_notes')}</span>
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
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
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
                            className="p-1.5 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
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
                            className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
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
    );
  }

  // ملتقى تشكيل الفرق للطلاب والزوار
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            {t('teams_hub.title')}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            {t('teams_hub.desc')}
          </p>
        </div>
        <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
          {t('teams_hub.ready_students')}{' '}
          <span className="font-bold text-emerald-400">
            {t('teams_hub.ready_count', {
              count: studentsList.filter((s) => s.isFree).length
            })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {studentsList.map((student) => (
          <div
            key={student.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-1.5 bg-slate-800 rounded-xl">{student.avatar}</span>
                  <div>
                    <h3 className="font-bold text-sm text-white">{student.name}</h3>
                    <span className="text-[11px] text-slate-400">{student.role}</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                    student.isFree
                      ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {student.isFree ? t('teams_hub.free_student') : t('teams_hub.in_team')}
                </span>
              </div>

              <div className="mb-3">
                <span className="text-[10px] bg-blue-950/60 text-blue-300 border border-blue-800/40 px-2 py-0.5 rounded inline-block">
                  {translateMajor(student.major)}
                </span>
              </div>

              <div className="space-y-1 mb-4">
                <span className="text-[10px] text-slate-400 block">
                  {t('teams_hub.skills_label')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {student.skills.map((sk, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
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
              className={`w-full py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                student.isFree
                  ? 'bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700'
                  : 'bg-slate-950 text-slate-600 cursor-not-allowed border border-slate-900'
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
