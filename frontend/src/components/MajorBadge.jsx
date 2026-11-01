import { useApp } from '../context/AppContext';
import { GraduationCap } from 'lucide-react';

export default function MajorBadge({
  major,
  className = '',
  showIcon = true,
  size = 'sm'
}) {
  const { translateMajor, isRtl } = useApp() || {};

  if (!major || !String(major).trim()) {
    return null;
  }

  const localized = translateMajor ? translateMajor(major) : major;

  const sizeStyles =
    size === 'md'
      ? 'px-3 py-1 text-xs'
      : 'px-2.5 py-0.5 text-[10px] sm:text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold bg-blue-50 dark:bg-[#152550] text-[#1875bb] dark:text-[#28C8C0] border border-blue-200 dark:border-[#2499F2]/30 shadow-xs shrink-0 max-w-[220px] truncate ${sizeStyles} ${className}`}
      title={localized}
    >
      {showIcon && <GraduationCap className="w-3.5 h-3.5 text-[#2499F2] shrink-0" />}
      <span className="truncate">{localized}</span>
    </span>
  );
}
