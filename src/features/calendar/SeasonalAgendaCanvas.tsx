import { useState } from 'react';
import type { SeasonalDailyState } from './seasonalCanvas';

export function SeasonalAgendaCanvas({ state }: { state: SeasonalDailyState }) {
  const { season, landscapeId } = state;
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
    </div>
  );
}
