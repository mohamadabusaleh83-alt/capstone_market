// عنوان الباك إند API: يدعم السيرفر المحلي تلقائياً عند التشغيل على localhost
export const API_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : 'https://capstone-market.onrender.com'
);

export const ACADEMIC_MAJORS = [
  'أنظمة المعلومات الحاسوبية (CIS)',
  'علم الحاسوب (Computer Science)',
  'تقنية المعلومات والاتصالات (IT)',
  'أمن المعلومات والأدلة الرقمية (Cybersecurity)',
  'الوسائط الرقمية وتكنولوجيا الويب',
  'هندسة البرمجيات'
];

export const INITIAL_FALLBACK_PROJECTS = [
  {
    id: 1,
    title: 'نظام إدارة المستودعات ونقاط البيع السحابي (POS)',
    description: 'نظام متكامل لمتجر تجزئة لربط عمليات البيع بالمخزون وإصدار تنبيهات عند نفاد البضائع، مع تقارير أرباح يومية.',
    category: 'أنظمة المعلومات الحاسوبية (CIS)',
    difficulty: 'متوسط',
    hoursPerWeek: 12,
    maxMembers: 4,
    currentMembers: 1,
    status: 'approved',
    required_skills: 'Python, SQL, FastAPI, React',
    skills: ['Python', 'SQL', 'FastAPI', 'React'],
    created_by: 1
  },
  {
    id: 2,
    title: 'لوحة مؤشرات تنبؤية للمبيعات وسلوك المستهلك',
    description: 'بناء داشبورد ذكاء أعمال (BI) لشركة توزيع لتحليل فواتير المبيعات السابقة والتنبؤ بالطلب للمواسم القادمة.',
    category: 'أنظمة المعلومات الحاسوبية (CIS)',
    difficulty: 'متقدم',
    hoursPerWeek: 14,
    maxMembers: 3,
    currentMembers: 0,
    status: 'pending',
    required_skills: 'Python, Power BI, SQL, Machine Learning',
    skills: ['Python', 'Power BI', 'SQL', 'Machine Learning'],
    created_by: 1
  },
  {
    id: 3,
    title: 'بوابة تدقيق الثغرات واكتشاف الاختراقات للمتاجر الإلكترونية',
    description: 'أداة فحص أمني لتقييم حماية بوابات الدفع الإلكتروني وتشفير بيانات بطاقات العملاء في المتاجر المحلية.',
    category: 'أمن المعلومات والأدلة الرقمية (Cybersecurity)',
    difficulty: 'متقدم',
    hoursPerWeek: 15,
    maxMembers: 3,
    currentMembers: 0,
    status: 'approved',
    required_skills: 'Cybersecurity, Python, Docker, Linux',
    skills: ['Cybersecurity', 'Python', 'Docker', 'Linux'],
    created_by: 2
  }
];

// دالة فحص هل الخطأ ناتج عن إلغاء الإشارة أو انقطاع المهلة (AbortError)
export function isAbortError(err) {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : (err.message || '');
  const name = typeof err === 'object' && err?.name ? err.name : '';
  return (
    name === 'AbortError' ||
    msg.toLowerCase().includes('abort') ||
    msg.includes('إيقاف الإشارة') ||
    msg.toLowerCase().includes('signal has been aborted') ||
    msg.toLowerCase().includes('the signal has been aborted')
  );
}

// دالة تحويل رسائل الأخطاء التقنية المزعجة إلى نص عربي واضح وسلس للمستخدم
export function formatFriendlyError(err) {
  if (!err) return 'تعذر الاتصال بالسيرفر، جاري المحاولة...';
  if (isAbortError(err)) {
    return 'تعذر الاتصال بالسيرفر، جاري المحاولة...';
  }
  const msg = typeof err === 'string' ? err : (err.message || '');
  const name = typeof err === 'object' && err?.name ? err.name : '';
  if (
    name === 'TypeError' ||
    msg.toLowerCase().includes('failed to fetch') ||
    msg.toLowerCase().includes('network') ||
    msg.toLowerCase().includes('networkerror') ||
    msg.toLowerCase().includes('load failed')
  ) {
    return 'تعذر الاتصال بالسيرفر، جاري المحاولة...';
  }
  return msg || 'تعذر الاتصال بالسيرفر، جاري المحاولة...';
}

export async function apiFetch(endpoint, options = {}, onUnauthorized = null) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  // إعداد مهلة كافية 10 ثوانٍ على الأقل لحماية الطلبات من الإلغاء المبكر
  let timeoutId = null;
  let signal = options.signal;
  if (!signal) {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 10000);
    signal = controller.signal;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (response.status === 401) {
      if (token && token.startsWith('demo-token-')) {
        return response;
      }
      if (typeof onUnauthorized === 'function') {
        onUnauthorized();
      } else if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('app_user_role');
        window.location.href = '/login';
      }
      throw new Error('انتهت صلاحية جلسة الدخول، يرجى تسجيل الدخول مجدداً.');
    }

    return response;
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);

    if (token && token.startsWith('demo-token-')) {
      return { ok: false, status: 503, json: async () => ({}) };
    }

    if (isAbortError(err)) {
      const friendlyErr = new Error('تعذر الاتصال بالسيرفر، جاري المحاولة...');
      friendlyErr.name = 'AbortError';
      friendlyErr.originalError = err;
      throw friendlyErr;
    }

    throw err;
  }
}
