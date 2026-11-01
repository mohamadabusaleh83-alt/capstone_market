import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { STANDARDIZED_IT_MAJORS, OTHER_MAJOR_KEY, matchStandardMajor } from '../api/majors';
import { GraduationCap, Edit3 } from 'lucide-react';

export default function MajorSelect({
  value = '',
  onChange,
  id = 'major-select',
  className = '',
  selectClassName = '',
  inputClassName = '',
  required = false,
  disabled = false,
  showLabel = true,
  label
}) {
  const { t } = useTranslation();
  const { isRtl } = useApp() || { isRtl: true };

  const [selectedKey, setSelectedKey] = useState('');
  const [customValue, setCustomValue] = useState('');

  // Sync internal state whenever external value prop changes
  useEffect(() => {
    if (!value || !value.trim()) {
      setSelectedKey('');
      setCustomValue('');
      return;
    }

    const matched = matchStandardMajor(value);
    if (matched) {
      setSelectedKey(matched.key);
      setCustomValue('');
    } else {
      setSelectedKey(OTHER_MAJOR_KEY);
      setCustomValue(value);
    }
  }, [value]);

  const handleSelectChange = (e) => {
    const key = e.target.value;
    setSelectedKey(key);

    if (!key) {
      if (onChange) onChange('');
      return;
    }

    if (key === OTHER_MAJOR_KEY) {
      if (onChange) onChange(customValue);
    } else {
      const standard = STANDARDIZED_IT_MAJORS.find((m) => m.key === key);
      if (standard && onChange) {
        // Store localized title according to current language
        onChange(isRtl ? standard.ar : standard.en);
      }
    }
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomValue(val);
    if (onChange) {
      onChange(val);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <label htmlFor={id} className="text-xs text-slate-700 dark:text-slate-300 block font-semibold flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-[#2499F2]" />
          <span>{label || (isRtl ? 'التخصص الأكاديمي (تكنولوجيا المعلومات)' : 'Academic Major (IT)')}</span>
        </label>
      )}

      <div className="relative">
        <select
          id={id}
          value={selectedKey}
          onChange={handleSelectChange}
          required={required && !selectedKey}
          disabled={disabled}
          className={`w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2499F2] focus:ring-1 focus:ring-[#2499F2] transition cursor-pointer appearance-none pe-8 ${selectClassName}`}
        >
          <option value="">{t('majors.select_major', 'اختر التخصص الأكاديمي...')}</option>
          {STANDARDIZED_IT_MAJORS.map((m) => (
            <option key={m.key} value={m.key}>
              {isRtl ? m.ar : m.en}
            </option>
          ))}
          <option value={OTHER_MAJOR_KEY}>
            {isRtl ? 'أخرى / تحديد تخصص آخر' : 'Other / Add Custom'}
          </option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-slate-400">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
          </svg>
        </div>
      </div>

      {selectedKey === OTHER_MAJOR_KEY && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1 flex items-center gap-1 font-medium">
            <Edit3 className="w-3 h-3 text-[#28C8C0]" />
            <span>{t('majors.custom_major_label', isRtl ? 'حدد تخصصك الأكاديمي:' : 'Specify your academic major:')}</span>
          </label>
          <input
            type="text"
            required={required}
            disabled={disabled}
            placeholder={t('majors.custom_major_placeholder', isRtl ? 'اكتب مسمى تخصصك الأكاديمي بالتحديد...' : 'Enter your specific academic major...')}
            value={customValue}
            onChange={handleCustomChange}
            className={`w-full bg-slate-50 dark:bg-[#0B152E] border border-[#28C8C0]/50 dark:border-[#28C8C0]/40 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#28C8C0] focus:ring-1 focus:ring-[#28C8C0] transition ${inputClassName}`}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
