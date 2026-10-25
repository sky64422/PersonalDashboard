import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthLabel } from './todoModel';
import { type MonthlyTodoGroup } from './todoHistoryModel';

const DRAG_THRESHOLD = 5;
const PERIOD_LABELS = {
  years: '연도별 히스토리 선택',
  months: '월별 히스토리 선택',
  prevYear: '이전 연도',
  nextYear: '다음 연도',
};
const SCROLL_EDGE_TOLERANCE = 1;
const MONTHS_IN_YEAR = 12;
const NO_HISTORY_LABEL = '기록 없음';

const DRAG_STEP_THRESHOLD = 85;
const FLICK_THRESHOLD = 40;

function PeriodRail({
  label,
  selected,
  children,
  className,
  onSwipeStep,
  onWheelStep,
}: {
  label: string;
  selected: string;
  children: ReactNode;
  className: string;
  onSwipeStep?: (stepCount: number) => void;
  onWheelStep?: (stepCount: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });
  const drag = useRef({
    pointer: -1,
    startX: 0,
    lastStepX: 0,
    scrollLeft: 0,
    moved: false,
    stepped: false,
    isDragging: false,
  });
  const wheelLock = useRef(false);
  const wheelTimer = useRef<number | null>(null);
  const onWheelStepRef = useRef(onWheelStep);
  onWheelStepRef.current = onWheelStep;

  const centerActiveTab = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const rail = ref.current;
    if (!rail) return;
    const tab = rail.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!tab) return;
    const railWidth = rail.clientWidth;
    const tabCenter = tab.offsetLeft + tab.offsetWidth / 2;
    const targetScrollLeft = tabCenter - railWidth / 2;
    rail.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior,
    });
  }, []);

  const updateOverflow = useCallback(() => {
    const rail = ref.current;
    if (!rail) return;
    const left = rail.scrollLeft > SCROLL_EDGE_TOLERANCE;
    const right = rail.scrollWidth - rail.clientWidth - rail.scrollLeft > SCROLL_EDGE_TOLERANCE;
    setOverflow(previous => (previous.left === left && previous.right === right ? previous : { left, right }));
  }, []);

  useEffect(() => {
    const rail = ref.current;
    if (!rail) return;

    centerActiveTab('auto');
    updateOverflow();

    rail.addEventListener('scroll', updateOverflow, { passive: true });
    const observer = new ResizeObserver(() => {
      updateOverflow();
      if (!drag.current.isDragging) centerActiveTab('auto');
    });
    observer.observe(rail);

    return () => {
      rail.removeEventListener('scroll', updateOverflow);
      observer.disconnect();
    };
  }, [centerActiveTab, updateOverflow]);

  useEffect(() => {
    if (drag.current.isDragging) return;
    centerActiveTab('smooth');
    updateOverflow();
  }, [selected, centerActiveTab, updateOverflow]);

  useEffect(() => {
    const rail = ref.current;
    if (!rail) return;
    const handleWheel = (event: WheelEvent) => {
      const stepFn = onWheelStepRef.current;
      if (!stepFn) return;
      const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (Math.abs(delta) > 12) {
        event.preventDefault();
        if (wheelLock.current) return;
        wheelLock.current = true;
        const direction = delta > 0 ? 1 : -1;
        stepFn(direction);
        if (wheelTimer.current !== null) clearTimeout(wheelTimer.current);
        wheelTimer.current = window.setTimeout(() => {
          wheelLock.current = false;
          wheelTimer.current = null;
        }, 200);
      }
    };
    rail.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      rail.removeEventListener('wheel', handleWheel);
      if (wheelTimer.current !== null) {
        clearTimeout(wheelTimer.current);
        wheelTimer.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`history-period-rail ${className}`}
      role="tablist"
      aria-label={label}
      data-overflow-left={overflow.left}
      data-overflow-right={overflow.right}
      onPointerDown={event => {
        if (event.button !== 0 || event.pointerType !== 'mouse') return;
        drag.current = {
          pointer: event.pointerId,
          startX: event.clientX,
          lastStepX: event.clientX,
          scrollLeft: event.currentTarget.scrollLeft,
          moved: false,
          stepped: false,
          isDragging: true,
        };
      }}
      onPointerMove={event => {
        const state = drag.current;
        if (state.pointer !== event.pointerId) return;
        const distance = event.clientX - state.startX;
        if (!state.moved && Math.abs(distance) < DRAG_THRESHOLD) return;
        state.moved = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.dataset.dragging = 'true';
        event.currentTarget.scrollLeft = state.scrollLeft - distance;

        // Continuous real-time switching while dragging!
        const stepDelta = event.clientX - state.lastStepX;
        if (Math.abs(stepDelta) >= DRAG_STEP_THRESHOLD) {
          const steps = Math.trunc(stepDelta / DRAG_STEP_THRESHOLD);
          if (onSwipeStep) onSwipeStep(-steps);
          state.lastStepX += steps * DRAG_STEP_THRESHOLD;
          state.stepped = true;
        }

        event.preventDefault();
      }}
      onPointerUp={event => {
        const state = drag.current;
        if (state.pointer !== event.pointerId) return;
        const totalDistance = event.clientX - state.startX;

        state.pointer = -1;
        state.isDragging = false;
        delete event.currentTarget.dataset.dragging;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }

        // If moved but didn't trigger an incremental step, check flick/swipe
        if (state.moved && !state.stepped && onSwipeStep) {
          if (totalDistance < -FLICK_THRESHOLD) {
            onSwipeStep(1);
          } else if (totalDistance > FLICK_THRESHOLD) {
            onSwipeStep(-1);
          }
        }

        // Smoothly settle active year to center on release
        const rail = ref.current;
        const tab = rail?.querySelector<HTMLElement>('[aria-selected="true"]');
        if (rail && tab) {
          rail.scrollTo({
            left: Math.max(0, tab.offsetLeft + tab.offsetWidth / 2 - rail.clientWidth / 2),
            behavior: 'smooth',
          });
        }
      }}
      onPointerCancel={event => {
        drag.current.pointer = -1;
        drag.current.isDragging = false;
        delete event.currentTarget.dataset.dragging;
      }}
      onPointerLeave={() => {
        if (!drag.current.moved) {
          drag.current.pointer = -1;
          drag.current.isDragging = false;
        }
      }}
      onClickCapture={event => {
        if (drag.current.moved && event.detail !== 0) {
          event.preventDefault();
          event.stopPropagation();
          drag.current.moved = false;
        }
      }}
    >
      {children}
    </div>
  );
}

