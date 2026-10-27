import { CALENDAR_COPY, validateEvent, type CalendarEvent } from './calendarModel';

export const CALENDAR_STORAGE_KEY = 'friday.calendar.v1';
const STORAGE_VERSION = 1;
export class CalendarConflictError extends Error {}
type Reader = Pick<Storage, 'getItem'>;
type Writer = Pick<Storage, 'getItem' | 'setItem'>;
export interface CalendarSnapshot { events: CalendarEvent[]; raw: string | null; error: string; }

function isEvent(value: unknown): value is CalendarEvent {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  return ['id', 'title', 'date', 'start', 'end', 'notes'].every(key => typeof e[key] === 'string') &&
    typeof e.allDay === 'boolean' && !!e.id && !validateEvent(value as CalendarEvent);
}

export function readCalendar(storage?: Reader): CalendarSnapshot {
  try {
    const raw = (storage ?? localStorage).getItem(CALENDAR_STORAGE_KEY);
    if (raw === null) return { events: [], raw, error: '' };
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') throw Error('Invalid calendar document');
    const payload = data as { version?: unknown; events?: unknown };
    if (payload.version !== STORAGE_VERSION || !Array.isArray(payload.events) || !payload.events.every(isEvent) ||
        new Set(payload.events.map(e => e.id)).size !== payload.events.length) throw Error('Invalid calendar records');
    return { events: payload.events, raw, error: '' };
  } catch {
    return { events: [], raw: null, error: CALENDAR_COPY.readError };
  }
}

/** Compare before writing so a second app window cannot silently overwrite a newer snapshot. */
export function writeCalendar(storage: Writer | undefined, events: CalendarEvent[], expectedRaw: string | null): string {
  const target = storage ?? localStorage;
  if (target.getItem(CALENDAR_STORAGE_KEY) !== expectedRaw) throw new CalendarConflictError(CALENDAR_COPY.conflict);
  const raw = JSON.stringify({ version: STORAGE_VERSION, events });
  target.setItem(CALENDAR_STORAGE_KEY, raw);
  return raw;
}

/** All app windows use the same origin lock, including the check and the synchronous write. */
export async function saveCalendar(events: CalendarEvent[], expectedRaw: string | null): Promise<string> {
  return navigator.locks.request(CALENDAR_STORAGE_KEY, () => writeCalendar(undefined, events, expectedRaw));
}
