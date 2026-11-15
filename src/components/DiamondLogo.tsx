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
        <div className="absolute inset-0 bg-blue-500/30 blur-md rounded-full group-hover:bg-cyan-400/50 transition-all duration-500 animate-pulse" />
      )}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`relative z-10 transition-transform duration-300 group-hover:scale-105 ${className}`}
      >
        <defs>
          <linearGradient id="sapphireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="30%" stopColor="#3b82f6" />
            <stop offset="70%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="facetLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
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
          stroke="#93c5fd"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Side crown facets */}
        <polygon
          points="35,16 25,32 6,50"
          fill="#2563eb"
          fillOpacity="0.8"
          stroke="#60a5fa"
          strokeWidth="1.2"
        />
        <polygon
          points="65,16 75,32 94,50"
          fill="#1d4ed8"
          fillOpacity="0.85"
          stroke="#60a5fa"
          strokeWidth="1.2"
        />

        {/* Center brilliant pavilion facets */}
        <polygon
          points="25,32 50,92 75,32"
          fill="#1e40af"
          fillOpacity="0.75"
          stroke="#93c5fd"
          strokeWidth="1.2"
        />
        <polygon
          points="6,50 25,32 50,92"
          fill="#1e3a8a"
          fillOpacity="0.9"
          stroke="#3b82f6"
          strokeWidth="1"
        />
        <polygon
          points="94,50 75,32 50,92"
          fill="#0c4a6e"
          fillOpacity="0.9"
          stroke="#3b82f6"
          strokeWidth="1"
        />

        {/* Brilliant reflection sparkle */}
        <circle cx="38" cy="24" r="2.5" fill="#ffffff" />
        <path
          d="M 50 20 L 52 26 L 58 28 L 52 30 L 50 36 L 48 30 L 42 28 L 48 26 Z"
          fill="#ffffff"
          opacity="0.85"
        />
      </svg>
    </div>
  );
};
