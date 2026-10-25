export type TimePeriod = 'dawn' | 'morning' | 'afternoon' | 'sunset' | 'night';

const HOURS_PER_DAY = 24;
const PERIOD_START = { dawn: 4, morning: 6, afternoon: 12, sunset: 16, night: 19 };
const PERIOD_COPY: Record<TimePeriod, { periodLabel: string; greeting: string }> = {
  dawn: { periodLabel: '새벽', greeting: '새벽이 밝아옵니다' },
  morning: { periodLabel: '오전', greeting: '좋은 아침입니다' },
  afternoon: { periodLabel: '오후', greeting: '좋은 오후입니다' },
  sunset: { periodLabel: '저녁', greeting: '좋은 저녁입니다' },
  night: { periodLabel: '밤', greeting: '좋은 밤입니다' },
};

export interface CelestialState {
  period: TimePeriod;
  periodLabel: string;
  greeting: string;
  isSun: boolean;
  progress: number;
  celestialX: number;
  celestialY: number;
  arcStartX: number;
  arcEndX: number;
  arcApexY: number;
  arcBaseY: number;
}

export function getCelestialState(date: Date = new Date()): CelestialState {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const timeVal = hour + minute / 60;

  const period: TimePeriod = timeVal < PERIOD_START.dawn ? 'night'
    : timeVal < PERIOD_START.morning ? 'dawn'
    : timeVal < PERIOD_START.afternoon ? 'morning'
    : timeVal < PERIOD_START.sunset ? 'afternoon'
    : timeVal < PERIOD_START.night ? 'sunset' : 'night';
  const { periodLabel, greeting } = PERIOD_COPY[period];
  const isSun = timeVal >= PERIOD_START.morning && timeVal < PERIOD_START.night;
  const dayLength = PERIOD_START.night - PERIOD_START.morning;
  const nightElapsed = (timeVal - PERIOD_START.night + HOURS_PER_DAY) % HOURS_PER_DAY;
  const progress = isSun
    ? (timeVal - PERIOD_START.morning) / dayLength
    : nightElapsed / (HOURS_PER_DAY - dayLength);

  // Clamped progress between 0.12 and 0.88 for optimal visual positioning over the mountains
  const clamped = Math.max(0.12, Math.min(0.88, progress));

  // Parabolic trajectory across right half of hero banner (viewBox 0 0 1000 200)
  // Arc apex at y: 46 floats gracefully above the mountain valley saddle (y: 110-120)
  const arcStartX = 410;
  const arcEndX = 930;
  const arcApexY = 46;
  const arcBaseY = 135;

  const celestialX = arcStartX + (arcEndX - arcStartX) * clamped;
  const tRel = clamped - 0.5;
  const celestialY = arcApexY + 4 * (arcBaseY - arcApexY) * (tRel * tRel);

  return {
    period,
    periodLabel,
    greeting,
    isSun,
    progress,
    celestialX,
    celestialY,
    arcStartX,
    arcEndX,
    arcApexY,
    arcBaseY,
  };
}
