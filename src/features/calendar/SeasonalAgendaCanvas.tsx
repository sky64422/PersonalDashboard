import { useId, useState } from 'react';
import type { SeasonalDailyState } from './seasonalCanvas';

export function SeasonalAgendaCanvas({ state }: { state: SeasonalDailyState }) {
  const uid = useId().replace(/:/g, '');
  const symbol = (name: string) => `#${uid}-${name}`;

  const { season, landscapeId, particles } = state;
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`agenda-seasonal-backdrop season-${season} landscape-${landscapeId}`} aria-hidden="true">
      {/* 1. Curated High-Resolution Vertical Landscape Photography (Exact 3:7 / 600x1400 Ratio) */}
      {!imgError && (
        <img
          src={`/assets/calendar/${landscapeId}.jpg`}
          alt=""
          className="agenda-seasonal-photo"
          loading="eager"
          decoding="sync"
          onError={() => setImgError(true)}
        />
      )}

      {/* 2. Frosted Convex Glass Overlay for Schedule Contrast & Lyrical Mood */}
      <div className="agenda-seasonal-glass-overlay" />

      {/* 3. Living Ambient Particles Floating over the Photographic Canvas */}
      <svg
        className="agenda-seasonal-svg"
        viewBox="0 0 300 700"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={`${uid}-haze`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id={`${uid}-soft-blur`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>

          {/* 5-Lobe Maple Leaf Symbol */}
          <g id={`${uid}-maple-leaf`}>
            <path
              d="M0 6 L-2 1 L-7 2 L-5 -3 L-10 -7 L-5 -6 L-4 -11 L-1 -7 L1 -15 L3 -7 L6 -11 L5 -6 L10 -7 L5 -3 L7 2 L2 1 L0 6 Z"
              fill="currentColor"
            />
            <path d="M0 6 L0 -9 M0 -2 L-6 -5 M0 -1 L6 -5" stroke="#fef08a" strokeWidth="0.4" opacity="0.6" fill="none" />
          </g>

          {/* 5-Petal Cherry Blossom Symbol */}
          <g id={`${uid}-cherry-petal`}>
            <path d="M0 0 C-4 -3 -6 -9 -2 -11 C2 -12 4 -7 0 0 Z" fill="currentColor" opacity="0.9" />
          </g>

          {/* 4-Petal Forsythia Flower Symbol */}
          <g id={`${uid}-forsythia-petal`}>
            <ellipse cx="0" cy="-6" rx="2.5" ry="5.5" fill="currentColor" />
            <ellipse cx="0" cy="6" rx="2.5" ry="5.5" fill="currentColor" />
            <ellipse cx="-6" cy="0" rx="5.5" ry="2.5" fill="currentColor" />
            <ellipse cx="6" cy="0" rx="5.5" ry="2.5" fill="currentColor" />
            <circle cx="0" cy="0" r="1.5" fill="#ca8a04" />
          </g>

          {/* Hexagonal Snowflake Symbol */}
          <g id={`${uid}-snowflake`}>
            <circle cx="0" cy="0" r="1.6" fill="#ffffff" />
            <path d="M0 -5 L0 5 M-4.3 -2.5 L4.3 2.5 M-4.3 2.5 L4.3 -2.5" stroke="#ffffff" strokeWidth="0.75" strokeLinecap="round" opacity="0.9" />
          </g>
        </defs>

        {/* Ambient Floating Particles */}
        <g className="daily-ambient-particles">
          {particles.map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${p.scale})`} opacity={p.opacity}>
              {p.kind === 'snowflake' ? (
                <use href={symbol('snowflake')} />
              ) : p.kind === 'raindrop' ? (
                <path d="M0 -6 L-2 7" stroke="#b0d4de" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
              ) : p.kind === 'maple' ? (
                <use href={symbol('maple-leaf')} color={['#dc2626', '#ea580c', '#b91c1c', '#f59e0b'][i % 4]} />
              ) : p.kind === 'petal' ? (
                <use href={symbol('cherry-petal')} color={['#fbcfe8', '#f472b6', '#fce7f3', '#fda4af'][i % 4]} />
              ) : null}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
