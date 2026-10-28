import { formatDateKey, offsetDateKey } from '../../data/date';
import holidayData from './holidays/korea.json';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  allDay: boolean;
  start: string;
  end: string;
  notes: string;
  color?: CalendarEventColor;
}

export const EVENT_COLORS = [
  { id: 'default', label: '기본', value: 'var(--calendar-accent)' },
  { id: 'red', label: '빨강', value: '#e35454' },
  { id: 'orange', label: '주황', value: '#d58a2f' },
  { id: 'green', label: '초록', value: '#39a673' },
  { id: 'blue', label: '파랑', value: '#4b8ef0' },
  { id: 'pink', label: '분홍', value: '#d9639e' },
] as const;
export type CalendarEventColor = typeof EVENT_COLORS[number]['id'];

export const CALENDAR_MIN_DATE = '1900-01-01';
export const CALENDAR_MAX_DATE = '2100-12-31';
export const EVENT_TITLE_LIMIT = 120;
export const EVENT_NOTES_LIMIT = 4000;
export const DAY_PREVIEW_LIMIT = 2;
export const DEFAULT_EVENT_START = '09:00';
export const DEFAULT_EVENT_END = '10:00';
export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const DAYS_PER_WEEK = WEEKDAYS.length;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const HOLIDAYS: Record<string, Record<string, string[]>> = holidayData;
export const HOLIDAY_YEARS = Object.keys(HOLIDAYS);
export const CALENDAR_COPY = {
  add: '일정 추가', edit: '일정 수정', save: '저장', cancel: '취소', remove: '삭제',
  title: '제목', date: '날짜', allDay: '종일', start: '시작', end: '종료', notes: '메모',
  today: '오늘', previous: '이전 달', next: '다음 달', month: '월 선택',
  previousYear: '이전 해', nextYear: '다음 해', yearSelect: '연도 선택',
  empty: '아직 일정이 없어요',
  readError: '일정을 읽지 못했습니다. 기존 데이터를 보호하기 위해 편집을 잠갔습니다. 다시 불러오거나 저장 데이터를 확인해 주세요.',
  saveError: '저장하지 못했습니다. 저장 공간 또는 다른 창의 변경을 확인해 주세요. 입력한 내용은 유지됩니다.',
  conflict: '저장하지 못했습니다. 다른 창의 변경을 보호했습니다. 입력 내용을 새 일정으로 저장할 수 있습니다.',
  saveCopy: '새 일정으로 저장', copyHint: '다른 창에서 바뀐 일정은 그대로 두고 새 일정을 추가합니다.',
  reload: '다시 불러오기', discard: '저장하지 않은 변경이 있습니다.', discardAction: '변경 버리기', keepEditing: '계속 편집',
  deleteConfirm: '이 일정을 삭제할까요?', deleteAction: '일정 삭제',
  invalidTitle: '제목을 1~120자로 입력해 주세요.', invalidDate: '1900~2100년 사이의 올바른 날짜를 선택해 주세요.',
  invalidTime: '시작과 종료 시간을 확인해 주세요. 종료는 시작보다 늦어야 합니다.', invalidNotes: '메모는 4,000자까지 입력할 수 있습니다.',
  keyboard: '방향키 날짜 이동 · PgUp/PgDn 월 이동', unknownHolidays: '이 연도의 공휴일 데이터는 아직 제공되지 않습니다.',
  region: '개인 캘린더', agenda: '선택한 날짜의 일정', tagline: 'YOUR DAYS, AT A GLANCE', todayStamp: 'TODAY',
  titlePlaceholder: '어떤 하루를 계획하고 있나요?', notesPlaceholder: '기억해 둘 내용이 있다면',
  monthEvents: '이번 달 일정', coverage: '제공 범위', holiday: '공휴일', addToDate: '이 날짜에 추가', localNote: '나만의 일정, 이 기기에.',
};

