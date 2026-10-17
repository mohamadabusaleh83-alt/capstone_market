import { Link } from 'react-router-dom';
import { FileQuestion, ArrowRight, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function NotFoundPage() {
  const { isRtl } = useApp();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 shadow-xl">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-white">404 - {isRtl ? 'الصفحة غير موجودة' : 'Page Not Found'}</h1>
      <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
        {isRtl
          ? 'عذراً، الرابط الذي تحاول الوصول إليه غير موجود أو تم نقله.'
          : 'Sorry, the page you are looking for does not exist or has been moved.'}
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/20"
      >
        <span>{isRtl ? 'العودة للمشاريع الرئيسية' : 'Return to Projects'}</span>
        {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
      </Link>
    </div>
  );
}
