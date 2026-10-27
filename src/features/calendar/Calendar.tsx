import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { ArrowUpRight, BarChart3, Bookmark, CalendarDays, ChevronLeft, ChevronRight, Pin, Plus, Sparkles } from 'lucide-react';
import { formatDateKey, offsetDateKey } from '../../data/date';
import {
  CALENDAR_COPY as C,
  CALENDAR_MIN_DATE,
  CALENDAR_MAX_DATE,
  DAY_PREVIEW_LIMIT,
  HOLIDAY_YEARS,
  WEEKDAYS,
  holidaysFor,
  holidayYearAvailable,
  localDate,
  monthDays,
  moveMonth,
  newEvent,
  sortEvents,
  validDate,
  getUpcomingHighlights,
  getWeeklyLoad,
  type CalendarEvent,
} from './calendarModel';
import { readCalendar, saveCalendar } from './calendarStorage';
import { EventEditor } from './EventEditor';
import { SeasonalAgendaCanvas } from './SeasonalAgendaCanvas';
import { getSeasonalDailyState, LANDSCAPE_DEFS, ROUND_ROBIN_LANDSCAPES, type LandscapeId } from './seasonalCanvas';
import './calendar.css';

const MONTH_NAME = new Intl.DateTimeFormat('en-US', { month: 'long' });
const FULL_DATE = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
const WEEK_LENGTH = WEEKDAYS.length;
const LANDSCAPES = ROUND_ROBIN_LANDSCAPES.map(id => LANDSCAPE_DEFS[id]);
const LANDSCAPE_COPY = { previous: '이전 배경', next: '다음 배경', label: '캘린더 배경 선택' };

const WEEKDAY_HEADERS = [
  { ko: '일', en: 'SUN', isSunday: true },
  { ko: '월', en: 'MON' },
  { ko: '화', en: 'TUE' },
  { ko: '수', en: 'WED' },
  { ko: '목', en: 'THU' },
  { ko: '금', en: 'FRI' },
  { ko: '토', en: 'SAT', isSaturday: true },
];


