export const STANDARDIZED_IT_MAJORS = [
  {
    key: 'cse',
    en: 'Computer Systems Engineering',
    ar: 'هندسة أنظمة الحاسوب',
    aliases: ['computer systems engineering', 'هندسة أنظمة الحاسوب', 'أنظمة الحاسوب', 'computer systems']
  },
  {
    key: 'cs',
    en: 'Computer Science',
    ar: 'علم الحاسوب',
    aliases: ['computer science', 'علم الحاسوب', 'علوم الحاسوب', 'cs']
  },
  {
    key: 'se',
    en: 'Software Engineering',
    ar: 'هندسة البرمجيات',
    aliases: ['software engineering', 'هندسة البرمجيات', 'se']
  },
  {
    key: 'cis_mis',
    en: 'Computer Information Systems / MIS',
    ar: 'نظم المعلومات الحاسوبية / الإدارية',
    aliases: [
      'computer information systems / mis',
      'نظم المعلومات الحاسوبية / الإدارية',
      'نظم المعلومات الحاسوبية',
      'أنظمة المعلومات الحاسوبية',
      'cis',
      'mis',
      'أنظمة المعلومات الحاسوبية (cis)'
    ]
  },
  {
    key: 'cybersecurity',
    en: 'Cybersecurity',
    ar: 'الأمن السيبراني',
    aliases: [
      'cybersecurity',
      'الأمن السيبراني',
      'أمن المعلومات',
      'أمن المعلومات والأدلة الرقمية (cybersecurity)'
    ]
  },
  {
    key: 'ai_ds',
    en: 'Artificial Intelligence & Data Science',
    ar: 'الذكاء الاصطناعي وعلم البيانات',
    aliases: [
      'artificial intelligence & data science',
      'الذكاء الاصطناعي وعلم البيانات',
      'ai & data science',
      'ai',
      'data science',
      'الذكاء الاصطناعي',
      'علم البيانات'
    ]
  },
  {
    key: 'networks_telecom',
    en: 'Networks & Telecommunications',
    ar: 'شبكات الحاسوب والاتصالات',
    aliases: [
      'networks & telecommunications',
      'شبكات الحاسوب والاتصالات',
      'شبكات الحاسوب',
      'اتصالات',
      'تقنية المعلومات والاتصالات (it)'
    ]
  }
];

export const OTHER_MAJOR_KEY = 'other';

/**
 * Returns the matched major object if the string matches any standard IT major,
 * or null if it's custom.
 */
export function matchStandardMajor(majorStr) {
  if (!majorStr || typeof majorStr !== 'string') return null;
  const s = majorStr.trim().toLowerCase();
  for (const item of STANDARDIZED_IT_MAJORS) {
    if (item.en.toLowerCase() === s || item.ar.toLowerCase() === s) return item;
    for (const alias of item.aliases) {
      if (s === alias.toLowerCase() || s.includes(alias.toLowerCase())) return item;
    }
  }
  return null;
}
