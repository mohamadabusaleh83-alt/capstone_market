import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  User,
  Save,
  Plus,
  X,
  Sparkles,
  ChevronRight,
  FileText
} from 'lucide-react';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { currentUser, apiFetch } = useAuth();
  const { isRtl, userSkills, setUserSkills, showToast, getRoleLabel, setIsOnboardingModalOpen } = useApp();

  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [email] = useState(currentUser?.email || '');
  // كل الحقول فارغة افتراضياً وتُملأ من /users/me/profile فقط (لا بيانات مختلقة)
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [bio, setBio] = useState('');
  const [loadError, setLoadError] = useState(false);

  const [newSkillInput, setNewSkillInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (apiFetch && currentUser) {
      apiFetch('/users/me/profile')
        .then(async (res) => {
          if (res && res.ok) {
            const data = await res.json();
            if (isMounted) {
              setLoadError(false);
              if (data.full_name) setFullName(data.full_name);
              setPhone(data.phone || '');
              setUniversity(data.university || '');
              setMajor(data.major || '');
              setBio(data.bio || '');
              setCompanyWebsite(data.website || '');
              setCompanyIndustry(data.industry || '');
              setUserSkills((data.skills || '').split(',').map((s) => s.trim()).filter(Boolean));
            }
          }
        })
        .catch(() => {
          if (isMounted) setLoadError(true);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [apiFetch, currentUser, setUserSkills]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    if (userSkills.includes(newSkillInput.trim())) {
      showToast(isRtl ? 'المهارة موجودة بالفعل!' : 'Skill already added!', 'info');
      return;
    }
    const updated = [...userSkills, newSkillInput.trim()];
    setUserSkills(updated);
    setNewSkillInput('');
    if (apiFetch) {
      apiFetch('/users/me/skills', {
        method: 'PUT',
        body: JSON.stringify({ skills: updated.join(', ') })
      }).catch(() => {});
    }
    showToast(isRtl ? 'تمت إضافة المهارة وحفظها بنجاح' : 'Skill added successfully', 'success');
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updated = userSkills.filter((s) => s !== skillToRemove);
    setUserSkills(updated);
    if (apiFetch) {
      apiFetch('/users/me/skills', {
        method: 'PUT',
        body: JSON.stringify({ skills: updated.join(', ') })
      }).catch(() => {});
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const isCompany = currentUser?.role === 'company';
      const res = await apiFetch('/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          university: university.trim(),
          major: major.trim(),
          bio: bio.trim(),
          skills: userSkills.join(', '),
          ...(isCompany ? { website: companyWebsite.trim(), industry: companyIndustry.trim() } : {})
        })
      });
      if (!res || !res.ok) {
        const errData = res ? await res.json().catch(() => ({})) : {};
        const detail = Array.isArray(errData.detail) ? errData.detail.map((d) => d.msg).join(', ') : errData.detail;
        throw new Error(detail || (isRtl ? 'تعذر حفظ الملف الشخصي' : 'Could not save the profile'));
      }
      showToast(isRtl ? 'تم حفظ بيانات الملف الشخصي بنجاح' : 'Profile updated successfully!', 'success');
    } catch (err) {
      showToast(`${isRtl ? 'خطأ' : 'Error'}: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto">
      {loadError && (
        <div role="alert" className="p-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30">
          {isRtl ? 'تعذر تحميل بيانات الملف الشخصي من الخادم. يرجى إعادة المحاولة.' : 'Could not load your profile from the server. Please try again.'}
        </div>
      )}
      {/* مسار التنقل والترويسة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2499F2]/20">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <Link to="/dashboard" className="hover:text-[#2499F2] transition">
              {t('sidebar.dashboard', 'الرئيسية')}
            </Link>
            <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              {isRtl ? 'الملف الشخصي' : 'User Profile'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <User className="w-6 h-6 text-[#2499F2]" />
            <span>{isRtl ? 'الملف الشخصي والبيانات الأكاديمية' : 'Personal & Academic Profile'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'إدارة معلومات الحساب، تفاصيل التخصص، والمهارات التقنية المطابقة لفرص السوق.'
              : 'Manage your credentials, academic specialization, and matching skill badges.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {currentUser?.role === 'student' && (
            <button
              type="button"
              onClick={() => setIsOnboardingModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#152550] hover:bg-slate-200 dark:hover:bg-[#182b5c] text-slate-800 dark:text-slate-100 font-bold text-xs border border-slate-300/80 dark:border-[#2499F2]/30 transition cursor-pointer active:scale-95 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isRtl ? 'معالج الإعداد السريع' : 'Quick Onboarding Wizard'}</span>
            </button>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] hover:opacity-95 text-[#101E42] font-black text-xs shadow-md shadow-[#2499F2]/20 transition cursor-pointer active:scale-95 shrink-0"
          >
            <Save className="w-4 h-4 text-[#101E42]" />
            <span>{isSaving ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التعديلات' : 'Save Changes')}</span>
          </button>
        </div>
      </div>

      {/* بطاقة الهوية الرسمية البارزة */}
      <div className="bg-[#101E42] text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-[#2499F2]/25">
        <div className="absolute top-0 end-0 w-80 h-80 bg-[#28C8C0]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-start">
          <div className="w-20 h-20 rounded-2xl bg-white/10 border border-[#28C8C0]/40 flex items-center justify-center text-3xl shadow-lg shrink-0">
            {currentUser?.role === 'company' ? '🏢' : currentUser?.role === 'supervisor' ? '👨‍🏫' : '🎓'}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#28C8C0]/20 border border-[#28C8C0]/30 text-[#77DCC1] text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#28C8C0]" />
              <span>{getRoleLabel(currentUser?.role)}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white truncate">
              {currentUser?.name}
            </h2>
            <p className="text-xs text-slate-300 font-mono">
              {currentUser?.email}
            </p>
          </div>
        </div>
      </div>

      {/* نموذج تفاصيل الحساب والبيانات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* بيانات الحقل الأساسية */}
        <div className="lg:col-span-2 bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/10">
            <FileText className="w-4 h-4 text-[#2499F2]" />
            <span>{isRtl ? 'المعلومات العامة والتواصل' : 'General & Contact Info'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                {isRtl ? 'الاسم الكامل' : 'Full Name'}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2]"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-slate-100 dark:bg-[#0B152E]/50 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                {isRtl ? 'رقم الهاتف / الواتساب' : 'Phone / WhatsApp'}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2]"
                dir="ltr"
              />
            </div>

            {currentUser?.role !== 'company' ? (
              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                  {isRtl ? 'الجامعة والفرع' : 'University & Campus'}
                </label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2]"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                  {isRtl ? 'الموقع الإلكتروني' : 'Website'}
                </label>
                <input
                  type="text"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2]"
                  dir="ltr"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
              {currentUser?.role === 'company'
                ? isRtl ? 'مجال النشاط والقطاع' : 'Industry & Domain'
                : isRtl ? 'التخصص الأكاديمي' : 'Major / Specialization'}
            </label>
            <input
              type="text"
              value={currentUser?.role === 'company' ? companyIndustry : major}
              onChange={(e) =>
                currentUser?.role === 'company' ? setCompanyIndustry(e.target.value) : setMajor(e.target.value)
              }
              className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2]"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
              {isRtl ? 'نبذة تعريفية ومجالات الاهتمام' : 'Bio & Professional Summary'}
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2]"
            />
          </div>
        </div>

        {/* المهارات والتقنيات التقنية */}
        <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/10">
            <Sparkles className="w-4 h-4 text-[#28C8C0]" />
            <span>{isRtl ? 'المهارات والتقنيات المسجلة' : 'Registered Skills & Tech'}</span>
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {isRtl
              ? 'تُستخدم هذه المهارات في خوارزمية المطابقة الذكية مع مشاريع التخرج وفرص الشركات.'
              : 'These skills are used by our smart matching engine for project and sponsorship discovery.'}
          </p>

          <form onSubmit={handleAddSkill} className="flex gap-2">
            <input
              type="text"
              placeholder={isRtl ? 'أدخل مهارة جديدة (مثلاً: Flutter)...' : 'Add a skill (e.g., Flutter)...'}
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2]"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-[#2499F2] hover:bg-[#1D7BC3] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2">
            {userSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2499F2]/10 dark:bg-[#2499F2]/20 text-[#2499F2] dark:text-[#77DCC1] border border-[#2499F2]/30 text-xs font-semibold"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-rose-500 transition cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
