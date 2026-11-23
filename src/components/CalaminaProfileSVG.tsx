import React from 'react';
import { getColorByCode, ProfileType } from '../types/calaminas';

interface CalaminaProfileSVGProps {
  profileType: ProfileType;
  colorCode: string;
  className?: string;
  showCrossSection?: boolean;
}

export const CalaminaProfileSVG: React.FC<CalaminaProfileSVGProps> = ({
  profileType,
  colorCode,
  className = 'w-full h-24',
  showCrossSection = true,
}) => {
  const color = getColorByCode(colorCode);
  const gradId = `sheet-${profileType}-${colorCode.replace(/[^a-zA-Z0-9]/g, '')}`;
  const isLight =
    colorCode === 'RAL-9003' ||
    colorCode === 'ZINC' ||
    colorCode === 'TRANS' ||
    colorCode === 'OPAL';
  const strokeColor = isLight ? '#64748B' : 'rgba(255,255,255,0.28)';

  return (
    <svg
      viewBox="0 0 280 96"
      className={className}
      role="img"
      aria-label={`Perfil ${profileType} color ${color.name}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color.accentHex} />
          <stop offset="48%" stopColor={color.hex} />
          <stop offset="100%" stopColor={color.hex} stopOpacity="0.92" />
        </linearGradient>
      </defs>

      {(profileType === 'ONDULADA' || profileType === 'TRASLUCIDA') && (
        <g opacity={profileType === 'TRASLUCIDA' ? 0.82 : 1}>
          <path
            d="M24,62 Q34,50 44,62 T64,62 T84,62 T104,62 T124,62 T144,62 T164,62 T184,62 T204,62 L252,30 Q242,18 232,30 T212,30 T192,30 T172,30 T152,30 T132,30 T112,30 T92,30 T72,30 Z"
            fill={`url(#${gradId})`}
            stroke={profileType === 'TRASLUCIDA' ? '#38BDF8' : strokeColor}
            strokeWidth="1.3"
          />
          {[44, 64, 84, 104, 124, 144, 164, 184].map((x) => (
            <line
              key={x}
              x1={x}
              y1="61"
              x2={x + 48}
              y2="29"
              stroke={
                profileType === 'TRASLUCIDA'
                  ? 'rgba(56,189,248,0.45)'
                  : isLight
                  ? 'rgba(15,23,42,0.16)'
                  : 'rgba(255,255,255,0.22)'
              }
              strokeWidth="1"
            />
          ))}
          {profileType === 'TRASLUCIDA' && (
            <path
              d="M95,48 L145,25 L162,25 L112,48 Z"
              fill="rgba(255,255,255,0.65)"
            />
          )}
          {showCrossSection && (
            <path
              d="M24,78 Q34,68 44,78 T64,78 T84,78 T104,78 T124,78 T144,78 T164,78 T184,78 T204,78"
              fill="none"
              stroke={profileType === 'TRASLUCIDA' ? '#0EA5E9' : color.hex}
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}
        </g>
      )}

      {(profileType === 'TRAPEZOIDAL' || profileType === 'PANEL_TERMICO') && (
        <g>
          {profileType === 'PANEL_TERMICO' && (
            /* Polyurethane foam insulation core underneath */
            <path
              d="M22,64 L22,74 L224,74 L260,42 L260,32 L224,64 Z"
              fill="#FDE68A"
              stroke="#D97706"
              strokeWidth="1"
            />
          )}
          <path
            d="M22,64 L32,48 L48,48 L58,64 L78,64 L88,48 L104,48 L114,64 L134,64 L144,48 L160,48 L170,64 L190,64 L200,48 L216,48 L224,64 L260,32 L252,18 L236,18 L226,32 L206,32 L196,18 L180,18 L170,32 L150,32 L140,18 L124,18 L114,32 L94,32 L84,18 L68,18 L58,32 Z"
            fill={`url(#${gradId})`}
            stroke={strokeColor}
            strokeWidth="1.2"
          />
          {[32, 48, 88, 104, 144, 160, 200, 216].map((x) => (
            <line
              key={x}
              x1={x}
              y1="48"
              x2={x + 36}
              y2="18"
              stroke={isLight ? 'rgba(15,23,42,0.18)' : 'rgba(255,255,255,0.24)'}
              strokeWidth="1"
            />
          ))}
          {showCrossSection && (
            <path
              d="M22,84 L32,72 L48,72 L58,84 L78,84 L88,72 L104,72 L114,84 L134,84 L144,72 L160,72 L170,84 L190,84 L200,72 L216,72 L224,84"
              fill="none"
              stroke={color.hex}
              strokeWidth="3"
              strokeLinejoin="round"
            />
          )}
        </g>
      )}

      {profileType === 'TEJA_ESPANOLA' && (
        <g>
          <path
            d="M26,66 C38,48 52,48 64,66 C76,48 90,48 102,66 C114,48 128,48 140,66 C152,48 166,48 178,66 C190,48 204,48 216,66 L256,28 C244,14 230,14 218,28 C206,14 192,14 180,28 C168,14 154,14 142,28 C130,14 116,14 104,28 C92,14 78,14 66,28 Z"
            fill={`url(#${gradId})`}
            stroke={strokeColor}
            strokeWidth="1.2"
          />
          <path
            d="M40,52 C52,38 66,38 78,52 C90,38 104,38 116,52 C128,38 142,38 154,52 C166,38 180,38 192,52 C204,38 218,38 230,52"
            fill="none"
            stroke={isLight ? 'rgba(15,23,42,0.22)' : 'rgba(0,0,0,0.34)'}
            strokeWidth="2"
          />
          <path
            d="M54,39 C66,26 80,26 92,39 C104,26 118,26 130,39 C142,26 156,26 168,39 C180,26 194,26 206,39 C218,26 232,26 244,39"
            fill="none"
            stroke={isLight ? 'rgba(15,23,42,0.2)' : 'rgba(0,0,0,0.32)'}
            strokeWidth="2"
          />
          {showCrossSection && (
            <path
              d="M26,82 C38,68 52,68 64,82 C76,68 90,68 102,82 C114,68 128,68 140,82 C152,68 166,68 178,82 C190,68 204,68 216,82"
              fill="none"
              stroke={color.hex}
              strokeWidth="3"
            />
          )}
        </g>
      )}

      {profileType === 'CUMBRERA' && (
        <g>
          <path
            d="M36,64 L92,36 L148,64 L244,34 L188,12 L132,36 Z"
            fill={`url(#${gradId})`}
            stroke={strokeColor}
            strokeWidth="1.2"
          />
          <line x1="92" y1="36" x2="188" y2="12" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          {showCrossSection && (
            <path
              d="M68,82 L108,64 L148,82"
              fill="none"
              stroke={color.hex}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>
      )}

      {profileType === 'PERFIL' && (
        <g>
          <path
            d="M44,24 L196,24 L236,48 L236,68 L196,68 L196,58 L220,58 L220,50 L188,34 L52,34 L52,58 L76,58 L76,68 L44,68 Z"
            fill={`url(#${gradId})`}
            stroke={strokeColor}
            strokeWidth="1.2"
          />
          {showCrossSection && (
            <path
              d="M108,74 L100,74 L100,88 L148,88 L148,74 L140,74"
              fill="none"
              stroke={color.hex}
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}
        </g>
      )}

      {profileType === 'ACCESORIO' && (
        <g>
          <rect x="78" y="34" width="28" height="28" rx="4" fill={`url(#${gradId})`} stroke={strokeColor} strokeWidth="1.4" />
          <rect x="106" y="28" width="10" height="40" rx="2" fill="#1E293B" />
          <path d="M116,40 L186,40 L204,48 L186,56 L116,56 Z" fill="#94A3B8" stroke="#475569" strokeWidth="1" />
          {[126, 138, 150, 162, 174].map((x) => (
            <line key={x} x1={x} y1="38" x2={x - 5} y2="58" stroke="#334155" strokeWidth="2" />
          ))}
        </g>
      )}
    </svg>
  );
};
