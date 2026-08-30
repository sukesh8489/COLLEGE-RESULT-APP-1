import React from 'react';

interface StudentLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  showBadge?: boolean;
}

export const StudentLogo: React.FC<StudentLogoProps> = ({
  className = '',
  size = 'md',
  showBadge = true,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    custom: '',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${sizeClasses[size]} ${className}`}
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          {/* Background Radial Gradient */}
          <linearGradient id="studentBgGrad" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#0B132B" />
          </linearGradient>

          {/* Golden Rim Gradient */}
          <linearGradient id="goldRimGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="35%" stopColor="#F59E0B" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>

          {/* Cap Gradient */}
          <linearGradient id="mortarGrad" x1="30" y1="25" x2="90" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Tassel Glow */}
          <linearGradient id="goldTassel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>

          {/* Subtle Shadow */}
          <filter id="badgeShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
          </filter>
        </defs>

        {showBadge && (
          <>
            {/* Outer Golden Border Ring */}
            <circle cx="60" cy="60" r="56" fill="url(#goldRimGrad)" />

            {/* Inner Dark Academic Navy Base */}
            <circle cx="60" cy="60" r="51" fill="url(#studentBgGrad)" stroke="#1E293B" strokeWidth="1.5" />

            {/* Subtle Inner Concentric Glow Ring */}
            <circle cx="60" cy="60" r="46" fill="none" stroke="#FDE047" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.4" />
          </>
        )}

        {/* ================= STUDENT / SCHOLAR GRAPHIC ================= */}
        <g transform="translate(0, 0)">
          {/* Student Torso / Blazer Collar */}
          <path
            d="M26 100 C28 80, 42 74, 60 74 C78 74, 92 80, 94 100 Z"
            fill="#1E293B"
          />
          {/* Blazer Lapel V-neck */}
          <path
            d="M48 76 L60 92 L72 76 Z"
            fill="#0F172A"
          />
          {/* Academic Tie / Ribbon */}
          <path
            d="M57 88 L63 88 L65 99 L60 102 L55 99 Z"
            fill="url(#goldTassel)"
          />
          {/* Inner Shirt Collar */}
          <path
            d="M51 75 L60 86 L57 88 L50 78 Z"
            fill="#E2E8F0"
          />
          <path
            d="M69 75 L60 86 L63 88 L70 78 Z"
            fill="#CBD5E1"
          />

          {/* Student Neck */}
          <path
            d="M53 66 H67 V77 C67 77 64 80 60 80 C56 80 53 77 53 77 Z"
            fill="#FBBF24"
            opacity="0.9"
          />

          {/* Student Face / Head */}
          <circle cx="60" cy="54" r="16" fill="#FDE68A" />

          {/* Stylized Hair */}
          <path
            d="M46 51 C46 42 52 38 60 38 C68 38 74 42 74 51 C74 49 71 45 60 45 C49 45 46 49 46 51 Z"
            fill="#334155"
          />

          {/* Mortarboard Graduation Cap Top Diamond */}
          <path
            d="M60 25 L92 38 L60 50 L28 38 Z"
            fill="url(#mortarGrad)"
            stroke="#60A5FA"
            strokeWidth="1.2"
            filter="url(#badgeShadow)"
          />

          {/* Mortarboard Cap Skull Cap Base */}
          <path
            d="M42 42 C42 42 44 51 60 51 C76 51 78 42 78 42 Z"
            fill="#1E3A8A"
            stroke="#2563EB"
            strokeWidth="0.8"
          />

          {/* Golden Button On Top of Cap */}
          <circle cx="60" cy="37.5" r="2.8" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.8" />

          {/* Golden Tassel String */}
          <path
            d="M60 37.5 C68 39, 79 43, 83 50"
            fill="none"
            stroke="url(#goldTassel)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Golden Tassel Fringe */}
          <path
            d="M81 50 L86 50 L87 60 L83 62 L80 60 Z"
            fill="url(#goldTassel)"
          />
        </g>
      </svg>
    </div>
  );
};
