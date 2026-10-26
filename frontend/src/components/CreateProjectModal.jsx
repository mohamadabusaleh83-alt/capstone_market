import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { PlusCircle, RefreshCw, X } from 'lucide-react';

export default function CreateProjectModal() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { isCreateModalOpen, setIsCreateModalOpen, isSubmittingProject, createProject } = useApp();

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [skills, setSkills] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);

  if (!isCreateModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createProject({
        title,
        description: desc,
        required_skills: skills,
        max_members: maxMembers
      });
      setTitle('');
      setDesc('');
      setSkills('');
      setMaxMembers(4);
    } catch {
      // Error handled in AppContext
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/25 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(false)}
          className="absolute end-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-[#2499F2] dark:text-[#28C8C0]" />
          {t('create_project.modal_title')}
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
          {t('create_project.modal_desc', { id: currentUser?.id })}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] text-slate-700 dark:text-slate-300 block mb-1 font-medium">
              {t('create_project.title_label')}
            </label>
            <input
              type="text"
              placeholder={t('create_project.title_placeholder')}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#152550] border border-slate-300 dark:border-[#2499F2]/20 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2]"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-700 dark:text-slate-300 block mb-1 font-medium">
              {t('create_project.desc_label')}
            </label>
            <textarea
              placeholder={t('create_project.desc_placeholder')}
              rows={3}
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#152550] border border-slate-300 dark:border-[#2499F2]/20 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-700 dark:text-slate-300 block mb-1 font-medium">
                {t('create_project.skills_label')}
              </label>
              <input
                type="text"
                placeholder={t('create_project.skills_placeholder')}
                required
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#152550] border border-slate-300 dark:border-[#2499F2]/20 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2]"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-700 dark:text-slate-300 block mb-1 font-medium">
                {t('create_project.max_members_label')}
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#152550] border border-slate-300 dark:border-[#2499F2]/20 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmittingProject}
            className="w-full bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:from-[#1D7BC3] hover:to-[#20aba3] py-2.5 rounded-xl font-bold text-xs text-white transition cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-md shadow-[#2499F2]/25 active:scale-95"
          >
            {isSubmittingProject ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t('create_project.saving')}
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                {t('create_project.submit_btn')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
