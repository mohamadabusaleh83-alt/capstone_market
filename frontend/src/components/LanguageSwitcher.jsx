import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ onLanguageChange, className = '' }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'ar';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_language', nextLang);
      document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = nextLang;
      if (nextLang === 'ar') {
        document.documentElement.classList.add('font-arabic');
        document.documentElement.classList.remove('font-english');
      } else {
        document.documentElement.classList.add('font-english');
        document.documentElement.classList.remove('font-arabic');
      }
    }
    if (onLanguageChange) {
      onLanguageChange(nextLang);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-100 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/90 hover:border-cyan-500/60 shadow-sm text-xs font-bold transition-all duration-200 cursor-pointer select-none ${className}`}
      title={currentLang === 'ar' ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
      aria-label={currentLang === 'ar' ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
    >
      <Globe className="w-4 h-4 text-blue-400 shrink-0" />
      {/* على الشاشات الصغيرة رمز مختصر لتفادي التمرير الأفقي */}
      <span className="hidden sm:inline">{currentLang === 'ar' ? 'English' : 'العربية'}</span>
      <span className="sm:hidden">{currentLang === 'ar' ? 'EN' : 'ع'}</span>
    </button>
  );
}
