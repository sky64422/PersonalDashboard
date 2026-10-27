import type { CelestialState } from './celestial';

const QUIET_STARS = [
  { x: 440, y: 28, r: 1.4, op: 0.65 },
  { x: 510, y: 18, r: 1.6, op: 0.75 },
  { x: 580, y: 32, r: 1.2, op: 0.5 },
  { x: 660, y: 20, r: 1.8, op: 0.85 },
  { x: 740, y: 34, r: 1.3, op: 0.55 },
  { x: 840, y: 18, r: 1.7, op: 0.8 },
  { x: 920, y: 28, r: 1.4, op: 0.55 },
];

export function FairyTaleSky({
  state,
  viewBox = '0 0 1000 200',
  className = '',
}: {
  state: CelestialState;
  viewBox?: string;
  className?: string;
}) {
  const { period, isSun, celestialX, celestialY } = state;

  const showStars = period === 'night' || period === 'dawn';

  return (
    <div className={`hero-sky-ambient period-${period} hero-graphic-image ${className}`} aria-hidden="true">
      <svg
        className="fairy-sky-canvas"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="skySunsetMuted" x1="0%" y1="0%" x2="15%" y2="100%">
            <stop offset="0%" stopColor="var(--sky-sunset-top)" />
            <stop offset="48%" stopColor="var(--sky-sunset-rose)" />
            <stop offset="82%" stopColor="var(--sky-sunset-peach)" />
            <stop offset="100%" stopColor="var(--sky-sunset-horizon)" />
          </linearGradient>
          <linearGradient id="mtnSunsetSlope" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--mtn-sunset-mid)" />
            <stop offset="100%" stopColor="var(--mtn-sunset-fore)" />
          </linearGradient>
          <radialGradient id="dawnMist">
            <stop offset="0%" stopColor="#bfdde5" stopOpacity=".48" />
            <stop offset="55%" stopColor="#9dbfcf" stopOpacity=".18" />
            <stop offset="100%" stopColor="#8baac4" stopOpacity="0" />
          </radialGradient>
          {/* Dawn Sky & Mountain Gradients */}
          <linearGradient id="skyDawnMuted" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--sky-dawn-1)" stopOpacity="0.85" />
            <stop offset="45%" stopColor="var(--sky-dawn-2)" stopOpacity="0.9" />
            <stop offset="80%" stopColor="var(--sky-dawn-3)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--sky-dawn-4)" />
          </linearGradient>
          <linearGradient id="mtnDawnSlope" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--mtn-dawn-mid)" stopOpacity="0.96" />
            <stop offset="55%" stopColor="var(--mtn-dawn-fore)" />
            <stop offset="100%" stopColor="var(--sky-dawn-1)" />
          </linearGradient>

          {/* Morning Sky & Mountain Gradients */}
          <linearGradient id="skyMorningMuted" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--sky-morn-1)" stopOpacity="0.8" />
            <stop offset="45%" stopColor="var(--sky-morn-2)" stopOpacity="0.88" />
            <stop offset="80%" stopColor="var(--sky-morn-3)" stopOpacity="0.92" />
            <stop offset="100%" stopColor="var(--sky-morn-4)" />
          </linearGradient>
          <linearGradient id="mtnMorningSlope" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--mtn-morn-mid)" stopOpacity="0.96" />
            <stop offset="55%" stopColor="var(--mtn-morn-fore)" />
            <stop offset="100%" stopColor="var(--sky-morn-1)" />
          </linearGradient>

          {/* Afternoon Sky & Mountain Gradients */}
          <linearGradient id="skyAfternoonMuted" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--sky-noon-1)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="var(--sky-noon-2)" stopOpacity="0.88" />
            <stop offset="85%" stopColor="var(--sky-noon-3)" stopOpacity="0.92" />
            <stop offset="100%" stopColor="var(--sky-noon-4)" />
          </linearGradient>
          <linearGradient id="mtnAfternoonSlope" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--mtn-noon-mid)" stopOpacity="0.96" />
            <stop offset="55%" stopColor="var(--mtn-noon-fore)" />
            <stop offset="100%" stopColor="var(--sky-noon-1)" />
          </linearGradient>

          {/* Night Sky & Mountain Gradients (Soft, Dreamy, Melting Into Dark Background) */}
          <linearGradient id="skyNightMuted" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--sky-night-1)" stopOpacity="0.85" />
            <stop offset="45%" stopColor="var(--sky-night-2)" stopOpacity="0.9" />
            <stop offset="80%" stopColor="var(--sky-night-3)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--sky-night-4)" />
          </linearGradient>
          <linearGradient id="mtnNightSlope" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--mtn-night-mid)" stopOpacity="0.75" />
            <stop offset="50%" stopColor="var(--mtn-night-fore)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--sky-night-1)" stopOpacity="0.22" />
          </linearGradient>

          {/* Soft Mountain Shadow Facet Gradient */}
          <linearGradient id="mtnFacetShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#090e18" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#090e18" stopOpacity="0.04" />
          </linearGradient>

          {/* Mountain Ridge Crest Light Highlight */}
          <linearGradient id="mtnRidgeHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.04" />
            <stop offset="25%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="55%" stopColor="#cce4ff" stopOpacity="0.45" />
            <stop offset="80%" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
          </linearGradient>

          {/* CELESTIAL MOON GRADIENTS (Soft Atmospheric Bloom + Crisp Crescent) */}
          <radialGradient id="moonAtmosphericBloom" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="35%" stopColor="#e2ecfb" stopOpacity="0.22" />
            <stop offset="70%" stopColor="#c7d9f2" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#93b4e6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="moonMidGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#edf4fc" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#dce8f8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="moonCoreGradient" x1="20%" y1="10%" x2="80%" y2="90%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f5f8fd" />
            <stop offset="100%" stopColor="#d2e0f4" />
          </linearGradient>

          {/* CELESTIAL SUN GRADIENTS (Warm Radiant Bloom) */}
          <radialGradient id="sunOuterAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffae0" stopOpacity="0.65" />
            <stop offset="45%" stopColor="#fed7aa" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sunCoreGradient" cx="38%" cy="35%" r="62%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#fffbeb" />
            <stop offset="85%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
        </defs>

        {/* 1. Muted Sky Base */}
        <rect
          width="1000"
          height="200"
          fill={
            period === 'dawn'
              ? 'url(#skyDawnMuted)'
              : period === 'morning'
              ? 'url(#skyMorningMuted)'
              : period === 'afternoon'
              ? 'url(#skyAfternoonMuted)'
              : period === 'sunset'
              ? 'url(#skySunsetMuted)'
              : 'url(#skyNightMuted)'
          }
        />

        {/* 2. Quiet, Subtle Stars (Night & Dawn) */}
        {showStars && (
          <g className="quiet-stars-group">
            {QUIET_STARS.map((star, idx) => (
              <g key={idx} transform={`translate(${star.x}, ${star.y})`}>
                <circle cx={0} cy={0} r={star.r} fill="#ffffff" opacity={star.op} />
                <line x1={-star.r * 1.5} y1={0} x2={star.r * 1.5} y2={0} stroke="#ffffff" strokeWidth="0.5" opacity={star.op * 0.7} />
                <line x1={0} y1={-star.r * 1.5} x2={0} y2={star.r * 1.5} stroke="#ffffff" strokeWidth="0.5" opacity={star.op * 0.7} />
              </g>
            ))}
          </g>
        )}

        {/* 3. BALANCED CELESTIAL BODY (Unobstructed in Open Sky above the saddle) */}
        <g
          className="celestial-body"
          transform={`translate(${celestialX}, ${celestialY})`}
        >
          {isSun ? (
            /* Refined Sun */
            <g className="balanced-sun">
              <circle cx={0} cy={0} r={52} fill="url(#sunOuterAura)" />
              {/* Soft radial sunbeams */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                <line
                  key={deg}
                  x1={0}
                  y1={-20}
                  x2={0}
                  y2={-27}
                  stroke="#fbbf24"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  opacity="0.6"
                  transform={`rotate(${deg})`}
                />
              ))}
              <circle
                cx={0}
                cy={0}
                r={16}
                fill="url(#sunCoreGradient)"
                filter="drop-shadow(0 0 10px rgba(251, 191, 36, 0.65))"
              />
            </g>
          ) : (
            /* Refined Moon with Atmospheric Bloom (1.2x Enhanced Scale) */
            <g className="balanced-moon">
              {/* Wide Soft Bloom */}
              <circle cx={0} cy={0} r={54} fill="url(#moonAtmosphericBloom)" />
              {/* Middle Glow */}
              <circle cx={0} cy={0} r={31} fill="url(#moonMidGlow)" />
              {/* Crisp 36px crescent moon (1.2x scale) */}
              <path
                d="M -4 -18 A 19.5 19.5 0 1 1 -4 18 A 15 15 0 1 0 -4 -18 Z"
                fill="url(#moonCoreGradient)"
                filter="drop-shadow(0 0 12px rgba(226, 238, 255, 0.9))"
              />
              <circle cx={5} cy={-2} r={1.9} fill="#94a3b8" opacity="0.3" />
              <circle cx={10} cy={3} r={1.4} fill="#94a3b8" opacity="0.25" />
            </g>
          )}
        </g>

        {/* 4. REFINED FAIRY-TALE MOUNTAIN RANGE (2~3 Smooth Majestic Ridges & Natural Saddle) */}
        <g className="mountain-shaded-group">
          {/* Main Mountain Silhouette: Lowered, Scenic Ridges Grounded to Base */}
          <path
            d="M 240,200 C 320,195 380,180 430,155 C 460,138 480,118 505,115 C 540,115 580,138 640,150 C 680,150 715,142 745,125 C 770,110 785,96 805,95 C 830,95 860,118 890,122 C 915,124 935,118 955,126 C 975,132 990,136 1000,138 L 1000,200 Z"
            fill={
              period === 'dawn'
                ? 'url(#mtnDawnSlope)'
                : period === 'morning'
                ? 'url(#mtnMorningSlope)'
                : period === 'afternoon'
                ? 'url(#mtnAfternoonSlope)'
                : period === 'sunset'
                ? 'url(#mtnSunsetSlope)'
                : 'url(#mtnNightSlope)'
            }
          />

          {/* Soft Mountain Facet Shadows (Gentle Depth on Slope) */}
          {/* Flank shadow of West Peak (Summit 1) */}
          <path
            d="M 505,115 C 540,115 580,138 640,150 L 600,175 L 530,200 L 480,200 L 505,115 Z"
            fill="url(#mtnFacetShadow)"
          />
          {/* Flank shadow of Main Summit (Summit 2) */}
          <path
            d="M 805,95 C 830,95 860,118 890,122 L 870,165 L 810,200 L 760,200 L 760,150 L 805,95 Z"
            fill="url(#mtnFacetShadow)"
          />

          {/* Smooth Crestline Light Highlight along Mountain Ridges */}
          <path
            d="M 240,200 C 320,195 380,180 430,155 C 460,138 480,118 505,115 C 540,115 580,138 640,150 C 680,150 715,142 745,125 C 770,110 785,96 805,95 C 830,95 860,118 890,122 C 915,124 935,118 955,126 C 975,132 990,136 1000,138"
            fill="none"
            stroke="url(#mtnRidgeHighlight)"
            strokeWidth="1.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.6"
          />
        </g>
        {period === 'dawn' && (
          <g className="dawn-mist">
            <ellipse cx="680" cy="151" rx="330" ry="45" fill="url(#dawnMist)" />
            <ellipse cx="890" cy="115" rx="240" ry="32" fill="url(#dawnMist)" />
          </g>
        )}
      </svg>
    </div>
  );
}
