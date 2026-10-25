import { describe, expect, it } from 'vitest';
import { getCelestialState } from '../src/features/overview/FairyTaleSky';

describe('Overview time periods', () => {
  it.each([
    [0, 0, 'night', false], [3, 59, 'night', false],
    [4, 0, 'dawn', false], [5, 59, 'dawn', false],
    [6, 0, 'morning', true], [11, 59, 'morning', true],
    [12, 0, 'afternoon', true], [15, 59, 'afternoon', true],
    [16, 0, 'sunset', true], [18, 59, 'sunset', true],
    [19, 0, 'night', false], [23, 59, 'night', false],
  ] as const)('%i:%i is %s', (hour, minute, period, isSun) => {
    const state = getCelestialState(new Date(2026, 9, 25, hour, minute));
    expect(state.period).toBe(period);
    expect(state.isSun).toBe(isSun);
    expect(state.progress).toBeGreaterThanOrEqual(0);
    expect(state.progress).toBeLessThanOrEqual(1);
  });

  it('keeps the moon moving forward across midnight', () => {
    const before = getCelestialState(new Date(2026, 9, 25, 23, 59));
    const after = getCelestialState(new Date(2026, 9, 26, 0, 0));
    expect(after.celestialX).toBeGreaterThan(before.celestialX);
    expect(after.celestialX - before.celestialX).toBeLessThan(1);
  });
});
