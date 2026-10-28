export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type LandscapeId =
  | 'spring-blossom-tunnel' // 봄 1: 화사한 벚꽃 터널과 햇살
  | 'summer-rain-temple' // 여름 1: 청량한 에메랄드빛 여름 바다
  | 'autumn-reed-ridge' // 가을 1: 노을빛 가을 호수
  | 'winter-snow-mountain'; // 겨울 1: 새벽 설산과 침엽수림

export interface LandscapeDef {
  id: LandscapeId;
  name: string;
  season: Season;
  description: string;
}

export const LANDSCAPE_DEFS: Record<LandscapeId, LandscapeDef> = {
  'spring-blossom-tunnel': {
    id: 'spring-blossom-tunnel',
    name: '화사한 벚꽃 터널과 햇살',
    season: 'spring',
    description: '따사로운 아침 햇살이 쏟아져 내리는 만개한 벚꽃 터널',
  },
  'summer-rain-temple': {
    id: 'summer-rain-temple',
    name: '청량한 에메랄드빛 여름 바다',
    season: 'summer',
    description: '햇살 아래 부서지는 하얀 파도와 에메랄드빛 해변',
  },
  'autumn-reed-ridge': {
    id: 'autumn-reed-ridge',
    name: '노을빛 가을 호수',
    season: 'autumn',
    description: '황혼의 노을을 머금은 잔잔한 호수 수면과 산등성이',
  },
  'winter-snow-mountain': {
    id: 'winter-snow-mountain',
    name: '새벽 설산과 침엽수림',
    season: 'winter',
    description: '새벽빛을 받은 웅장한 설산 봉우리와 푸른 숲',
  },
};

export const ROUND_ROBIN_LANDSCAPES: LandscapeId[] = [
  'spring-blossom-tunnel',
  'summer-rain-temple',
  'autumn-reed-ridge',
  'winter-snow-mountain',
];

export const ROUND_ROBIN_INTERVAL_MS = 10 * 1000;

export function getRoundRobinLandscape(timestampMs: number = Date.now()): LandscapeId {
  const slot = Math.floor(timestampMs / ROUND_ROBIN_INTERVAL_MS);
  const index = ((slot % ROUND_ROBIN_LANDSCAPES.length) + ROUND_ROBIN_LANDSCAPES.length) % ROUND_ROBIN_LANDSCAPES.length;
  return ROUND_ROBIN_LANDSCAPES[index];
}

export const SEASON_LANDSCAPES: Record<Season, LandscapeId[]> = {
  spring: ['spring-blossom-tunnel'],
  summer: ['summer-rain-temple'],
  autumn: ['autumn-reed-ridge'],
  winter: ['winter-snow-mountain'],
};

export interface SeasonalDailyState {
  season: Season;
  landscapeId: LandscapeId;
  month: number;
  day: number;
  seed: number;
  particles: Array<{
    x: number;
    y: number;
    r: number;
    opacity: number;
    rot: number;
    scale: number;
    kind: 'maple' | 'snowflake' | 'raindrop' | 'petal';
  }>;
}

export function getSeasonForDate(dateStr: string): Season {
  const parts = dateStr.split('-');
  const month = Number(parts[1] ?? '10');
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function pseudoRandom(seed: number) {
  const s = Math.sin(seed) * 10000;
  return s - Math.floor(s);
}

export function getSeasonalDailyState(
  dateStr: string,
  manualLandscapeId?: LandscapeId,
  timestampMs: number = Date.now()
): SeasonalDailyState {
  const parts = dateStr.split('-');
  const year = Number(parts[0] ?? '2026');
  const month = Number(parts[1] ?? '10');
  const day = Number(parts[2] ?? '26');

  const seed = Math.abs(year * 372 + month * 31 + day);
  const landscapeId = manualLandscapeId ?? getRoundRobinLandscape(timestampMs);
  const season = LANDSCAPE_DEFS[landscapeId].season;

  // 10 floating ambient particles drifting in unique formation for each day
  const particleCount = 10;
  const particles = Array.from({ length: particleCount }, (_, idx) => {
    const pSeed = seed * 23 + idx * 47;
    const r1 = pseudoRandom(pSeed);
    const r2 = pseudoRandom(pSeed + 1);
    const r3 = pseudoRandom(pSeed + 2);
    const r4 = pseudoRandom(pSeed + 3);

    let kind: SeasonalDailyState['particles'][number]['kind'];
    if (landscapeId === 'autumn-reed-ridge') {
      kind = 'maple';
    } else if (landscapeId === 'winter-snow-mountain') {
      kind = 'snowflake';
    } else if (landscapeId === 'summer-rain-temple') {
      kind = 'raindrop';
    } else {
      kind = 'petal';
    }

    return {
      x: 20 + r1 * 260, // spread across 300px width
      y: 140 + r2 * 450, // floating through middle-lower canvas
      r: 2 + r3 * 3.5,
      opacity: 0.35 + r4 * 0.45,
      rot: r1 * 360,
      scale: 0.75 + r2 * 0.5,
      kind,
    };
  });

  return {
    season,
    landscapeId,
    month,
    day,
    seed,
    particles,
  };
}
