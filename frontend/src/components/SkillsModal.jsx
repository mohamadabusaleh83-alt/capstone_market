import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { Award, X } from 'lucide-react';

export default function SkillsModal() {
  const { t } = useTranslation();
  const { showSkillsModal, setShowSkillsModal, userSkills, addSkill, removeSkill } = useApp();
  const [newSkillInput, setNewSkillInput] = useState('');

  if (!showSkillsModal) return null;

  const handleAdd = () => {
    if (newSkillInput.trim()) {
      addSkill(newSkillInput.trim());
      setNewSkillInput('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={() => setShowSkillsModal(false)}
          className="absolute end-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer transition"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          {t('skills_modal.title')}
        </h2>
        <div className="flex gap-2 my-4">
          <input
            type="text"
            placeholder={t('skills_modal.placeholder')}
            value={newSkillInput}
            onChange={(e) => setNewSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95 transition"
          >
            {t('skills_modal.add_btn')}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
          {userSkills.map((sk, idx) => (
            <span
              key={idx}
              className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-200 shadow-sm"
            >
              {sk}
              <button
                type="button"
                onClick={() => removeSkill(sk)}
                className="text-slate-400 hover:text-rose-500 cursor-pointer transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
