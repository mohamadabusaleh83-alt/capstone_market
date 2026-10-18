/**
 * Approved Brand Logo Icon Component
 * Modern tech icon combining Academic Graduation Cap, Tech Network Nodes,
 * and Ascending Growth Bars in platform gradients (Cyan #06b6d4 & Blue #3b82f6).
 */
export default function LogoIcon({ className = 'w-8 h-8', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      {...props}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="logoCapGrad" x1="16" y1="20" x2="104" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="45%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        <linearGradient id="logoCapRimGrad" x1="16" y1="34" x2="104" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="50%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>

        <linearGradient id="logoCapUnderGrad" x1="34" y1="42" x2="86" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0e7490" />
          <stop offset="50%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>

        <linearGradient id="logoBarGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>

        <linearGradient id="logoBarGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        <linearGradient id="logoBarGrad3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        <linearGradient id="logoBarGrad4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>

        <linearGradient id="logoTrendGrad" x1="20" y1="92" x2="98" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>

        <linearGradient id="logoBaseLineGrad" x1="18" y1="106" x2="102" y2="106" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
          <stop offset="30%" stopColor="#06b6d4" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
        </linearGradient>

        {/* Glow Filters */}
        <filter id="logoSoftGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="logoAccentGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur1" />
          <feGaussianBlur stdDeviation="2" result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <radialGradient id="logoCenterAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient Backdrop Glow */}
      <circle cx="60" cy="58" r="48" fill="url(#logoCenterAura)" />

      {/* Base Grid Track */}
      <line x1="18" y1="106" x2="102" y2="106" stroke="url(#logoBaseLineGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="18" cy="106" r="2.5" fill="#06b6d4" />
      <circle cx="102" cy="106" r="2.5" fill="#3b82f6" />

      {/* Tech Network Circuit / Secondary Connecting Rays */}
      <g opacity="0.65" strokeLinecap="round">
        <line x1="22" y1="62" x2="36" y2="80" stroke="#0891b2" strokeWidth="1.2" strokeDasharray="2 2" />
        <line x1="36" y1="80" x2="50" y2="68" stroke="#0284c7" strokeWidth="1.2" />
        <line x1="50" y1="68" x2="64" y2="56" stroke="#2563eb" strokeWidth="1.2" />
        <line x1="64" y1="56" x2="78" y2="42" stroke="#4f46e5" strokeWidth="1.2" />
        <line x1="78" y1="42" x2="96" y2="28" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
      </g>

      {/* Growth Bars (الأعمدة البيانية الصاعدة) */}
      <g id="componentGrowthBars">
        <rect x="31" y="80" width="10" height="24" rx="4" fill="url(#logoBarGrad1)" />
        <rect x="45" y="68" width="10" height="36" rx="4" fill="url(#logoBarGrad2)" />
        <rect x="59" y="56" width="10" height="48" rx="4" fill="url(#logoBarGrad3)" />
        <rect x="73" y="42" width="10" height="62" rx="4" fill="url(#logoBarGrad4)" />
      </g>

      {/* Dynamic Ascending Market Trend Line */}
      <path
        d="M 22 92 L 36 80 L 50 68 L 64 56 L 78 42 L 98 26"
        fill="none"
        stroke="url(#logoTrendGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#logoSoftGlow)"
      />

      {/* Growth Nodes on Bars */}
      <circle cx="36" cy="80" r="3" fill="#22d3ee" stroke="#083344" strokeWidth="1.5" filter="url(#logoSoftGlow)" />
      <circle cx="50" cy="68" r="3" fill="#38bdf8" stroke="#082f49" strokeWidth="1.5" filter="url(#logoSoftGlow)" />
      <circle cx="64" cy="56" r="3.5" fill="#60a5fa" stroke="#172554" strokeWidth="1.5" filter="url(#logoSoftGlow)" />
      <circle cx="78" cy="42" r="3.5" fill="#818cf8" stroke="#1e1b4b" strokeWidth="1.5" filter="url(#logoSoftGlow)" />

      {/* Market Peak Arrow / Star Beacon */}
      <g transform="translate(98, 26)" filter="url(#logoAccentGlow)">
        <circle cx="0" cy="0" r="4.5" fill="#38bdf8" />
        <circle cx="0" cy="0" r="2" fill="#ffffff" />
        <circle cx="0" cy="0" r="7" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.6" />
      </g>

      {/* Academic Cap Skull Cap Base */}
      <path
        d="M 36 41 L 36 49 C 36 57 84 57 84 49 L 84 41 C 74 46 46 46 36 41 Z"
        fill="url(#logoCapUnderGrad)"
        stroke="#1e40af"
        strokeWidth="1"
      />

      {/* Academic Cap 3D Rim */}
      <path
        d="M 14 33 L 60 48 L 106 33 L 106 36.5 L 60 51.5 L 14 36.5 Z"
        fill="url(#logoCapRimGrad)"
      />

      {/* Academic Cap Top Diamond */}
      <polygon
        points="60,15 106,33 60,48 14,33"
        fill="url(#logoCapGrad)"
        stroke="#67e8f9"
        strokeWidth="1.2"
      />

      {/* Embedded Tech Circuit on Cap Top */}
      <g opacity="0.9">
        <circle cx="60" cy="31.5" r="3.5" fill="#67e8f9" filter="url(#logoSoftGlow)" />
        <circle cx="60" cy="31.5" r="1.5" fill="#ffffff" />

        <line x1="60" y1="31.5" x2="84" y2="24" stroke="#cffafe" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="84" cy="24" r="1.8" fill="#e0f2fe" />

        <line x1="60" y1="31.5" x2="36" y2="24" stroke="#cffafe" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="36" cy="24" r="1.8" fill="#e0f2fe" />

        <line x1="60" y1="31.5" x2="60" y2="43.5" stroke="#cffafe" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="60" cy="43.5" r="2" fill="#67e8f9" />

        <line x1="60" y1="31.5" x2="76" y2="38.5" stroke="#a5f3fc" strokeWidth="1" strokeLinecap="round" strokeDasharray="1.5 1.5" />
        <circle cx="76" cy="38.5" r="1.5" fill="#a5f3fc" />

        <line x1="60" y1="31.5" x2="44" y2="38.5" stroke="#a5f3fc" strokeWidth="1" strokeLinecap="round" strokeDasharray="1.5 1.5" />
        <circle cx="44" cy="38.5" r="1.5" fill="#a5f3fc" />
      </g>

      {/* Academic Tassel Flowing to Tech Node */}
      <g>
        <path
          d="M 60 31.5 C 42 29 25 35 22 46"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#logoSoftGlow)"
        />
        <circle cx="22" cy="46" r="2.5" fill="#38bdf8" />

        <line x1="22" y1="46" x2="22" y2="60" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="22" cy="62" r="3.5" fill="#22d3ee" filter="url(#logoAccentGlow)" />
        <circle cx="22" cy="62" r="1.5" fill="#ffffff" />
      </g>
    </svg>
  );
}
