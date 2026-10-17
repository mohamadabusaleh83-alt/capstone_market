import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ACADEMIC_MAJORS } from '../api/client';
import { FileText, Award, CheckCircle } from 'lucide-react';

export default function StudentCvPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    studentCv,
    setStudentCv,
    saveStudentCv,
    userSkills,
    setShowSkillsModal,
    translateMajor
  } = useApp();

  const [cvUpdateMessage, setCvUpdateMessage] = useState('');

  const handleSaveCv = (e) => {
    e.preventDefault();
    saveStudentCv(studentCv);
    setCvUpdateMessage(t('toasts.cv_saved'));
    setTimeout(() => setCvUpdateMessage(''), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            {t('student_cv.title')}
          </h2>
          <button
            type="button"
            onClick={() => setShowSkillsModal(true)}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
          >
            <Award className="w-4 h-4" /> {t('student_cv.edit_skills')}
          </button>
        </div>

        {cvUpdateMessage && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {cvUpdateMessage}
          </div>
        )}

        <form onSubmit={handleSaveCv} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                {t('student_cv.full_name')}
              </label>
              <input
                type="text"
                disabled
                value={currentUser?.name || ''}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                {t('student_cv.university_email')}
              </label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 cursor-not-allowed text-left font-mono"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                {t('student_cv.major')}
              </label>
              <select
                value={studentCv.major}
                onChange={(e) => setStudentCv({ ...studentCv, major: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {ACADEMIC_MAJORS.map((m, idx) => (
                  <option key={idx} value={m}>
                    {translateMajor(m)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                {t('student_cv.current_course')}
              </label>
              <select
                value={studentCv.course}
                onChange={(e) => setStudentCv({ ...studentCv, course: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="مشروع تخرج 1">{t('student_cv.course_1')}</option>
                <option value="مشروع تخرج 2">{t('student_cv.course_2')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">
              {t('student_cv.portfolio_link')}
            </label>
            <input
              type="url"
              value={studentCv.portfolioUrl}
              onChange={(e) => setStudentCv({ ...studentCv, portfolioUrl: e.target.value })}
              placeholder="https://github.com/username"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 text-left font-mono"
              dir="ltr"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">
              {t('student_cv.bio')}
            </label>
            <textarea
              rows={3}
              value={studentCv.bio}
              onChange={(e) => setStudentCv({ ...studentCv, bio: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-2">
              {t('student_cv.registered_skills')}
            </span>
            <div className="flex flex-wrap gap-2">
              {userSkills.map((sk, idx) => (
                <span
                  key={idx}
                  className="bg-slate-800 text-blue-300 border border-blue-900/50 text-xs px-2.5 py-1 rounded-lg"
                >
                  {sk}
                </span>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-bold text-xs text-white transition shadow-lg cursor-pointer"
          >
            {t('student_cv.save_cv')}
          </button>
        </form>
      </div>
    </div>
  );
}
