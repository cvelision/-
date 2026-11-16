import React from 'react';

interface DiamondLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const DiamondLogo: React.FC<DiamondLogoProps> = ({
  className = 'w-9 h-9',
  glow = true,
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${glow ? 'group' : ''}`}>
      {glow && (
        <div className="absolute inset-0 bg-slate-500/20 blur-md rounded-full group-hover:bg-slate-400/25 transition-all duration-500" />
      )}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`relative z-10 transition-transform duration-300 group-hover:scale-105 ${className}`}
      >
        <defs>
          <linearGradient id="sapphireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7a8ea8" />
            <stop offset="35%" stopColor="#4c5f7a" />
            <stop offset="70%" stopColor="#2c3a4f" />
            <stop offset="100%" stopColor="#141b28" />
          </linearGradient>
          <linearGradient id="facetLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#475569" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4c7a5" />
            <stop offset="50%" stopColor="#9c8e6c" />
            <stop offset="100%" stopColor="#6b6046" />
          </linearGradient>
        </defs>

        {/* Outer Diamond facet body */}
        <polygon
          points="25,32 75,32 94,50 50,92 6,50"
          fill="url(#sapphireGrad)"
          stroke="url(#goldRim)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Top table facet */}
        <polygon
          points="35,16 65,16 75,32 25,32"
          fill="url(#facetLight)"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Side crown facets */}
        <polygon
          points="35,16 25,32 6,50"
          fill="#3f5069"
          fillOpacity="0.85"
          stroke="#7a8ea8"
          strokeWidth="1.2"
        />
        <polygon
          points="65,16 75,32 94,50"
          fill="#334155"
          fillOpacity="0.85"
          stroke="#7a8ea8"
          strokeWidth="1.2"
        />

        {/* Center brilliant pavilion facets */}
        <polygon
          points="25,32 50,92 75,32"
          fill="#2d3b4f"
          fillOpacity="0.8"
          stroke="#94a3b8"
          strokeWidth="1.2"
        />
        <polygon
          points="6,50 25,32 50,92"
          fill="#1e293b"
          fillOpacity="0.9"
          stroke="#64748b"
          strokeWidth="1"
        />
        <polygon
          points="94,50 75,32 50,92"
          fill="#182230"
          fillOpacity="0.9"
          stroke="#64748b"
          strokeWidth="1"
        />

        {/* Subtle reflection sparkle */}
        <circle cx="38" cy="24" r="2.2" fill="#e2e8f0" />
        <path
          d="M 50 20 L 52 26 L 58 28 L 52 30 L 50 36 L 48 30 L 42 28 L 48 26 Z"
          fill="#e2e8f0"
          opacity="0.75"
        />
      </svg>
    </div>
  );
};