export function Calendar() {
  const today = formatDateKey();
  const [selected, setSelected] = useState(today);
  const [snapshot, setSnapshot] = useState(() => readCalendar());
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const focusDate = useRef<string | null>(null);
  const month = selected.slice(0, 7);
  const date = localDate(selected);
  const days = useMemo(() => monthDays(selected), [selected]);
  const [now, setNow] = useState(() => Date.now());
  const [selectedLandscape, setSelectedLandscape] = useState<LandscapeId>();

  // 30-minute interval round robin ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10 * 1000);
    return () => clearInterval(timer);
  }, []);

  const seasonal = useMemo(
    () => getSeasonalDailyState(selected, selectedLandscape, now),
    [selected, selectedLandscape, now]
  );
  const landscapeIndex = LANDSCAPES.findIndex(item => item.id === seasonal.landscapeId);
  function changeLandscape(direction: -1 | 1) {
    const index = (landscapeIndex + direction + LANDSCAPES.length) % LANDSCAPES.length;
    setSelectedLandscape(LANDSCAPES[index].id);
  }

  // Monthly scratchpad memo state
  const [memo, setMemo] = useState(() => {
    try {
      return localStorage.getItem(`friday.calendar.memo.${selected.slice(0, 7)}`) ?? '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      setMemo(localStorage.getItem(`friday.calendar.memo.${month}`) ?? '');
    } catch {
      setMemo('');
    }
  }, [month]);

  function saveMemo(nextText: string) {
    setMemo(nextText);
    try {
      localStorage.setItem(`friday.calendar.memo.${month}`, nextText);
    } catch {
      // ignore
    }
  }

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of sortEvents(snapshot.events)) {
      map.set(event.date, [...(map.get(event.date) ?? []), event]);
    }
    return map;
  }, [snapshot.events]);

  const agenda = eventsByDate.get(selected) ?? [];
  const holidays = holidaysFor(selected);
  const monthEvents = useMemo(() => snapshot.events.filter(event => event.date.startsWith(month)), [snapshot.events, month]);
  const monthCount = monthEvents.length;
  const allDayCount = useMemo(() => monthEvents.filter(e => e.allDay).length, [monthEvents]);
  const timedCount = monthCount - allDayCount;

  const upcomingHighlights = useMemo(
    () => getUpcomingHighlights(month, today, snapshot.events),
    [month, today, snapshot.events],
  );

  const weeklyLoad = useMemo(
    () => getWeeklyLoad(days, snapshot.events),
    [days, snapshot.events],
  );

  const maxWeeklyCount = useMemo(
    () => Math.max(...weeklyLoad.map(w => w.count), 1),
    [weeklyLoad],
  );

  useLayoutEffect(() => {
    if (focusDate.current) {
      grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focusDate.current}"]`)?.focus();
      focusDate.current = null;
    }
  }, [selected]);

  function select(key: string, focus = false) {
    if (!validDate(key)) return;
    if (focus) focusDate.current = key;
    setSelected(key);
  }

  function keyDown(event: KeyboardEvent<HTMLButtonElement>, key: string) {
    const weekday = localDate(key).getDay();
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -WEEK_LENGTH,
      ArrowDown: WEEK_LENGTH,
      Home: -weekday,
      End: WEEK_LENGTH - 1 - weekday,
    };
    let next: string;
    if (event.key === 'PageUp' || event.key === 'PageDown') next = moveMonth(key, event.key === 'PageUp' ? -1 : 1);
    else if (Object.hasOwn(offsets, event.key)) next = offsetDateKey(key, offsets[event.key]);
    else return;
    event.preventDefault();
    select(next, true);
  }

  async function persist(events: CalendarEvent[], expectedRaw = snapshot.raw) {
    const raw = await saveCalendar(events, expectedRaw);
    setSnapshot({ events, raw, error: '' });
    setEditing(null);
  }

  async function save(event: CalendarEvent) {
    await persist([...snapshot.events.filter(item => item.id !== event.id), event]);
    select(event.date);
  }

  async function saveCopy(event: CalendarEvent) {
    const latest = readCalendar();
    if (latest.error) throw Error(latest.error);
    await persist([...latest.events, { ...event, id: crypto.randomUUID() }], latest.raw);
    select(event.date);
  }

  return (
    <section className="calendar-workspace" aria-label="개인 캘린더">
      {/* 1. Header Toolbar */}
      <header className="calendar-toolbar">
        <div className="calendar-month-title">
          <span className="calendar-overline">
            <span className="calendar-overline-dot" />
            {date.getFullYear()}
            <span className="calendar-overline-line" />
            <span className="calendar-overline-tag">PLANNER</span>
          </span>
          <h2 aria-live="polite">
            {date.getMonth() + 1}월
            <span className="calendar-month-sub">{MONTH_NAME.format(date)}</span>
          </h2>
        </div>
        <div className="calendar-controls">
          <label className="calendar-month-picker">
            <input
              aria-label={C.month}
              type="month"
              min={CALENDAR_MIN_DATE.slice(0, 7)}
              max={CALENDAR_MAX_DATE.slice(0, 7)}
              value={month}
              onChange={e => select(`${e.target.value}-01`)}
            />
          </label>
          <div className="calendar-stepper">
            <button
              className="icon-button"
              aria-label={C.previous}
              disabled={!validDate(moveMonth(selected, -1))}
              onClick={() => select(moveMonth(selected, -1))}
            >
              <ChevronLeft size={17} />
            </button>
            <button className="calendar-today" onClick={() => select(formatDateKey())}>
              {C.today}
            </button>
            <button
              className="icon-button"
              aria-label={C.next}
              disabled={!validDate(moveMonth(selected, 1))}
              onClick={() => select(moveMonth(selected, 1))}
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <button
            className="button primary calendar-add-btn"
            disabled={!!snapshot.error}
            onClick={() => setEditing(newEvent(selected))}
          >
            <Plus size={15} />
            {C.add}
          </button>
        </div>
      </header>

      {snapshot.error && (
        <div className="calendar-storage-error">
          <p role="alert">{snapshot.error}</p>
          <button className="button secondary" onClick={() => setSnapshot(readCalendar())}>
            {C.reload}
          </button>
        </div>
      )}

      {/* 2. Main Calendar Grid + Right Agenda (Floating Tiles, Borderless feel) */}
      <div className="calendar-layout">
        <div className="calendar-month">
          <div
            className="calendar-grid"
            role="grid"
            style={{ '--calendar-weeks': days.length / WEEK_LENGTH } as CSSProperties}
            aria-label={`${date.getFullYear()}년 ${date.getMonth() + 1}월`}
            aria-describedby="calendar-keyboard"
            ref={grid}
          >
            <div className="calendar-weekdays" role="row">
              {WEEKDAY_HEADERS.map(item => (
                <span
                  role="columnheader"
                  className={`calendar-weekday ${item.isSunday ? 'calendar-sunday' : ''} ${item.isSaturday ? 'calendar-saturday' : ''}`}
                  key={item.ko}
                >
                  <span className="calendar-weekday-en">{item.en}</span>
                  <span className="calendar-weekday-ko">{item.ko}</span>
                </span>
              ))}
            </div>
            {Array.from({ length: days.length / WEEK_LENGTH }, (_, week) => (
              <div className="calendar-week" role="row" key={week}>
                {days.slice(week * WEEK_LENGTH, (week + 1) * WEEK_LENGTH).map(key => {
                  const items = eventsByDate.get(key) ?? [];
                  const names = holidaysFor(key);
                  const previewLimit = names.length ? DAY_PREVIEW_LIMIT - 1 : DAY_PREVIEW_LIMIT;
                  const active = key === selected;
                  const dayOfWeek = localDate(key).getDay();
                  const isSunday = names.length > 0 || dayOfWeek === 0;
                  const isSaturday = dayOfWeek === 6;
                  const isOutside = !key.startsWith(month);
                  return (
                    <div role="gridcell" aria-selected={active} key={key} className={`calendar-cell ${active ? 'is-selected' : ''}`}>
                      <button
                        data-date={key}
                        className={`calendar-day ${isOutside ? 'outside' : ''} ${isSunday ? 'calendar-sunday' : ''} ${isSaturday ? 'calendar-saturday' : ''}`}
                        aria-label={`${FULL_DATE.format(localDate(key))}${names.length ? ` · ${names.join(', ')}` : ''} · 일정 ${items.length}개`}
                        aria-pressed={active}
                        aria-current={key === today ? 'date' : undefined}
                        tabIndex={active ? 0 : -1}
                        disabled={!validDate(key)}
                        onClick={() => select(key)}
                        onKeyDown={e => keyDown(e, key)}
                      >
                        <span className="calendar-day-top">
                          <span className="calendar-day-number">{Number(key.slice(-2))}</span>
                          {key === today && (
                            <span className="calendar-today-pill calendar-today-label">
                              <span className="calendar-today-dot" />
                              <span>{C.today}</span>
                            </span>
                          )}
                        </span>
                        {names.length > 0 && (
                          <span className="calendar-holiday-name" title={names.join(' · ')}>
                            {names.join(' · ')}
                          </span>
                        )}
                        <span className="calendar-previews">
                          {items.slice(0, previewLimit).map(item => (
                            <span className="calendar-preview" key={item.id}>
                              <i />
                              {!item.allDay && <time>{item.start}</time>}
                              <span>{item.title}</span>
                            </span>
                          ))}
                          {items.length > previewLimit && (
                            <span className="calendar-more">+{items.length - previewLimit}개</span>
                          )}
                        </span>
                      </button>
                      {active && (
                        <button
                          type="button"
                          className="calendar-cell-quick-add"
                          aria-label={`${key}에 일정 추가`}
                          title="이 날짜에 일정 추가"
                          disabled={!validDate(key) || !!snapshot.error}
                          onClick={e => {
                            e.stopPropagation();
                            setEditing(newEvent(key));
                          }}
                        >
                          <Plus size={11} strokeWidth={2.5} />
                          <span>일정 추가</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <span id="calendar-keyboard" className="calendar-sr-only">{C.keyboard}</span>
          {!holidayYearAvailable(selected) && (
            <p className="calendar-coverage" role="status">
              {C.unknownHolidays} <span>제공 범위 {HOLIDAY_YEARS[0]}–{HOLIDAY_YEARS.at(-1)}</span>
            </p>
          )}
        </div>

        {/* Right Agenda Panel: Stretches to Match Grid Height for Perfect Balance */}
        <aside className="calendar-agenda" aria-label="선택한 날짜의 일정">
          <div className="calendar-agenda-inner">
            {/* 4 Seasons × 365 Days Living Ambient Canvas */}
            <SeasonalAgendaCanvas state={seasonal} />

            <div className="calendar-agenda-content">
              <div className="calendar-agenda-date">
                <div className="calendar-agenda-overline-row">
                  <span className="calendar-agenda-badge">
                    <Sparkles size={11} />
                    <span>{selected === today ? 'TODAY' : `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`}</span>
                  </span>
                  <button
                    className="button primary calendar-hero-add-btn"
                    aria-label="선택한 날짜에 새 일정 등록"
                    disabled={!!snapshot.error}
                    onClick={() => setEditing(newEvent(selected))}
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    <span>일정 등록</span>
                  </button>
                </div>

                <div className="calendar-agenda-hero">
                  <strong>{String(date.getDate()).padStart(2, '0')}</strong>
                  <div className="calendar-agenda-hero-meta">
                    <span className="calendar-agenda-hero-weekday">{WEEKDAYS[date.getDay()]}요일</span>
                    <span className="calendar-agenda-hero-month">{date.getMonth() + 1}월 · {MONTH_NAME.format(date)}</span>
                  </div>
                </div>

              </div>

            {holidays.map(name => (
              <div className="calendar-holiday" key={name}>
                <span />
                {name}
                <small>공휴일</small>
              </div>
            ))}

            {agenda.length > 0 && (
              <h3 className="calendar-agenda-heading">
                {C.agendaTitle}
                <span>{agenda.length}</span>
              </h3>
            )}

            <div className="calendar-agenda-body">
              {agenda.length ? (
                <div className="calendar-agenda-list">
                  {agenda.map(event => (
                    <button
                      key={event.id}
                      className="calendar-agenda-event"
                      aria-label={`${event.title} 일정 수정`}
                      disabled={!!snapshot.error}
                      onClick={() => setEditing(event)}
                    >
                      <span className="calendar-event-time">
                        {event.allDay ? C.allDay : `${event.start} – ${event.end}`}
                      </span>
                      <strong>{event.title}</strong>
                      {event.notes && <span className="calendar-event-note">{event.notes}</span>}
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </div>
              ) : (
                !snapshot.error && (
                  <div className="calendar-empty">
                    <div className="calendar-empty-art" aria-hidden="true">
                      <div className="calendar-empty-lines">
                        <i />
                        <i />
                        <i />
                      </div>
                      <div className="calendar-empty-icon">
                        <CalendarDays size={24} strokeWidth={1.5} />
                      </div>
                    </div>
                    <strong>{C.empty}</strong>
                    <p>{C.emptyHint}</p>
                    <button className="text-button calendar-empty-add-btn" onClick={() => setEditing(newEvent(selected))}>
                      <Plus size={14} />이 날짜에 추가
                    </button>
                  </div>
                )
              )}
            </div>

            <div className="calendar-agenda-foot-brand calendar-landscape-picker" role="group" aria-label={LANDSCAPE_COPY.label}>
              <button type="button" className="calendar-landscape-arrow" aria-label={LANDSCAPE_COPY.previous} onClick={() => changeLandscape(-1)}>
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <span className="calendar-landscape-caption" aria-live="polite" aria-atomic="true">
                <span>{LANDSCAPE_DEFS[seasonal.landscapeId].name}</span>
                <small>{landscapeIndex + 1} / {LANDSCAPES.length}</small>
              </span>
              <button type="button" className="calendar-landscape-arrow" aria-label={LANDSCAPE_COPY.next} onClick={() => changeLandscape(1)}>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </aside>
      </div>

      {/* 3. Lower Tier: Monthly Intelligence & Desk Widgets */}
      <section className="calendar-bottom-dashboard" aria-label="월간 요약 대시보드">
        {/* Widget 1: Upcoming Highlights & D-Day */}
        <article className="calendar-widget-card">
          <div className="calendar-widget-header">
            <div className="calendar-widget-title-group">
              <span className="calendar-widget-icon-pill">
                <Sparkles size={14} />
              </span>
              <h3>주요 일정 & 공휴일 D-Day</h3>
            </div>
            <span className="calendar-widget-count-badge">{upcomingHighlights.length}개</span>
          </div>
          <div className="calendar-widget-body">
            {upcomingHighlights.length > 0 ? (
              <ul className="calendar-dday-list">
                {upcomingHighlights.slice(0, 5).map(item => (
                  <li key={item.id} className="calendar-dday-item" onClick={() => select(item.date, true)} role="button" tabIndex={0}>
                    <span className={`calendar-dday-badge ${item.type === 'holiday' ? 'holiday' : 'event'}`}>
                      {item.dDay}
                    </span>
                    <div className="calendar-dday-info">
                      <strong>{item.title}</strong>
                      <time>{item.date.slice(5).replace('-', '월 ')}일</time>
                    </div>
                    <span className="calendar-dday-arrow">이동</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="calendar-widget-empty">
                <p>이번 달 예정된 주요 일정이 없습니다.</p>
              </div>
            )}
          </div>
        </article>

        {/* Widget 2: Weekly Load & Rhythm */}
        <article className="calendar-widget-card">
          <div className="calendar-widget-header">
            <div className="calendar-widget-title-group">
              <span className="calendar-widget-icon-pill">
                <BarChart3 size={14} />
              </span>
              <h3>월간 일정 리듬 & 주간 밀도</h3>
            </div>
            <span className="calendar-widget-count-badge">총 {monthCount}개</span>
          </div>
          <div className="calendar-widget-body">
            <div className="calendar-load-summary">
              <div className="calendar-load-stat">
                <small>종일 일정</small>
                <strong>{allDayCount}</strong>
              </div>
              <div className="calendar-load-divider" />
              <div className="calendar-load-stat">
                <small>시간 지정</small>
                <strong>{timedCount}</strong>
              </div>
            </div>
            <div className="calendar-weekly-bars">
              {weeklyLoad.map(w => {
                const ratio = Math.round((w.count / maxWeeklyCount) * 100);
                return (
                  <div key={w.weekNum} className="calendar-weekly-bar-row">
                    <span className="calendar-weekly-label">{w.label}</span>
                    <div className="calendar-weekly-track">
                      <div
                        className="calendar-weekly-fill"
                        style={{ width: `${w.count === 0 ? 0 : Math.max(ratio, 8)}%` }}
                      />
                    </div>
                    <span className="calendar-weekly-count">{w.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        {/* Widget 3: Monthly Focus & Scratchpad */}
        <article className="calendar-widget-card calendar-memo-widget">
          <div className="calendar-widget-header">
            <div className="calendar-widget-title-group">
              <span className="calendar-widget-icon-pill">
                <Pin size={14} />
              </span>
              <h3>{date.getMonth() + 1}월의 포커스 & 메모</h3>
            </div>
            <span className="calendar-widget-tag-pill">
              <Bookmark size={11} /> 자동 저장
            </span>
          </div>
          <div className="calendar-widget-body calendar-memo-body">
            <textarea
              className="calendar-memo-textarea"
              placeholder={`${date.getMonth() + 1}월에 꼭 기억해둘 목표, 프로젝트 키워드, 다짐을 자유롭게 적어보세요.`}
              value={memo}
              onChange={e => saveMemo(e.target.value)}
              aria-label={`${date.getMonth() + 1}월 메모`}
            />
          </div>
        </article>
      </section>

      {editing && (
        <EventEditor
          key={editing.id}
          initial={editing}
          existing={snapshot.events.some(item => item.id === editing.id)}
          onSave={save}
          onSaveCopy={saveCopy}
          onDelete={id => persist(snapshot.events.filter(item => item.id !== id))}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
