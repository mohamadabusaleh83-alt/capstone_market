// عنوان الباك إند API من VITE_API_URL. بدونه: السيرفر المحلي على localhost، وخادم الإنتاج فقط للنطاق
// الإنتاجي نفسه - أي نشر تجريبي/معاينة بلا VITE_API_URL لا يتصل بالإنتاج بصمت (I-46)
const PRODUCTION_HOST = 'capstone-market.vercel.app';
function resolveApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'http://127.0.0.1:8000';
  if (host === PRODUCTION_HOST) return 'https://capstone-market.onrender.com';
  console.error('VITE_API_URL is not set for this deployment; API calls are disabled.');
  return 'http://invalid.localhost';
}
const rawApiUrl = resolveApiUrl();
export const API_URL = rawApiUrl.replace(/\/+$/, '');

export const ACADEMIC_MAJORS = [
  'أنظمة المعلومات الحاسوبية (CIS)',
  'علم الحاسوب (Computer Science)',
  'تقنية المعلومات والاتصالات (IT)',
  'أمن المعلومات والأدلة الرقمية (Cybersecurity)',
  'الوسائط الرقمية وتكنولوجيا الويب',
  'هندسة البرمجيات'
];

export const INITIAL_FALLBACK_PROJECTS = [];

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
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  // إعداد مهلة كافية تدعم استيقاظ خادم Render عند الإقلاع البارد (Cold Start)
  let timeoutId = null;
  let signal = options.signal;
  if (!signal) {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 45000);
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

    if (isAbortError(err)) {
      const friendlyErr = new Error('تعذر الاتصال بالسيرفر، جاري المحاولة...');
      friendlyErr.name = 'AbortError';
      friendlyErr.originalError = err;
      throw friendlyErr;
    }

    throw err;
  }
}
