import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Lock,
  Moon,
  Sun,
  Globe,
  Bell,
  Save,
  CheckCircle2,
  ChevronRight,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { isDark, toggleTheme, setTheme } = useTheme();
  const { isRtl, toggleLanguage, currentLang, showToast } = useApp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // إعدادات الإشعارات
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [milestoneReminders, setMilestoneReminders] = useState(true);
  const [partnershipOffers, setPartnershipOffers] = useState(true);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast(isRtl ? 'كلمة المرور الجديدة غير متطابقة!' : 'New passwords do not match!', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast(isRtl ? 'يجب أن لا تقل كلمة المرور عن 6 خانات' : 'Password must be at least 6 characters', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(isRtl ? 'تم تحديث كلمة المرور بنجاح!' : 'Password updated successfully!', 'success');
    }, 600);
  };

  const handleSavePreferences = () => {
    showToast(isRtl ? 'تم حفظ تفضيلات المنصة والإشعارات بنجاح' : 'Preferences saved successfully', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      {/* مسار التنقل والترويسة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2499F2]/20">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <Link to="/dashboard" className="hover:text-[#2499F2] transition">
              {t('sidebar.dashboard', 'الرئيسية')}
            </Link>
            <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              {isRtl ? 'إعدادات الحساب' : 'Account Settings'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-[#2499F2]" />
            <span>{isRtl ? 'إعدادات الحساب وتفضيلات المنصة' : 'Account & Platform Settings'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'تخصيص الأمان، المظهر الداكن، لغة الواجهة، وقنوات استلام التنبيهات.'
              : 'Customize security credentials, appearance, language, and notification channels.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* قسم الأمان وتغيير كلمة المرور */}
        <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/10">
            <Shield className="w-4 h-4 text-[#2499F2]" />
            <span>{isRtl ? 'أمان الحساب وكلمة المرور' : 'Account Security & Password'}</span>
          </h3>

          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                {isRtl ? 'كلمة المرور الحالية' : 'Current Password'}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                {isRtl ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                {isRtl ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2]"
                dir="ltr"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? (isRtl ? 'إخفاء الرموز' : 'Hide') : (isRtl ? 'إظهار الرموز' : 'Show')}</span>
              </button>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#28C8C0] text-[#101E42] font-black text-xs shadow-md transition cursor-pointer active:scale-95"
              >
                {isUpdatingPassword ? (isRtl ? 'جاري التحديث...' : 'Updating...') : (isRtl ? 'تحديث كلمة المرور' : 'Update Password')}
              </button>
            </div>
          </form>
        </div>

        {/* قسم المظهر واللغة */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/10">
              <Globe className="w-4 h-4 text-[#28C8C0]" />
              <span>{isRtl ? 'المظهر واللغة' : 'Appearance & Language'}</span>
            </h3>

            {/* مفتاح الثيم */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#0B152E] border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#2499F2]/15 text-[#2499F2] flex items-center justify-center">
                  {isDark ? <Moon className="w-4 h-4 text-[#28C8C0]" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {isRtl ? 'المظهر الليلي (Dark Mode)' : 'Dark Theme'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isDark ? (isRtl ? 'مفعل (Navy الفخم)' : 'Active') : (isRtl ? 'الوضع الفاتح' : 'Light')}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-xl bg-[#101E42] dark:bg-white text-white dark:text-[#101E42] font-bold text-xs transition cursor-pointer active:scale-95 shadow-sm"
              >
                {isRtl ? 'تبديل' : 'Toggle'}
              </button>
            </div>

            {/* مفتاح اللغة */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#0B152E] border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#28C8C0]/15 text-[#28C8C0] flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {isRtl ? 'لغة الواجهة (Interface Language)' : 'Interface Language'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {currentLang === 'ar' ? 'العربية (Arabic)' : 'English (الإنجليزية)'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleLanguage}
                className="px-3 py-1.5 rounded-xl bg-[#2499F2] text-white font-bold text-xs transition cursor-pointer active:scale-95 shadow-sm"
              >
                {currentLang === 'ar' ? 'English' : 'عربي'}
              </button>
            </div>
          </div>

          {/* قسم تفضيلات الإشعارات */}
          <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 rounded-3xl p-6 shadow-sm space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/10">
              <Bell className="w-4 h-4 text-[#77DCC1]" />
              <span>{isRtl ? 'تفضيلات قنوات الإشعارات' : 'Notification Channels'}</span>
            </h3>

            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#0B152E]/60 transition">
              <span className="text-xs text-slate-700 dark:text-slate-300">
                {isRtl ? 'إشعارات البريد الإلكتروني الفورية' : 'Email Notifications'}
              </span>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-[#2499F2] focus:ring-[#2499F2] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#0B152E]/60 transition">
              <span className="text-xs text-slate-700 dark:text-slate-300">
                {isRtl ? 'تذكير بمواعيد تسليم التقارير' : 'Milestone Deadline Reminders'}
              </span>
              <input
                type="checkbox"
                checked={milestoneReminders}
                onChange={(e) => setMilestoneReminders(e.target.checked)}
                className="w-4 h-4 rounded text-[#2499F2] focus:ring-[#2499F2] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#0B152E]/60 transition">
              <span className="text-xs text-slate-700 dark:text-slate-300">
                {isRtl ? 'عروض الشراكة من الشركات' : 'Company Sponsorship Alerts'}
              </span>
              <input
                type="checkbox"
                checked={partnershipOffers}
                onChange={(e) => setPartnershipOffers(e.target.checked)}
                className="w-4 h-4 rounded text-[#2499F2] focus:ring-[#2499F2] cursor-pointer"
              />
            </label>

            <button
              type="button"
              onClick={handleSavePreferences}
              className="w-full mt-2 py-2 rounded-xl bg-slate-100 dark:bg-[#0B152E] hover:bg-[#2499F2]/10 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition cursor-pointer"
            >
              {isRtl ? 'حفظ تفضيلات الإشعارات' : 'Save Notification Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
