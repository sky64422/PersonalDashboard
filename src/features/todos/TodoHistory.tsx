import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { PanelHeading } from '../../components/ui';
import type { TodoItem } from '../../data/model';
import { formatKoreanDateLabel } from './todoModel';
import { buildDailyTodoLog, buildMonthlyTodoGroups, searchDailyTodoLog } from './todoHistoryModel';
import { HistoryPeriodPicker } from './HistoryPeriodPicker';
import { HistoryNoteItems } from './HistoryNoteItems';

const REST_TILTS = [-1.4, 1.05, -0.85, 1.2, -0.65, 1.0];
const LAST_MONTH_RECORD_LABEL = '이달 마지막 기록';

export function TodoHistory({ todos, todayKey }: { todos: TodoItem[]; todayKey: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const noteRefs = useRef<(HTMLElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ active: false, startX: 0, startScrollLeft: 0 });
  const motionRaf = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (motionRaf.current) cancelAnimationFrame(motionRaf.current);
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const isSearching = searchQuery.trim().length > 0;

  const allHistoricalEntries = useMemo(
    () => buildDailyTodoLog(todos, todayKey),
    [todos, todayKey],
  );

  const monthlyGroups = useMemo(() => buildMonthlyTodoGroups(allHistoricalEntries), [allHistoricalEntries]);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    () => monthlyGroups[0]?.monthKey ?? '',
  );

  const activeGroup =
    monthlyGroups.find(g => g.monthKey === selectedMonthKey) ?? monthlyGroups[0] ?? null;
  const activeEntries = activeGroup?.entries ?? [];

  const searchResults = useMemo(
    () => (isSearching ? searchDailyTodoLog(allHistoricalEntries, searchQuery) : []),
    [isSearching, allHistoricalEntries, searchQuery],
  );

  const displayedEntries = isSearching ? searchResults : activeEntries;

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (isSearching) {
      el.scrollLeft = 0;
    } else {
      el.scrollLeft = el.scrollWidth;
    }
  }, [activeGroup?.monthKey, activeEntries.length, isSearching, searchQuery]);

  function handleStageMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button')) return;
    if (event.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;
    dragState.current = {
      active: true,
      startX: event.pageX - el.offsetLeft,
      startScrollLeft: el.scrollLeft,
    };
    setIsDragging(true);
  }

  function handleStageMouseUp() {
    if (!dragState.current.active) return;
    dragState.current.active = false;
    setIsDragging(false);
  }

  function handleTrackMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (dragState.current.active && el) {
      event.preventDefault();
      const x = event.pageX - el.offsetLeft;
      const walk = (x - dragState.current.startX) * 1.25;
      el.scrollLeft = dragState.current.startScrollLeft - walk;
    }

    if (document.documentElement.dataset.reducedMotion === 'true') return;
    const clientX = event.clientX;

    if (motionRaf.current !== null) return;
    motionRaf.current = requestAnimationFrame(() => {
      motionRaf.current = null;
      if (document.documentElement.dataset.reducedMotion === 'true') return;

      const sigma = 185;
      let closestIdx: number | null = null;
      let minDistance = Infinity;

      // Batch Read: 먼저 레이아웃 좌표 일괄 수집하여 강제 동기 리플로우(Layout Thrashing) 방지
      const items: { node: HTMLElement; idx: number; deltaX: number; dist: number }[] = [];
      noteRefs.current.forEach((node, idx) => {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const deltaX = clientX - centerX;
        const dist = Math.abs(deltaX);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
        items.push({ node, idx, deltaX, dist });
      });

      // Batch Write: 스타일 일괄 적용
      items.forEach(({ node, idx, deltaX, dist }) => {
        const wave = Math.exp(-(dist * dist) / (2 * sigma * sigma));
        const restTilt = REST_TILTS[idx % REST_TILTS.length];
        const sway = (deltaX / 220) * wave * -1.8;
        const tilt = restTilt * (1 - wave * 0.92) + sway;

        node.style.setProperty('--wave', wave.toFixed(4));
        node.style.setProperty('--dynamic-tilt', `${tilt.toFixed(2)}deg`);
      });

      setHoveredIndex(prev => (prev !== closestIdx ? closestIdx : prev));
    });
  }

  function handleTrackMouseLeave() {
    if (motionRaf.current !== null) {
      cancelAnimationFrame(motionRaf.current);
      motionRaf.current = null;
    }
    dragState.current.active = false;
    setIsDragging(false);
    setHoveredIndex(null);
    noteRefs.current.forEach((node, idx) => {
      if (!node) return;
      const restTilt = REST_TILTS[idx % REST_TILTS.length];
      node.style.setProperty('--wave', '0');
      node.style.setProperty('--dynamic-tilt', `${restTilt}deg`);
    });
  }

  return (
      <section className="card todo-clothesline-section" aria-label="히스토리">
        <PanelHeading
          title="History"
          action={
            <div className="history-header-actions">
              <div className={`history-search-box ${searchQuery ? 'has-query' : ''}`}>
                <Search size={13} className="history-search-icon" aria-hidden="true" />
                <input
                  type="text"
                  className="history-search-input"
                  aria-label="히스토리 검색"
                  placeholder="과거 기록 검색… (Esc)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') setSearchQuery('');
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="history-search-clear-btn"
                    aria-label="검색어 지우기"
                    title="검색어 지우기"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <span className="count-pill">
                {isSearching ? searchResults.length : activeEntries.length}
              </span>
            </div>
          }
        />
        <div className="todo-clothesline-body">
          {isSearching ? (
            <div className="history-search-status-bar" role="status">
              <div className="history-search-status-info">
                <span className="history-search-status-badge">검색 결과</span>
                <span className="history-search-status-text">
                  &ldquo;<strong>{searchQuery.trim()}</strong>&rdquo; 관련{' '}
                  <span className="history-search-count-highlight">{searchResults.length}일치 기록 발견</span>
                </span>
              </div>
              <button
                type="button"
                className="history-search-reset-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={13} />
                <span>검색 종료</span>
              </button>
            </div>
          ) : (
            <HistoryPeriodPicker
              groups={monthlyGroups}
              selectedMonth={activeGroup?.monthKey ?? ''}
              onSelect={setSelectedMonthKey}
            />
          )}

          <div className="clothesline-stage-wrapper">
            <div
              className={`clothesline-stage ${isDragging ? 'is-dragging' : ''}`}
              ref={trackRef}
              onMouseDown={handleStageMouseDown}
              onMouseUp={handleStageMouseUp}
              onMouseMove={handleTrackMouseMove}
              onMouseLeave={handleTrackMouseLeave}
              role="region"
              aria-label={isSearching ? `"${searchQuery}" 검색 결과 타임라인` : `${activeGroup?.label ?? ''} 누적 노트 라인`}
              tabIndex={0}
            >
              {displayedEntries.length === 0 ? (
                <div className="history-search-empty">
                  <Search size={26} className="history-empty-icon" aria-hidden="true" />
                  <p className="history-empty-title">
                    ‘{searchQuery.trim()}’ 관련 과거 기록이 없습니다.
                  </p>
                  <p className="history-empty-desc">철자를 확인하거나 다른 검색어를 입력해보세요.</p>
                  <button
                    type="button"
                    className="history-search-empty-reset"
                    onClick={() => setSearchQuery('')}
                  >
                    검색 초기화
                  </button>
                </div>
              ) : (
                <div className="clothesline-track" key={isSearching ? `search-${searchQuery}` : activeGroup?.monthKey}>
                  <div className="clothesline-wire" aria-hidden="true" />
                  {displayedEntries.map((entry, idx) => {
                    const restTilt = REST_TILTS[idx % REST_TILTS.length];
                    return (
                      <article
                        key={entry.date}
                        ref={el => {
                          noteRefs.current[idx] = el;
                        }}
                        className={`hanging-note ${entry.isLatest && !isSearching ? 'is-latest' : ''} ${
                          hoveredIndex === idx ? 'is-peak' : ''
                        }`}
                        data-log-date={entry.date}
                        style={
                          {
                            '--rest-tilt': `${restTilt}deg`,
                            '--dynamic-tilt': `${restTilt}deg`,
                            '--wave': 0,
                          } as React.CSSProperties
                        }
                      >
                        <div className="hanging-clip" aria-hidden="true">
                          <span className="clip-ring" />
                          <span className="clip-body" />
                        </div>

                        <div className="hanging-note-paper">
                          <header className="hanging-note-header">
                            <div className="hanging-date-row">
                              <strong className="hanging-date-label">
                                {formatKoreanDateLabel(entry.date, todayKey)}
                              </strong>
                              {entry.isLatest && !isSearching && (
                                <span className="latest-stamp">{LAST_MONTH_RECORD_LABEL}</span>
                              )}
                              {isSearching && (
                                <span className="history-search-card-year">
                                  {entry.date.slice(0, 4)}년
                                </span>
                              )}
                            </div>
                            <div className="hanging-summary-pills">
                              {entry.completedOnDay.length > 0 && (
                                <span className="day-pill completed">완료 {entry.completedOnDay.length}</span>
                              )}
                              {entry.carriedForwardFromDay.length > 0 && (
                                <span className="day-pill carried">이월 {entry.carriedForwardFromDay.length}</span>
                              )}
                            </div>
                          </header>

                          <HistoryNoteItems entry={entry} highlightQuery={isSearching ? searchQuery : undefined} />
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
  );
}