export function HistoryPeriodPicker({
  groups,
  selectedMonth,
  onSelect,
}: {
  groups: MonthlyTodoGroup[];
  selectedMonth: string;
  onSelect: (month: string) => void;
}) {
  const years = useMemo(() => [...new Set(groups.map(group => group.monthKey.slice(0, 4)))].sort(), [groups]);
  const selectedYear = selectedMonth.slice(0, 4);
  const selectedYearIndex = years.indexOf(selectedYear);
  const availableMonths = useMemo(() => new Set(groups.map(group => group.monthKey)), [groups]);

  const handleStep = useCallback((stepCount: number) => {
    if (years.length === 0) return;
    if (selectedYearIndex === -1) {
      const targetYear = stepCount > 0 ? years[0] : years[years.length - 1];
      const targetGroup = groups.find(group => group.monthKey.startsWith(targetYear));
      if (targetGroup) onSelect(targetGroup.monthKey);
      return;
    }
    const nextIndex = Math.max(0, Math.min(years.length - 1, selectedYearIndex + stepCount));
    if (nextIndex !== selectedYearIndex) {
      const nextYear = years[nextIndex];
      const targetGroup = groups.find(group => group.monthKey.startsWith(nextYear));
      if (targetGroup) onSelect(targetGroup.monthKey);
    }
  }, [years, selectedYearIndex, groups, onSelect]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handleStep(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleStep(1);
    }
  };

  return (
    <div className="history-period-picker">
      <div className="history-period-header">
        {/* Full-width Cylindrical Dial Wheel for Years */}
        <div className="history-year-dial-wrapper">
          <button
            type="button"
            className="history-year-dial-arrow prev"
            title={PERIOD_LABELS.prevYear}
            aria-label={PERIOD_LABELS.prevYear}
            disabled={selectedYearIndex <= 0}
            onClick={() => handleStep(-1)}
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>

          <div className="history-year-dial-frame">
            <PeriodRail
              label={PERIOD_LABELS.years}
              selected={selectedYear}
              className="history-years-bar history-years-dial-rail"
              onSwipeStep={handleStep}
              onWheelStep={handleStep}
            >
              {years.map((year, index) => {
                const offset = selectedYearIndex === -1 ? 0 : index - selectedYearIndex;
                const clampedOffset = Math.max(-4, Math.min(4, offset));
                const isSelected = year === selectedYear;
                return (
                  <button
                    key={year}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    data-distance={clampedOffset}
                    className={`history-year ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onSelect(groups.find(group => group.monthKey.startsWith(year))!.monthKey)}
                    onKeyDown={handleKeyDown}
                  >
                    <span className="history-year-visual" data-distance={clampedOffset}>
                      <span className="history-year-number">{year}</span>
                      <span className="history-year-unit">년</span>
                    </span>
                  </button>
                );
              })}
            </PeriodRail>
          </div>

          <button
            type="button"
            className="history-year-dial-arrow next"
            title={PERIOD_LABELS.nextYear}
            aria-label={PERIOD_LABELS.nextYear}
            disabled={selectedYearIndex === -1 || selectedYearIndex >= years.length - 1}
            onClick={() => handleStep(1)}
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div role="tablist" aria-label={PERIOD_LABELS.months} className="history-months-bar">
          {Array.from({ length: MONTHS_IN_YEAR }, (_, index) => {
            const monthNumber = index + 1;
            const monthKey = `${selectedYear}-${String(monthNumber).padStart(2, '0')}`;
            const isActive = monthKey === selectedMonth;
            const available = availableMonths.has(monthKey);
            return (
              <button
                key={monthKey}
                type="button"
                role="tab"
                aria-label={formatMonthLabel(monthKey)}
                disabled={!available}
                title={available ? formatMonthLabel(monthKey) : `${formatMonthLabel(monthKey)} · ${NO_HISTORY_LABEL}`}
                aria-selected={isActive}
                className={`history-month-row ${isActive ? 'active' : ''}`}
                onClick={() => onSelect(monthKey)}
              >
                <span className="month-row-title">{monthNumber}월</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
