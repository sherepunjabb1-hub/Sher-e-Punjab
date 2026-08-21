import React from 'react';

interface RestaurantLogoProps {
  className?: string;
}

export const RestaurantLogo: React.FC<RestaurantLogoProps> = ({ className = 'w-full h-full' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
    >
      <defs>
        <radialGradient id="logoBgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2A1E0E" />
          <stop offset="70%" stopColor="#140E06" />
          <stop offset="100%" stopColor="#080604" />
        </radialGradient>
        <linearGradient id="logoGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF3C4" />
          <stop offset="30%" stopColor="#F3C64F" />
          <stop offset="60%" stopColor="#D4AF37" />
          <stop offset="90%" stopColor="#AA771C" />
          <stop offset="100%" stopColor="#6E4B08" />
        </linearGradient>
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#D4AF37" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer Ring Background */}
      <circle cx="256" cy="256" r="248" fill="url(#logoBgGrad)" stroke="url(#logoGoldGrad)" strokeWidth="14" />
      <circle cx="256" cy="256" r="228" fill="none" stroke="url(#logoGoldGrad)" strokeWidth="3" strokeDasharray="8 6" opacity="0.8" />
      
      {/* Subtle Inner Border */}
      <circle cx="256" cy="256" r="212" fill="#140E05" stroke="url(#logoGoldGrad)" strokeWidth="4" opacity="0.9" />

      {/* Ornate Crown */}
      <g filter="url(#logoGlow)">
        <path d="M 175 160 L 205 200 L 256 140 L 307 200 L 337 160 L 328 220 L 184 220 Z" fill="url(#logoGoldGrad)" />
        <circle cx="175" cy="150" r="8" fill="#FFF3C4" />
        <circle cx="256" cy="130" r="10" fill="#FFF3C4" />
        <circle cx="337" cy="150" r="8" fill="#FFF3C4" />
        <rect x="184" y="212" width="144" height="10" rx="3" fill="url(#logoGoldGrad)" />
        <circle cx="256" cy="217" r="3.5" fill="#140E05" />
        <circle cx="220" cy="217" r="3" fill="#140E05" />
        <circle cx="292" cy="217" r="3" fill="#140E05" />
      </g>

      {/* Central Royal 'S' Monogram */}
      <g filter="url(#logoGlow)">
        <text
          x="256"
          y="390"
          fontFamily="'Playfair Display', 'Cinzel', 'Georgia', serif"
          fontSize="220"
          fontWeight="900"
          fill="url(#logoGoldGrad)"
          textAnchor="middle"
        >
          S
        </text>
      </g>
    </svg>
  );
};
