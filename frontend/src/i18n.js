import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import arTranslation from './locales/ar.json';
import enTranslation from './locales/en.json';

// استرجاع اللغة المحفوظة في التخزين المحلي أو الاعتماد على العربية كافتراضية
const savedLanguage = typeof window !== 'undefined' 
  ? (localStorage.getItem('app_language') || 'ar') 
  : 'ar';

export const updateDocumentDirection = (lang) => {
  if (typeof document === 'undefined') return;
  const isRtl = lang === 'ar';
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  
  if (isRtl) {
    document.documentElement.classList.add('font-arabic');
    document.documentElement.classList.remove('font-english');
  } else {
    document.documentElement.classList.add('font-english');
    document.documentElement.classList.remove('font-arabic');
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: arTranslation },
      en: { translation: enTranslation }
    },
    lng: savedLanguage,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

// تطبيق الاتجاه المبدئي
updateDocumentDirection(savedLanguage);

// الاستماع لأي تغيير في اللغة وتحديث التخزين المحلي والاتجاه
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('app_language', lng);
  }
  updateDocumentDirection(lng);
});

export default i18n;
