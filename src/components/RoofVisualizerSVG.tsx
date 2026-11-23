import React from 'react';
import { getColorByCode, ProfileType } from '../types/calaminas';

interface RoofVisualizerSVGProps {
  profileType: ProfileType;
  colorCode: string;
  trimColorCode?: string;
  includeSkylight?: boolean;
  className?: string;
}

export const RoofVisualizerSVG: React.FC<RoofVisualizerSVGProps> = ({
  profileType,
  colorCode,
  trimColorCode,
  includeSkylight = false,
  className = 'w-full h-52',
}) => {
  const mainColor = getColorByCode(colorCode);
  const trimColor = getColorByCode(trimColorCode || colorCode);
  const gradId = `roof-main-${profileType}-${colorCode.replace(/[^a-zA-Z0-9]/g, '')}`;

  const effectiveProfile =
    profileType === 'TRASLUCIDA' || profileType === 'CUMBRERA' || profileType === 'PERFIL' || profileType === 'ACCESORIO'
      ? 'ONDULADA'
      : profileType;

  return (
    <svg
      viewBox="0 0 420 210"
      className={className}
      role="img"
      aria-label={`Simulación de techo ${profileType} color ${mainColor.name}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={mainColor.accentHex} />
          <stop offset="55%" stopColor={mainColor.hex} />
          <stop offset="100%" stopColor={mainColor.hex} stopOpacity="0.88" />
        </linearGradient>
        <linearGradient id="sky-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>
      </defs>

      {/* Subtle architectural sky backdrop */}
      <rect x="0" y="0" width="420" height="210" rx="14" fill="url(#sky-bg)" />

      {/* Ground shadow */}
      <ellipse cx="210" cy="186" rx="158" ry="12" fill="rgba(15, 23, 42, 0.1)" />

      {/* House / Warehouse Structure Walls */}
      {/* Front facade */}
      <polygon points="62,114 218,128 218,184 62,168" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.2" />
      {/* Side gable wall */}
      <polygon points="218,128 358,108 358,164 218,184" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.2" />
      {/* Gable triangle */}
      <polygon points="218,128 294,46 358,108" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.2" />

      {/* Architectural windows & warehouse door */}
      <polygon points="88,132 134,137 134,162 88,157" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
      <polygon points="154,139 194,143 194,179 154,175" fill="#334155" />
      <polygon points="264,134 316,127 316,170 264,177" fill="#475569" />

      {/* Main Visible Roof Slope */}
      <polygon
        points="42,116 124,30 296,44 218,132"
        fill={`url(#${gradId})`}
        stroke="#1E293B"
        strokeOpacity="0.25"
        strokeWidth="1.2"
      />

      {/* Back Roof Slope hint */}
      <polygon
        points="296,44 374,108 358,110 294,48"
        fill={mainColor.hex}
        opacity="0.82"
      />

      {/* Translucent Skylight Sheet (Tragaluz) if toggled */}
      {includeSkylight && (
        <polygon
          points="158,126 238,39 260,41 180,128"
          fill="#E0F7FF"
          fillOpacity="0.82"
          stroke="#38BDF8"
          strokeWidth="1"
        />
      )}

      {/* Profile Texture Lines (Ondulada vs Trapezoidal vs Teja Española) */}
      {effectiveProfile === 'ONDULADA' && (
        <g stroke="rgba(255,255,255,0.28)" strokeWidth="1.2">
          {[0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 0.72, 0.8, 0.88, 0.94].map((t) => {
            const x1 = 42 + (218 - 42) * t;
            const y1 = 116 + (132 - 116) * t;
            const x2 = 124 + (296 - 124) * t;
            const y2 = 30 + (44 - 30) * t;
            return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>
      )}

      {(effectiveProfile === 'TRAPEZOIDAL' || effectiveProfile === 'PANEL_TERMICO') && (
        <g>
          {[0.12, 0.28, 0.44, 0.6, 0.76, 0.9].map((t) => {
            const x1 = 42 + (218 - 42) * t;
            const y1 = 116 + (132 - 116) * t;
            const x2 = 124 + (296 - 124) * t;
            const y2 = 30 + (44 - 30) * t;
            return (
              <g key={t}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,0.22)" strokeWidth="3.5" />
                <line x1={x1 - 2} y1={y1} x2={x2 - 2} y2={y2} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
              </g>
            );
          })}
        </g>
      )}

      {effectiveProfile === 'TEJA_ESPANOLA' && (
        <g>
          {/* Vertical Spanish tile channels */}
          {[0.1, 0.22, 0.34, 0.46, 0.58, 0.7, 0.82, 0.92].map((t) => {
            const x1 = 42 + (218 - 42) * t;
            const y1 = 116 + (132 - 116) * t;
            const x2 = 124 + (296 - 124) * t;
            const y2 = 30 + (44 - 30) * t;
            return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,0.26)" strokeWidth="2.2" />;
          })}
          {/* Horizontal stamped tile steps */}
          {[0.2, 0.4, 0.6, 0.8].map((s) => {
            const x1 = 42 + (124 - 42) * s;
            const y1 = 116 + (30 - 116) * s;
            const x2 = 218 + (296 - 218) * s;
            const y2 = 132 + (44 - 132) * s;
            return <line key={s} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,0.22)" strokeWidth="2" />;
          })}
        </g>
      )}

      {/* Cumbrera (Ridge Cap) */}
      <polygon
        points="120,30 128,25 300,39 294,46"
        fill={trimColor.hex}
        stroke="#0F172A"
        strokeOpacity="0.35"
        strokeWidth="1"
      />

      {/* Canaleta (Rain Gutter) along front edge */}
      <polygon
        points="40,117 219,133 219,140 40,123"
        fill={trimColor.accentHex}
        stroke="#334155"
        strokeWidth="0.9"
      />

      {/* Label pill in corner */}
      <text
        x="16"
        y="24"
        fill="#0F172A"
        fontSize="10"
        fontWeight="700"
        fontFamily="Outfit, sans-serif"
      >
        {mainColor.name.toUpperCase()} ({mainColor.code})
      </text>
    </svg>
  );
};
