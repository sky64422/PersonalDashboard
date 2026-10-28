import { ROUND_ROBIN_LANDSCAPES, type SeasonalDailyState } from './seasonalCanvas';

export function SeasonalAgendaCanvas({ state }: { state: SeasonalDailyState }) {
  const { season, landscapeId } = state;

  return (
    <div className={`agenda-seasonal-backdrop season-${season} landscape-${landscapeId}`} aria-hidden="true">
      {ROUND_ROBIN_LANDSCAPES.map(id => (
        <img
          key={id}
          src={`/assets/calendar/${id}.jpg`}
          alt=""
          className={`agenda-seasonal-photo ${id === landscapeId ? 'is-active' : ''}`}
          loading="eager"
          decoding="sync"
          onError={event => { event.currentTarget.style.visibility = 'hidden'; }}
        />
      ))}

      {/* 2. Frosted Convex Glass Overlay for Schedule Contrast & Lyrical Mood */}
      <div className="agenda-seasonal-glass-overlay" />
    </div>
  );
}
