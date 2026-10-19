/**
 * Capstone Market Platform - About Platform Page
 * Developed and engineered by: Mohamad Abu Saleh
 * LinkedIn: https://www.linkedin.com/in/mohamad-abu-saleh-598255350
 * Email: mohamadabusaleh83@gmail.com
 **/
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Lightbulb,
  Users,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Code2,
  Globe,
  Database,
  Terminal,
  Zap
} from 'lucide-react';

export default function AboutPage() {
  const { t } = useTranslation();
  const { isRtl, showToast } = useApp();
  const { currentUser } = useAuth();
  const [copiedEmail, setCopiedEmail] = useState(false);

  const developerEmail = 'mohamadabusaleh83@gmail.com';
  const linkedinUrl = 'https://www.linkedin.com/in/mohamad-abu-saleh-598255350';

  const handleCopyEmail = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(developerEmail);
    setCopiedEmail(true);
    if (showToast) {
      showToast(
        isRtl ? 'تم نسخ البريد الإلكتروني للمطور بنجاح!' : 'Developer email copied to clipboard!',
        'success'
      );
    }
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      {/* 1. مسار التنقل وزر العودة (Breadcrumb & Navigation Header) */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link
            to={currentUser ? '/dashboard' : '/'}
            className="hover:text-[#2499F2] dark:hover:text-[#28C8C0] transition-colors"
          >
            {isRtl ? 'الرئيسية' : 'Home'}
          </Link>
          <span>/</span>
          <span className="text-[#2499F2] dark:text-[#28C8C0] font-bold">
            {t('nav.about', isRtl ? 'عن المنصة' : 'About Platform')}
          </span>
        </div>

        <Link
          to={currentUser ? '/projects' : '/'}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/25 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#2499F2] dark:hover:border-[#28C8C0] hover:text-[#2499F2] dark:hover:text-[#28C8C0] transition-all shadow-sm group cursor-pointer"
        >
          <span>{isRtl ? 'استكشاف المشاريع' : 'Explore Projects'}</span>
          {isRtl ? (
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          )}
        </Link>
      </div>

      {/* 2. القسم التعريفي والرسالة (Hero Section) */}
      <section className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#101E42] border border-slate-200/90 dark:border-[#2499F2]/25 p-6 sm:p-10 md:p-12 shadow-xl dark:shadow-[0_12px_40px_-5px_rgba(7,13,30,0.85)]">
        {/* خلفيات جمالية ناعمة بنمط Brand Colors */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#2499F2]/10 dark:bg-[#2499F2]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#28C8C0]/10 dark:bg-[#28C8C0]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          {/* شارة الهوية البصرية */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2499F2]/10 dark:bg-[#2499F2]/20 border border-[#2499F2]/30 text-[#2499F2] dark:text-[#77DCC1] text-xs font-bold shadow-sm">
            <Sparkles className="w-4 h-4 text-[#28C8C0] animate-pulse" />
            <span>{isRtl ? 'المنصة الأكاديمية والريادية لمشاريع التخرج' : 'Academic & Entrepreneurial Capstone Hub'}</span>
          </div>

          {/* العنوان الرئيسي */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            <span>{isRtl ? 'عن منصة ' : 'About '}</span>
            <span className="bg-gradient-to-r from-[#2499F2] via-[#28C8C0] to-[#77DCC1] bg-clip-text text-transparent">
              {isRtl ? 'كابستون ماركت' : 'Capstone Market'}
            </span>
            <span className="block text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-600 dark:text-slate-300 mt-1">
              (Capstone Market)
            </span>
          </h1>

          {/* النص التعريفي القصير والرسالة */}
          <p className="text-base sm:text-lg md:text-xl text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
            "منصة أكاديمية وريادية تهدف إلى تمكين طلبة الجامعات من عرض مشاريع تخرجهم وابتكاراتهم التقنية، وسد الفجوة بين الأبحاث الأكاديمية وسوق العمل من خلال إتاحة فرص الرعاية والاستثمار للشركات والجهات المهتمة في بيئة عمل موحدة وتفاعلية."
          </p>

          {/* مؤشرات الأثر والقيمة */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-slate-100 dark:border-white/10 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B152E]/70 border border-slate-200/80 dark:border-[#2499F2]/20 space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{isRtl ? 'الهدف الأسمى' : 'Primary Goal'}</span>
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#28C8C0] shrink-0" />
                <span>{isRtl ? 'سد فجوة سوق العمل' : 'Bridging Career Gaps'}</span>
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B152E]/70 border border-slate-200/80 dark:border-[#2499F2]/20 space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{isRtl ? 'بيئة العمل' : 'Environment'}</span>
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#2499F2] shrink-0" />
                <span>{isRtl ? 'موحدة وتفاعلية' : 'Unified & Interactive'}</span>
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-slate-50 dark:bg-[#0B152E]/70 border border-slate-200/80 dark:border-[#2499F2]/20 space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{isRtl ? 'الشراكات' : 'Partnerships'}</span>
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{isRtl ? 'رعاية واستثمار حقيقي' : 'Sponsorship & Growth'}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ركائز ومزايا المنصة (3 بطاقات مدمجة وأنيقة) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-[#2499F2] dark:text-[#28C8C0] uppercase tracking-wider block">
              {isRtl ? 'الركائز الاستراتيجية' : 'Core Strategic Pillars'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {isRtl ? 'ركائز ومزايا المنصة' : 'Platform Pillars & Advantages'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            {isRtl
              ? 'بنية متقدمة صُممت لتقديم تجربة متكاملة تجمع الطلبة، الشركات، والمشرفين الأكاديميين.'
              : 'Engineered to provide an integrated experience connecting students, companies, and academic supervisors.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* البطاقة 1: استكشاف الابتكارات */}
          <div className="group relative bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/25 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl dark:hover:shadow-[0_10px_30px_-5px_rgba(40,200,192,0.2)] hover:border-[#28C8C0] dark:hover:border-[#28C8C0]/60 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#28C8C0]/15 dark:bg-[#28C8C0]/20 border border-[#28C8C0]/30 flex items-center justify-center text-[#28C8C0] shadow-md shadow-[#28C8C0]/15 group-hover:scale-110 transition-transform duration-300">
                <Lightbulb className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-[#28C8C0] block mb-1">
                  01 • INNOVATIONS
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#28C8C0] transition-colors">
                  {isRtl ? 'استكشاف الابتكارات' : 'Explore Innovations'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {isRtl
                    ? 'نافذة موحدة لاستعراض المشاريع النوعية وحلول التخرج.'
                    : 'A unified portal to showcase qualitative capstone projects and graduation solutions.'}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 text-[11px] text-[#2499F2] dark:text-[#77DCC1] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'مشاريع مصنفة وموثقة' : 'Verified & Categorized Projects'}</span>
            </div>
          </div>

          {/* البطاقة 2: فرص التعاون */}
          <div className="group relative bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/25 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl dark:hover:shadow-[0_10px_30px_-5px_rgba(36,153,242,0.2)] hover:border-[#2499F2] dark:hover:border-[#2499F2]/60 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2499F2]/15 dark:bg-[#2499F2]/20 border border-[#2499F2]/30 flex items-center justify-center text-[#2499F2] shadow-md shadow-[#2499F2]/15 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-[#2499F2] block mb-1">
                  02 • COLLABORATION
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#2499F2] transition-colors">
                  {isRtl ? 'فرص التعاون' : 'Collaboration Opportunities'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {isRtl
                    ? 'تمكين الشركات من استقطاب الكفاءات وتقديم العروض والرعاية.'
                    : 'Empowering companies to scout top talents, present partnership offers, and sponsor projects.'}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 text-[11px] text-[#2499F2] dark:text-[#77DCC1] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'تواصل مباشر مع أصحاب العمل' : 'Direct Employer Engagement'}</span>
            </div>
          </div>

          {/* البطاقة 3: كفاءة الإدارة والمتابعة */}
          <div className="group relative bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/25 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl dark:hover:shadow-[0_10px_30px_-5px_rgba(119,220,193,0.2)] hover:border-[#77DCC1] dark:hover:border-[#77DCC1]/60 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#77DCC1]/15 dark:bg-[#77DCC1]/20 border border-[#77DCC1]/30 flex items-center justify-center text-[#77DCC1] shadow-md shadow-[#77DCC1]/15 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-[#77DCC1] block mb-1">
                  03 • GOVERNANCE
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#77DCC1] transition-colors">
                  {isRtl ? 'كفاءة الإدارة والمتابعة' : 'Management & Tracking'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {isRtl
                    ? 'أدوات رقمية متقدمة لتنظيم التقديم والاعتماد.'
                    : 'Advanced digital tools to organize proposal submissions, reviews, and accreditations.'}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 text-[11px] text-[#2499F2] dark:text-[#77DCC1] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'لوحات تحكم وسجلات معتمدة' : 'Verified Dashboards & Audits'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. بطاقة المطور وحفظ الحقوق البرمجية (Developer Attribution Card) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#070D1E] via-[#101E42] to-[#152550] border-2 border-[#28C8C0]/40 p-6 sm:p-8 md:p-10 text-white shadow-2xl shadow-[#28C8C0]/15 dark:shadow-[0_15px_45px_-5px_rgba(40,200,192,0.2)]">
        {/* إضاءات نيون تركوازية وزرقاء عميقة (Neon Glow Accents) */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#28C8C0]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#2499F2]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* ترويسة التوثيق والحقوق البرمجية */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#2499F2]/25">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#152550] border border-[#28C8C0]/40 text-[#28C8C0] text-xs font-bold tracking-wide">
              <Code2 className="w-3.5 h-3.5 text-[#28C8C0]" />
              <span>{isRtl ? 'توثيق المطور وحفظ الحقوق البرمجية' : 'Developer Attribution & Engineering Credits'}</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#28C8C0] animate-ping" />
              <span>Full-Stack Platform Architecture</span>
            </div>
          </div>

          {/* محتوى بيانات المطور الأساسية */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              {/* صورة رمزية تفاعلية للمطور مع إطار نيون متوهج */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#101E42] to-[#152550] border-2 border-[#28C8C0] ring-4 ring-[#28C8C0]/20 flex items-center justify-center text-white font-mono font-black text-xl sm:text-2xl shadow-lg shadow-[#28C8C0]/30 select-none">
                  MAS
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#28C8C0] border-2 border-[#0B152E] flex items-center justify-center shadow-sm"
                  title="Verified Developer"
                >
                  <Check className="w-3 h-3 text-[#0B152E] stroke-[3]" />
                </div>
              </div>

              {/* الاسم والدور البرمجي */}
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-wide flex items-center gap-2">
                  <span>محمد أبو صالح</span>
                  <span className="text-slate-300 text-sm sm:text-lg font-medium font-sans">
                    (Mohamad Abu Saleh)
                  </span>
                </h3>

                <p className="text-xs sm:text-sm md:text-base font-semibold text-[#28C8C0] flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-[#77DCC1] shrink-0" />
                  <span>هندسة وتطوير واجهات ونظم المنصة (Full-Stack / Frontend Developer)</span>
                </p>

                <p className="text-xs text-slate-300 max-w-xl pt-1 leading-relaxed">
                  {isRtl
                    ? 'مسؤول عن التصميم المعماري، تطوير واجهات المستخدم التفاعلية، تكامل نظم البيانات والخدمات السحابية، وضمان تجربة استخدام سلسة وعالية الأداء لمنصة كابستون ماركت.'
                    : 'Responsible for end-to-end frontend and platform engineering, UI/UX design architecture, cloud integration, and delivering a resilient, high-performance experience for Capstone Market.'}
                </p>
              </div>
            </div>

            {/* الأزرار التفاعلية: رابط لينكدإن والبريد الإلكتروني */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              {/* زر LinkedIn الرسمي البارز */}
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#0A66C2]/40 hover:shadow-xl hover:shadow-[#0A66C2]/60 hover:scale-102 active:scale-98 transition-all duration-200 cursor-pointer group"
                title="Mohamad Abu Saleh - LinkedIn Profile"
              >
                <svg className="w-4 h-4 fill-current text-white shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
                <span>{isRtl ? 'تواصل عبر LinkedIn الرسمي' : 'Connect on Official LinkedIn'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              {/* زر البريد الإلكتروني للتواصل والنسخ */}
              <div className="flex items-center gap-1.5 bg-[#0B152E]/90 border border-[#2499F2]/30 rounded-2xl p-1.5 shadow-sm">
                <a
                  href={`mailto:${developerEmail}`}
                  className="flex-1 flex items-center gap-2 px-3 py-2 text-xs font-mono text-slate-200 hover:text-[#28C8C0] transition-colors truncate"
                  title={isRtl ? 'إرسال بريد إلكتروني للمطور' : 'Send email to developer'}
                >
                  <Mail className="w-3.5 h-3.5 text-[#2499F2] shrink-0" />
                  <span className="truncate">{developerEmail}</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="p-2 rounded-xl bg-[#152550] hover:bg-[#2499F2] text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                  title={isRtl ? 'نسخ البريد الإلكتروني' : 'Copy email'}
                  aria-label="Copy email"
                >
                  {copiedEmail ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. شريط التقنيات المستخدمة (Tech Stack Badges) */}
      <section className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/25 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
          <div>
            <span className="text-[11px] font-bold text-[#2499F2] dark:text-[#28C8C0] uppercase tracking-wider block">
              {isRtl ? 'البنية التقنية' : 'Engineering Architecture'}
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {isRtl ? 'شريط التقنيات المستخدمة' : 'Platform Tech Stack'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isRtl
              ? 'مبنية وفق أحدث المعايير البرمجية لضمان الأمان والسرعة والتجاوب'
              : 'Built with state-of-the-art standards for security, speed, and responsiveness'}
          </p>
        </div>

        {/* شبكة الشارات الأنيقة بالهوية البصرية */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. React */}
          <div className="group p-4 rounded-2xl bg-slate-50 dark:bg-[#0B152E]/70 border border-slate-200/80 dark:border-[#2499F2]/25 hover:border-[#2499F2] dark:hover:border-[#2499F2] hover:shadow-md hover:shadow-[#2499F2]/10 transition-all flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#2499F2]/15 dark:bg-[#2499F2]/20 border border-[#2499F2]/30 flex items-center justify-center text-[#2499F2] group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 animate-[spin_10s_linear_infinite]" viewBox="-11.5 -10.23174 23 20.46348">
                <circle cx="0" cy="0" r="2.05" fill="#61DAFB"/>
                <g stroke="#61DAFB" strokeWidth="1" fill="none">
                  <ellipse rx="11" ry="4.2"/>
                  <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
                  <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
                </g>
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white block group-hover:text-[#2499F2] transition-colors">
                React
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                Frontend UI Library
              </span>
            </div>
          </div>

          {/* 2. Tailwind CSS */}
          <div className="group p-4 rounded-2xl bg-slate-50 dark:bg-[#0B152E]/70 border border-slate-200/80 dark:border-[#28C8C0]/25 hover:border-[#28C8C0] dark:hover:border-[#28C8C0] hover:shadow-md hover:shadow-[#28C8C0]/10 transition-all flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#28C8C0]/15 dark:bg-[#28C8C0]/20 border border-[#28C8C0]/30 flex items-center justify-center text-[#28C8C0] group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 fill-current text-[#38BDF8]" viewBox="0 0 24 24">
                <path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z"/>
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white block group-hover:text-[#28C8C0] transition-colors">
                Tailwind CSS
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                Modern Responsive Styling
              </span>
            </div>
          </div>

          {/* 3. Vercel */}
          <div className="group p-4 rounded-2xl bg-slate-50 dark:bg-[#0B152E]/70 border border-slate-200/80 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/40 hover:shadow-md transition-all flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-200/60 dark:bg-white/10 border border-slate-300 dark:border-white/15 flex items-center justify-center text-slate-900 dark:text-white group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 22.525H0l12-21.05 12 21.05z"/>
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                Vercel
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                Cloud Edge Deployment
              </span>
            </div>
          </div>

          {/* 4. REST APIs */}
          <div className="group p-4 rounded-2xl bg-slate-50 dark:bg-[#0B152E]/70 border border-slate-200/80 dark:border-[#77DCC1]/25 hover:border-[#77DCC1] dark:hover:border-[#77DCC1] hover:shadow-md hover:shadow-[#77DCC1]/10 transition-all flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#77DCC1]/15 dark:bg-[#77DCC1]/20 border border-[#77DCC1]/30 flex items-center justify-center text-[#77DCC1] group-hover:scale-110 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white block group-hover:text-[#77DCC1] transition-colors">
                REST APIs
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                Full-Stack Data Services
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. دعوة تفاعلية للعمل (Call to Action Banner) */}
      <section className="bg-gradient-to-r from-[#101E42] to-[#152550] border border-[#2499F2]/30 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg">
        <div className="space-y-1 text-center sm:text-start">
          <h4 className="text-lg font-black text-white">
            {isRtl ? 'جاهز لاستكشاف مشاريع التخرج والفرص؟' : 'Ready to Explore Projects & Opportunities?'}
          </h4>
          <p className="text-xs sm:text-sm text-slate-300">
            {isRtl
              ? 'انضم الآن إلى منظومة كابستون ماركت وابدأ رحلتك الأكاديمية والريادية.'
              : 'Join the Capstone Market ecosystem today and start your academic and career journey.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/projects"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2499F2] to-[#1D7BC3] hover:from-[#1D7BC3] hover:to-[#175E95] text-white text-xs font-bold shadow-md shadow-[#2499F2]/30 active:scale-95 transition-all cursor-pointer"
          >
            {isRtl ? 'تصفح المشاريع' : 'Browse Projects'}
          </Link>

          {!currentUser && (
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer"
            >
              {isRtl ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
