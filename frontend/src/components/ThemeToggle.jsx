import { useTranslation } from 'react-i18next';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 shadow-sm transition-all duration-200 hover:rotate-12 cursor-pointer active:scale-95 flex items-center justify-center select-none ${className}`}
      title={isDark ? t('common.switch_light') : t('common.switch_dark')}
      aria-label={isDark ? t('common.switch_light') : t('common.switch_dark')}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20 group-hover:scale-110 transition-transform duration-200" />
      ) : (
        <Moon className="w-4 h-4 text-blue-500 fill-blue-500/20 group-hover:scale-110 transition-transform duration-200" />
      )}
    </button>
  );
}
