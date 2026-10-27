import { describe, expect, it } from 'vitest';
import { monthDays, moveMonth, validateEvent, holidaysFor, holidayYearAvailable } from '../src/features/calendar/calendarModel';
import { readCalendar, writeCalendar } from '../src/features/calendar/calendarStorage';
import { getSeasonForDate, getSeasonalDailyState, SEASON_LANDSCAPES, ROUND_ROBIN_LANDSCAPES, getRoundRobinLandscape, ROUND_ROBIN_INTERVAL_MS } from '../src/features/calendar/seasonalCanvas';

const event = { id: 'one', title: '회의', date: '2026-10-26', allDay: false, start: '09:00', end: '10:00', notes: '' };
function memory(raw: string | null = null) {
  return { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } };
}
describe('calendar dates and events', () => {
  it('includes leap day and complete weeks without UTC date drift', () => {
    const days = monthDays('2024-02-01');
    expect(days[0]).toBe('2024-01-28');
    expect(days).toContain('2024-02-29');
    expect(days.at(-1)).toBe('2024-03-02');
  });
  it('clamps month-end navigation and crosses years', () => {
    expect(moveMonth('2024-01-31', 1)).toBe('2024-02-29');
    expect(moveMonth('2026-12-31', 1)).toBe('2027-01-31');
  });
  it('rejects impossible dates, empty titles and reversed or malformed times', () => {
    expect(validateEvent(event)).toBe('');
    for (const patch of [{ date: '2026-02-30' }, { title: '  ' }, { end: '08:59' }, { start: '25:00' }]) {
      expect(validateEvent({ ...event, ...patch })).not.toBe('');
    }
    expect(validateEvent({ ...event, allDay: true, start: '', end: '' })).toBe('');
  });
  it('provides substitute and overlapping holidays and distinguishes unknown years', () => {
    expect(holidaysFor('2025-05-05')).toEqual(['어린이날', '부처님 오신 날']);
    expect(holidaysFor('2026-03-02').join()).toContain('대체공휴일');
    expect(holidayYearAvailable('2035-01-01')).toBe(false);
  });
});
describe('calendar persistence', () => {
  it('round trips events and does not populate fake schedules', () => {
    const storage = memory();
    expect(readCalendar(storage).events).toEqual([]);
    writeCalendar(storage, [event], null);
    expect(readCalendar(storage).events).toEqual([event]);
  });
  it('blocks malformed records rather than silently replacing them', () => {
    for (const raw of ['{', '{}', JSON.stringify({ version: 1, events: [{ ...event, date: '2026-02-30' }] }), JSON.stringify({ version: 1, events: [event, event] })]) {
      const storage = memory(raw);
      expect(readCalendar(storage).error).not.toBe('');
      expect(storage.getItem()).toBe(raw);
    }
  });
  it('rejects stale writes and keeps the latest stored record', () => {
    const storage = memory();
    writeCalendar(storage, [event], null);
    expect(() => writeCalendar(storage, [], null)).toThrow();
    expect(readCalendar(storage).events).toEqual([event]);
  });
  it('surfaces unavailable storage and quota failures', () => {
    expect(readCalendar({ getItem: () => { throw Error('denied'); } }).error).not.toBe('');
    expect(() => writeCalendar({ getItem: () => null, setItem: () => { throw Error('quota'); } }, [event], null)).toThrow();
  });
});

describe('seasonal living landscapes and 30-min round robin', () => {
  it('has exactly 4 curated landscapes (one per season)', () => {
    expect(ROUND_ROBIN_LANDSCAPES).toHaveLength(4);
    expect(ROUND_ROBIN_LANDSCAPES).toEqual([
      'spring-blossom-tunnel',
      'summer-rain-temple',
      'autumn-reed-ridge',
      'winter-snow-mountain',
    ]);
    expect(SEASON_LANDSCAPES.spring).toEqual(['spring-blossom-tunnel']);
    expect(SEASON_LANDSCAPES.summer).toEqual(['summer-rain-temple']);
    expect(SEASON_LANDSCAPES.autumn).toEqual(['autumn-reed-ridge']);
    expect(SEASON_LANDSCAPES.winter).toEqual(['winter-snow-mountain']);
  });

  it('rotates through the 4 landscapes in a round-robin cycle every 30 minutes', () => {
    const base = 0; // 0ms = slot 0
    expect(getRoundRobinLandscape(base)).toBe('spring-blossom-tunnel');
    expect(getRoundRobinLandscape(base + ROUND_ROBIN_INTERVAL_MS)).toBe('summer-rain-temple');
    expect(getRoundRobinLandscape(base + ROUND_ROBIN_INTERVAL_MS * 2)).toBe('autumn-reed-ridge');
    expect(getRoundRobinLandscape(base + ROUND_ROBIN_INTERVAL_MS * 3)).toBe('winter-snow-mountain');
    expect(getRoundRobinLandscape(base + ROUND_ROBIN_INTERVAL_MS * 4)).toBe('spring-blossom-tunnel');
  });

  it('aligns test timestamp (2026-10-26T12:00:00+09:00) with autumn-reed-ridge', () => {
    const fixedTime = new Date('2026-10-26T12:00:00+09:00').getTime();
    expect(getRoundRobinLandscape(fixedTime)).toBe('autumn-reed-ridge');
    const state = getSeasonalDailyState('2026-10-26', undefined, fixedTime);
    expect(state.season).toBe('autumn');
    expect(state.landscapeId).toBe('autumn-reed-ridge');
    expect(state.particles.length).toBe(10);
    expect(state.particles.every(p => p.kind === 'maple')).toBe(true);
  });

  it('identifies 4 seasons accurately by month', () => {
    expect(getSeasonForDate('2026-03-15')).toBe('spring');
    expect(getSeasonForDate('2026-05-31')).toBe('spring');
    expect(getSeasonForDate('2026-06-01')).toBe('summer');
    expect(getSeasonForDate('2026-08-15')).toBe('summer');
    expect(getSeasonForDate('2026-09-01')).toBe('autumn');
    expect(getSeasonForDate('2026-10-26')).toBe('autumn');
    expect(getSeasonForDate('2026-11-30')).toBe('autumn');
    expect(getSeasonForDate('2026-12-01')).toBe('winter');
    expect(getSeasonForDate('2027-01-15')).toBe('winter');
    expect(getSeasonForDate('2027-02-28')).toBe('winter');
  });

  it('manual landscape selection overrides round robin and produces matching particles', () => {
    const fixedTime = new Date('2026-10-26T12:00:00+09:00').getTime();
    const snow = getSeasonalDailyState('2026-10-26', 'winter-snow-mountain', fixedTime);
    expect(snow.season).toBe('winter');
    expect(snow.landscapeId).toBe('winter-snow-mountain');
    expect(snow.particles.every(p => p.kind === 'snowflake')).toBe(true);

    const sea = getSeasonalDailyState('2026-10-26', 'summer-rain-temple', fixedTime);
    expect(sea.season).toBe('summer');
    expect(sea.landscapeId).toBe('summer-rain-temple');
    expect(sea.particles.every(p => p.kind === 'raindrop')).toBe(true);

    const blossom = getSeasonalDailyState('2026-10-26', 'spring-blossom-tunnel', fixedTime);
    expect(blossom.season).toBe('spring');
    expect(blossom.landscapeId).toBe('spring-blossom-tunnel');
    expect(blossom.particles.every(p => p.kind === 'petal')).toBe(true);
  });
});
