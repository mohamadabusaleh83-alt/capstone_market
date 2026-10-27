import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  GraduationCap,
  X,
  Plus,
  Check,
  FileText,
  Globe,
  UploadCloud,
  RefreshCw,
  Trash2,
  Rocket
} from 'lucide-react';

const SUGGESTED_SKILLS = [
  'React',
  'Python',
  'UI/UX',
  'Data Analysis',
  'SQL',
  'FastAPI',
  'Node.js',
  'TailwindCSS',
  'Machine Learning',
  'Flutter'
];

export default function StudentOnboardingModal() {
  const { t } = useTranslation();
  const { currentUser, apiFetch } = useAuth();
  const {
    isRtl,
    isOnboardingModalOpen,
    setIsOnboardingModalOpen,
    userSkills,
    setUserSkills,
    studentCv,
    setStudentCv,
    showToast
  } = useApp();

  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // مزامنة البيانات الأولية عند فتح النافذة
  useEffect(() => {
    if (isOnboardingModalOpen) {
      setBio(studentCv?.bio || '');
      setSkills(Array.isArray(userSkills) && userSkills.length > 0 ? [...userSkills] : []);
      setPortfolioUrl(studentCv?.portfolioUrl || '');
      setSelectedFile(null);
    }
  }, [isOnboardingModalOpen, studentCv, userSkills]);

  if (!isOnboardingModalOpen || currentUser?.role !== 'student') {
    return null;
  }

  const handleAddCustomSkill = (e) => {
    e?.preventDefault();
    const clean = newSkillInput.trim();
    if (!clean) return;
    if (skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setNewSkillInput('');
      return;
    }
    setSkills((prev) => [...prev, clean]);
    setNewSkillInput('');
  };

  const handleToggleSuggestedSkill = (skill) => {
    if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      setSkills((prev) => prev.filter((s) => s.toLowerCase() !== skill.toLowerCase()));
    } else {
      setSkills((prev) => [...prev, skill]);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast(isRtl ? 'يرجى اختيار ملف بصيغة PDF فقط' : 'Please select a PDF file only', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast(isRtl ? 'حجم الملف يجب ألا يتجاوز 5 ميغابايت' : 'File size cannot exceed 5 MB', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('skip_student_onboarding', 'true');
    }
    setIsOnboardingModalOpen(false);
  };

  const handleSaveAndContinue = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalPortfolioUrl = portfolioUrl.trim();

    try {
      // 1. إذا قام الطالب برفع ملف PDF للسيرة الذاتية، نرسله أولاً إلى endpoint الرفع المعتمد
      if (selectedFile && apiFetch) {
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);

          const uploadRes = await apiFetch('/users/me/cv-upload', {
            method: 'POST',
            body: formData
          });

          if (uploadRes && uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.portfolio_url) {
              finalPortfolioUrl = uploadData.portfolio_url;
            }
          }
        } catch (_uploadErr) {
          // في حال فشل الرفع على السيرفر، نستمر في حفظ الرابط والنص
        }
      }

      // 2. تحديث الملف الشخصي على الباك إند
      const payload = {
        bio: bio.trim(),
        skills: skills.join(', '),
        portfolio_url: finalPortfolioUrl
      };

      if (apiFetch) {
        await apiFetch('/users/me/profile', {
          method: 'PUT',
          body: JSON.stringify(payload)
        }).catch(() => {});
      }

      // 3. تحديث بيانات المستخدم في Context المنصة والـ LocalStorage فوراً
      setUserSkills(skills);
      const updatedCv = {
        ...studentCv,
        bio: bio.trim(),
        portfolioUrl: finalPortfolioUrl
      };
      setStudentCv(updatedCv);

      if (typeof window !== 'undefined') {
        const userId = currentUser.id || 'student-1';
        localStorage.setItem(`user_skills_${userId}`, JSON.stringify(skills));
        localStorage.setItem(`student_academic_cv_${userId}`, JSON.stringify(updatedCv));
        sessionStorage.setItem('skip_student_onboarding', 'true');
      }

      // 4. إغلاق النافذة وإظهار إشعار النجاح
      setIsOnboardingModalOpen(false);
      showToast(
        isRtl
          ? 'تم تجهيز ملفك التعريفي بنجاح! أهلاً بك في Capstone Market.'
          : 'Your profile has been set up successfully! Welcome to Capstone Market.',
        'success'
      );
    } catch (_err) {
      showToast(
        isRtl
          ? 'تم حفظ بيانات ملفك التعريفي بنجاح!'
          : 'Profile saved successfully!',
        'success'
      );
      setIsOnboardingModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/30 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-7 relative shadow-2xl animate-in zoom-in-95 duration-200 [scrollbar-width:thin]">
        {/* زر الإغلاق ✕ */}
        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-4 left-4 rtl:left-auto rtl:right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-[#152550] transition cursor-pointer"
          aria-label={t('common.close', 'إغلاق')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* رأس النافذة الترحيبي الجذاب */}
        <div className="text-center space-y-2.5 mb-6 pt-1">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2499F2]/20 to-[#28C8C0]/30 border border-[#2499F2]/40 text-[#2499F2] dark:text-[#28C8C0] shadow-md shadow-[#2499F2]/10 mb-1">
            <Rocket className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
            {isRtl
              ? 'أهلاً بك في Capstone Market! لنجهز ملفك التعريفي في خطوات بسيطة'
              : "Welcome to Capstone Market! Let's set up your profile in simple steps"}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto font-medium">
            {isRtl
              ? 'أكمل نبذتك ومهاراتك لتسهيل انضمامك لأفضل مشاريع التخرج وشراكات الشركات.'
              : 'Complete your bio and technical skills to connect with graduation projects and company opportunities.'}
          </p>
        </div>

        <form onSubmit={handleSaveAndContinue} className="space-y-4 text-xs">
          {/* 1. حقل نبذة عنك (Bio) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
                <span>{isRtl ? 'نبذة عنك (Bio)' : 'Bio & Specialization'}</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                {isRtl ? 'تخصصك وشغفك (سطرين إلى 3 أسطر)' : '2-3 lines'}
              </span>
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={
                isRtl
                  ? 'اكتب نبذة موجزة عن تخصصك، اهتماماتك التقنية وشغفك في مشاريع التخرج...'
                  : 'Write a brief note about your major, technical interests, and passion...'
              }
              className="w-full bg-slate-50 dark:bg-[#152550]/70 border border-slate-300/90 dark:border-[#2499F2]/30 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2] leading-relaxed transition"
            />
          </div>

          {/* 2. حقل المهارات الأساسية (Technical Skills) بنظام الـ Tags واقتراحات سريعة */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? 'المهارات الأساسية (Technical Skills)' : 'Core Technical Skills'}</span>
              </span>
              <span className="text-[10px] text-[#2499F2] dark:text-[#28C8C0] font-bold">
                {skills.length} {isRtl ? 'مهارات مضافة' : 'skills added'}
              </span>
            </label>

            {/* صندوق إدخال المهارات اليدوية */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSkill();
                  }
                }}
                placeholder={isRtl ? 'اكتب مهارة واضغط إضافة (مثل: Docker, Next.js)' : 'Type skill and press Enter'}
                className="flex-1 bg-slate-50 dark:bg-[#152550]/70 border border-slate-300/90 dark:border-[#2499F2]/30 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2]"
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                className="px-3.5 py-2 bg-slate-100 dark:bg-[#152550] hover:bg-slate-200 dark:hover:bg-[#182b5c] text-slate-800 dark:text-slate-100 font-bold rounded-xl border border-slate-300/80 dark:border-[#2499F2]/30 transition cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isRtl ? 'إضافة' : 'Add'}</span>
              </button>
            </div>

            {/* عرض المهارات المختارة حالياً كنظام Tags مع زر حذف ✕ */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 dark:bg-[#0B152E] rounded-2xl border border-slate-200 dark:border-white/10 max-h-28 overflow-y-auto [scrollbar-width:thin]">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#152550] border border-[#2499F2]/30 text-slate-800 dark:text-slate-100 font-semibold text-[11px] shadow-xs group"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 rounded cursor-pointer"
                      title={isRtl ? 'حذف المهارة' : 'Remove skill'}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* اقتراحات أزرار سريعة لإضافتها بنقرة واحدة */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                {isRtl ? 'اقتراحات شائعة (انقر للإضافة الفورية):' : 'Popular suggestions (one-click add):'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SKILLS.map((item) => {
                  const isSelected = skills.some((s) => s.toLowerCase() === item.toLowerCase());
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleToggleSuggestedSkill(item)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                        isSelected
                          ? 'bg-[#2499F2] border-[#2499F2] text-white shadow-xs'
                          : 'bg-white dark:bg-[#152550] border-slate-200 dark:border-[#2499F2]/20 text-slate-700 dark:text-slate-300 hover:border-[#2499F2]/50 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-slate-400" />}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. حقل رابط السيرة الذاتية أو الأعمال أو رفع PDF */}
          <div className="space-y-2 pt-1">
            <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#28C8C0] dark:text-[#77DCC1]" />
                <span>{isRtl ? 'رابط السيرة الذاتية أو الأعمال' : 'Portfolio / CV Link'}</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Portfolio / LinkedIn / GitHub
              </span>
            </label>

            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://linkedin.com/in/... أو https://github.com/..."
              className="w-full bg-slate-50 dark:bg-[#152550]/70 border border-slate-300/90 dark:border-[#2499F2]/30 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2] text-left font-mono"
              dir="ltr"
            />

            {/* خيار رفع ملف PDF للسيرة الذاتية */}
            <div className="pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="onboarding-cv-upload"
              />

              {!selectedFile ? (
                <label
                  htmlFor="onboarding-cv-upload"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-[#2499F2]/30 hover:border-[#2499F2] bg-slate-50/50 dark:bg-[#152550]/30 hover:bg-slate-50 transition cursor-pointer text-slate-600 dark:text-slate-300"
                >
                  <span className="flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-[#2499F2] dark:text-[#28C8C0]" />
                    <span className="font-semibold text-[11px]">
                      {isRtl ? 'أو ارفع ملف السيرة الذاتية (PDF)' : 'Or upload CV file (PDF)'}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Max 5MB</span>
                </label>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-[11px] truncate leading-tight">
                        {selectedFile.name}
                      </p>
                      <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-mono">
                        {(selectedFile.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1 rounded-lg hover:bg-rose-500/10 text-rose-500 transition cursor-pointer"
                    title={isRtl ? 'إلغاء الملف' : 'Remove file'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* أزرار الإجراءات: حفظ ومتابعة + إكمال لاحقاً */}
          <div className="pt-3 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:from-[#1D7BC3] hover:to-[#20aba3] disabled:opacity-60 py-3 rounded-2xl font-bold text-xs text-white transition shadow-md shadow-[#2499F2]/25 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isRtl ? 'جاري الحفظ وتجهيز الملف...' : 'Saving & Setting up...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isRtl ? 'حفظ ومتابعة' : 'Save & Continue'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="w-full py-2 rounded-xl text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#152550]/60 transition cursor-pointer text-center"
            >
              {isRtl ? 'إكمال لاحقاً' : 'Skip for now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}