export function localDate(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function validDate(key: string): boolean {
  return DATE_PATTERN.test(key) && key >= CALENDAR_MIN_DATE && key <= CALENDAR_MAX_DATE && formatDateKey(localDate(key)) === key;
}

export function moveMonth(key: string, delta: number): string {
  const date = localDate(key);
  const target = new Date(date.getFullYear(), date.getMonth() + delta, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return formatDateKey(target);
}

export function moveYear(key: string, delta: number): string {
  const date = localDate(key);
  const target = new Date(date.getFullYear() + delta, date.getMonth(), 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return formatDateKey(target);
}

export function monthDays(key: string): string[] {
  const date = localDate(key);
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const count = Math.ceil((first.getDay() + last.getDate()) / DAYS_PER_WEEK) * DAYS_PER_WEEK;
  const start = offsetDateKey(formatDateKey(first), -first.getDay());
  return Array.from({ length: count }, (_, i) => offsetDateKey(start, i));
}

const HOLIDAY_LABELS: Record<string, string> = {
  '1월 1일': '신년',
  '기독탄신일': '크리스마스',
  '대체공휴일(기독탄신일)': '대체공휴일(크리스마스)',
};

export function holidaysFor(key: string): string[] {
  return (HOLIDAYS[key.slice(0, 4)]?.[key] ?? []).map(name => HOLIDAY_LABELS[name] ?? name);
}
export function holidayYearAvailable(key: string): boolean { return Object.hasOwn(HOLIDAYS, key.slice(0, 4)); }

export function validateEvent(event: CalendarEvent): string {
  if (!event.title.trim() || event.title.length > EVENT_TITLE_LIMIT) return CALENDAR_COPY.invalidTitle;
  if (!validDate(event.date)) return CALENDAR_COPY.invalidDate;
  if (!event.allDay && (!TIME_PATTERN.test(event.start) || !TIME_PATTERN.test(event.end) || event.end <= event.start)) return CALENDAR_COPY.invalidTime;
  if (event.notes.length > EVENT_NOTES_LIMIT) return CALENDAR_COPY.invalidNotes;
  if (event.color !== undefined && !EVENT_COLORS.some(color => color.id === event.color)) return '일정 색상을 확인해 주세요.';
  return '';
}

export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date) || Number(b.allDay) - Number(a.allDay) || a.start.localeCompare(b.start) || a.title.localeCompare(b.title, 'ko'));
}

export function newEvent(date: string): CalendarEvent {
  return { id: crypto.randomUUID(), title: '', date, allDay: true, start: DEFAULT_EVENT_START, end: DEFAULT_EVENT_END, notes: '' };
}

export interface UpcomingItem {
  id: string;
  date: string;
  title: string;
  type: 'holiday' | 'event';
  dDay: string;
}

export function calculateDDay(targetKey: string, todayKey: string): string {
  const t = localDate(targetKey).getTime();
  const now = localDate(todayKey).getTime();
  const diffDays = Math.round((t - now) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'D-Day';
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${-diffDays}`;
}

export const UPCOMING_MONTHS = 3;

export function getUpcomingHighlights(todayKey: string, events: CalendarEvent[]): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  const end = moveMonth(todayKey, UPCOMING_MONTHS);
  const years = new Set([todayKey.slice(0, 4), end.slice(0, 4)]);

  for (const year of years) {
    for (const date of Object.keys(HOLIDAYS[year] ?? {})) {
      if (date >= todayKey && date <= end) {
        items.push({
          id: `h-${date}`,
          date,
          title: holidaysFor(date).join(', '),
          type: 'holiday',
          dDay: calculateDDay(date, todayKey),
        });
      }
    }
  }

  for (const ev of events) {
    if (ev.date >= todayKey && ev.date <= end) {
      items.push({
        id: ev.id,
        date: ev.date,
        title: ev.title,
        type: 'event',
        dDay: calculateDDay(ev.date, todayKey),
      });
    }
  }

  return items.sort((a, b) => a.date.localeCompare(b.date));
}

export interface WeekLoad {
  weekNum: number;
  label: string;
  count: number;
}

export function getWeeklyLoad(days: string[], events: CalendarEvent[]): WeekLoad[] {
  const weeksCount = days.length / DAYS_PER_WEEK;
  const result: WeekLoad[] = [];

  for (let w = 0; w < weeksCount; w++) {
    const weekDays = days.slice(w * DAYS_PER_WEEK, (w + 1) * DAYS_PER_WEEK);
    const count = events.filter(e => weekDays.includes(e.date)).length;
    const startNum = Number(weekDays[0].slice(-2));
    const endNum = Number(weekDays[6].slice(-2));
    result.push({
      weekNum: w + 1,
      label: `${w + 1}주차 (${startNum}일~${endNum}일)`,
      count,
    });
  }

  return result;
}
