import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  GripVertical,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { PanelHeading } from '../../components/ui';
import { HistoryPeriodPicker } from './HistoryPeriodPicker';
import { HistoryNoteItems } from './HistoryNoteItems';
import type { TodoItem } from '../../data/model';
import {
  buildDailyTodoLog,
  buildMonthlyTodoGroups,
  formatKoreanDateLabel,
  getComposerTargetParent,
  getCurrentTodoList,
  getRemainingTodos,
  searchDailyTodoLog,
  } from './todoModel';

const REST_TILTS = [-1.4, 1.05, -0.85, 1.2, -0.65, 1.0];
const LAST_MONTH_RECORD_LABEL = '이달 마지막 기록';

function buildChildrenMap(todos: TodoItem[]): Map<string, TodoItem[]> {
  const map = new Map<string, TodoItem[]>();
  for (const item of todos) {
    if (item.parentId) {
      let list = map.get(item.parentId);
      if (!list) {
        list = [];
        map.set(item.parentId, list);
      }
      list.push(item);
    }
  }
  return map;
}

export function Todos({
  todos,
  todayKey,
  onAdd,
  onUpdateText,
  onInsertAfter,
  onIndent,
  onOutdent,
  onToggle,
  onDelete,
  onReorder,
}: {
  todos: TodoItem[];
  todayKey: string;
  onAdd: (text: string, parentId?: string) => string;
  onUpdateText: (id: string, text: string) => void;
  onInsertAfter: (targetId: string) => string;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder?: (sourceId: string, targetId: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [composerDepth, setComposerDepth] = useState(0);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);
  const lineInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const pendingFocus = useRef<{ id: string; cursor?: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const noteRefs = useRef<(HTMLElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ active: false, startX: 0, startScrollLeft: 0 });
  const motionRaf = useRef<number | null>(null);

  const [draggingTodoId, setDraggingTodoId] = useState<string | null>(null);
  const [dragOverTodoId, setDragOverTodoId] = useState<string | null>(null);

  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTodoId(id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    if (draggingTodoId && draggingTodoId !== id) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverTodoId !== id) {
        setDragOverTodoId(id);
      }
    }
  }

  function handleDragLeave(id: string) {
    if (dragOverTodoId === id) {
      setDragOverTodoId(null);
    }
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggingTodoId;
    if (sourceId && sourceId !== targetId && onReorder) {
      onReorder(sourceId, targetId);
    }
    setDraggingTodoId(null);
    setDragOverTodoId(null);
  }

  function handleDragEnd() {
    setDraggingTodoId(null);
    setDragOverTodoId(null);
  }



  const childrenMap = useMemo(() => buildChildrenMap(todos), [todos]);

  useEffect(() => {
    return () => {
      if (motionRaf.current) cancelAnimationFrame(motionRaf.current);
    };
  }, []);

  const displayedCurrentTodos = getCurrentTodoList(todos, todayKey);
  const activeTodos = displayedCurrentTodos.filter(todo => !todo.done);
  const completedTodayTodos = displayedCurrentTodos.filter(todo => todo.done);

  const targetParent = getComposerTargetParent(todos, composerDepth);

  const [searchQuery, setSearchQuery] = useState('');
  const isSearching = searchQuery.trim().length > 0;

  const monthlyGroups = useMemo(() => buildMonthlyTodoGroups(todos, todayKey), [todos, todayKey]);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    () => monthlyGroups[0]?.monthKey ?? '',
  );

  const activeGroup =
    monthlyGroups.find(g => g.monthKey === selectedMonthKey) ?? monthlyGroups[0] ?? null;
  const activeEntries = activeGroup?.entries ?? [];

  const allHistoricalEntries = useMemo(
    () => buildDailyTodoLog(todos, todayKey),
    [todos, todayKey],
  );

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

  useEffect(() => {
    if (pendingFocus.current) {
      const { id, cursor } = pendingFocus.current;
      pendingFocus.current = null;
      const input = lineInputRefs.current.get(id);
      if (input) {
        input.focus();
        const pos = cursor ?? input.value.length;
        input.setSelectionRange(pos, pos);
      }
    }
  }, [todos]);

  function setLineInputRef(id: string, el: HTMLInputElement | null) {
    if (el) {
      lineInputRefs.current.set(id, el);
    } else {
      lineInputRefs.current.delete(id);
    }
  }

  function getFlatActiveIds(): string[] {
    const ids: string[] = [];
    function walk(node: TodoItem) {
      ids.push(node.id);
      const children = childrenMap.get(node.id) ?? [];
      for (const child of children) {
        walk(child);
      }
    }
    for (const root of activeTodos) {
      walk(root);
    }
    return ids;
  }

  function commitComposer() {
    const trimmed = draft.trim();
    if (!trimmed) {
      if (composerDepth > 0) {
        setComposerDepth(d => d - 1);
      }
      return;
    }
    onAdd(trimmed, targetParent.parentId);
    setDraft('');
    composerInputRef.current?.focus();
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitComposer();
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      if (event.shiftKey) {
        setComposerDepth(d => Math.max(d - 1, 0));
      } else {
        setComposerDepth(d => Math.min(d + 1, targetParent.maxDepth));
      }
      return;
    }
    if (event.key === 'Backspace' && draft === '') {
      event.preventDefault();
      if (composerDepth > 0) {
        setComposerDepth(d => d - 1);
      } else {
        const activeIds = getFlatActiveIds();
        if (activeIds.length > 0) {
          const lastId = activeIds[activeIds.length - 1];
          const input = lineInputRefs.current.get(lastId);
          if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
          }
        }
      }
      return;
    }
    if (event.key === 'ArrowUp') {
      const activeIds = getFlatActiveIds();
      if (activeIds.length > 0) {
        event.preventDefault();
        const lastId = activeIds[activeIds.length - 1];
        setSelectedTodoId(lastId);
        const input = lineInputRefs.current.get(lastId);
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
    }
  }

  function handleLineKeyDown(event: React.KeyboardEvent<HTMLInputElement>, todo: TodoItem) {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!todo.text.trim()) {
        if (todo.parentId) {
          pendingFocus.current = { id: todo.id, cursor: 0 };
          onOutdent(todo.id);
        } else {
          onDelete(todo.id);
          composerInputRef.current?.focus();
        }
        return;
      }
      const createdId = onInsertAfter(todo.id);
      setSelectedTodoId(createdId);
      pendingFocus.current = { id: createdId, cursor: 0 };
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
      const cursor = event.currentTarget.selectionStart ?? todo.text.length;
      setSelectedTodoId(todo.id);
      pendingFocus.current = { id: todo.id, cursor };
      if (event.shiftKey) {
        onOutdent(todo.id);
      } else {
        onIndent(todo.id);
      }
      return;
    }
    if (event.key === 'Backspace') {
      const selStart = event.currentTarget.selectionStart ?? 0;
      const selEnd = event.currentTarget.selectionEnd ?? 0;
      if (todo.text === '') {
        event.preventDefault();
        const activeIds = getFlatActiveIds();
        const idx = activeIds.indexOf(todo.id);
        const prevId = idx > 0 ? activeIds[idx - 1] : null;
        onDelete(todo.id);
        if (prevId) {
          pendingFocus.current = { id: prevId };
        } else {
          composerInputRef.current?.focus();
        }
        return;
      }
      if (selStart === 0 && selEnd === 0 && todo.parentId) {
        event.preventDefault();
        pendingFocus.current = { id: todo.id, cursor: 0 };
        onOutdent(todo.id);
        return;
      }
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const activeIds = getFlatActiveIds();
      const idx = activeIds.indexOf(todo.id);
      if (idx === -1) return;
      if (event.key === 'ArrowDown') {
        if (idx === activeIds.length - 1) {
          setSelectedTodoId(null);
          composerInputRef.current?.focus();
        } else {
          const nextId = activeIds[idx + 1];
          setSelectedTodoId(nextId);
          const input = lineInputRefs.current.get(nextId);
          input?.focus();
        }
      } else if (idx > 0) {
        const prevId = activeIds[idx - 1];
        setSelectedTodoId(prevId);
        const input = lineInputRefs.current.get(prevId);
        input?.focus();
      }
    }
  }

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

  function renderComposerLine() {
    const isSub = composerDepth > 0;
    return (
      <div
        className={`todo-composer-row ${isSub ? 'is-composer-sub' : ''}`}
        style={isSub ? { marginLeft: `${composerDepth * 26}px` } : undefined}
        onClick={() => composerInputRef.current?.focus()}
      >
        {isSub && <span className="subitem-branch" aria-hidden="true" />}
        <span
          className={`todo-checkbox-box composer-plus-box ${isSub ? 'sub-box' : ''}`}
          aria-hidden="true"
        >
          <Plus size={isSub ? 11 : 13} strokeWidth={2.5} className="composer-plus-icon" />
        </span>
        {isSub && targetParent.parentText && (
          <span className="composer-depth-badge" title={`'${targetParent.parentText}'의 하위로 추가됩니다`}>
            {'↳'.repeat(composerDepth)} {targetParent.parentText}
          </span>
        )}
        <input
          ref={composerInputRef}
          type="text"
          className="todo-line-input composer-input"
          aria-label="새 할 일 입력"
          placeholder={
            isSub
              ? `'${targetParent.parentText ?? '상위'}' 하위 할 일 입력… (Enter 등록 · Tab 더 하위로 · Shift+Tab 상위로)`
              : '새 할 일 입력… (Enter 등록 · Tab 하위 계층)'
          }
          value={draft}
          onFocus={() => setSelectedTodoId(null)}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleComposerKeyDown}
        />
        <div className="composer-shortcut-chips" aria-hidden="true">
          <span className="composer-chip"><kbd>Enter</kbd> 등록</span>
          <span className="composer-chip"><kbd>Tab</kbd> 하위 계층</span>
        </div>
      </div>
    );
  }

  function renderChildNode(child: TodoItem, depth: number) {
    const subChildren = childrenMap.get(child.id) ?? [];

    const isSelected = selectedTodoId === child.id;
    const isDraggingThis = draggingTodoId === child.id;
    const isDropTarget = dragOverTodoId === child.id;

    return (
      <div key={child.id} className={`todo-subitem-group depth-${Math.min(depth, 4)}`}>
        <div
          className={`todo-subitem-row ${child.done ? 'is-done' : ''} ${isSelected ? 'is-selected' : ''} ${isDraggingThis ? 'is-dragging-item' : ''} ${isDropTarget ? 'is-drop-target' : ''}`}
          data-subtodo-id={child.id}
          draggable={!child.done}
          onDragStart={e => handleDragStart(e, child.id)}
          onDragOver={e => handleDragOver(e, child.id)}
          onDragLeave={() => handleDragLeave(child.id)}
          onDrop={e => handleDrop(e, child.id)}
          onDragEnd={handleDragEnd}
          onClick={() => setSelectedTodoId(child.id)}
        >
          <span className="subitem-branch" aria-hidden="true" />
          <span className="todo-drag-handle" title="드래그하여 순서 변경" aria-hidden="true">
            <GripVertical size={13} />
          </span>
          <button
            type="button"
            role="checkbox"
            aria-checked={child.done}
            aria-label={`${child.text || '빈 항목'} 완료 체크`}
            className={`todo-check-btn ${child.done ? 'checked' : ''}`}
            onClick={() => onToggle(child.id)}
          >
            <span className="todo-checkbox-box sub-box">
              {child.done && <Check size={11} strokeWidth={3} />}
            </span>
          </button>
          <span className="sr-only">{child.text}</span>
          <input
            ref={el => setLineInputRef(child.id, el)}
            type="text"
            className="todo-line-input"
            aria-label="할 일 내용 편집"
            placeholder="할 일을 입력하세요…"
            value={child.text}
            onFocus={() => setSelectedTodoId(child.id)}
            onChange={e => onUpdateText(child.id, e.target.value)}
            onKeyDown={e => handleLineKeyDown(e, child)}
          />
          <div className="todo-item-badges">
            <button
              type="button"
              className="icon-button small todo-delete-btn"
              aria-label={`${child.text} 삭제`}
              title="하위 항목 삭제"
              onClick={e => {
                e.stopPropagation();
                onDelete(child.id);
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {subChildren.length > 0 && (
          <div className="todo-children-list is-nested" role="group" aria-label={`${child.text} 하위 항목`}>
            {subChildren.map(grandChild => renderChildNode(grandChild, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  function renderTodoGroup(todo: TodoItem) {
        const children = childrenMap.get(todo.id) ?? [];

    const hasTree = children.length > 0;
    const isSelected = selectedTodoId === todo.id;
    const isDraggingThis = draggingTodoId === todo.id;
    const isDropTarget = dragOverTodoId === todo.id;

    return (
      <div
        key={todo.id}
        className={`todo-group ${hasTree ? 'has-children' : ''} ${todo.done ? 'is-group-done' : ''}`}
      >
        <div
          className={`todo-item-row ${todo.done ? 'is-done' : ''}  ${isSelected ? 'is-selected' : ''} ${isDraggingThis ? 'is-dragging-item' : ''} ${isDropTarget ? 'is-drop-target' : ''}`}
          data-todo-id={todo.id}
          draggable={!todo.done}
          onDragStart={e => handleDragStart(e, todo.id)}
          onDragOver={e => handleDragOver(e, todo.id)}
          onDragLeave={() => handleDragLeave(todo.id)}
          onDrop={e => handleDrop(e, todo.id)}
          onDragEnd={handleDragEnd}
          onClick={() => setSelectedTodoId(todo.id)}
        >
          <span className="todo-drag-handle" title="드래그하여 순서 변경" aria-hidden="true">
            <GripVertical size={13} />
          </span>
          <button
            type="button"
            role="checkbox"
            aria-checked={todo.done}
            aria-label={`${todo.text || '빈 항목'} 완료 체크`}
            className={`todo-check-btn ${todo.done ? 'checked' : ''}`}
            onClick={() => onToggle(todo.id)}
          >
            <span className="todo-checkbox-box">
              {todo.done && <Check size={13} strokeWidth={3} />}
            </span>
          </button>
          <span className="sr-only">{todo.text}</span>
          <input
            ref={el => setLineInputRef(todo.id, el)}
            type="text"
            className="todo-line-input"
            aria-label="할 일 내용 편집"
            placeholder="할 일을 입력하세요…"
            value={todo.text}
            onFocus={() => setSelectedTodoId(todo.id)}
            onChange={e => onUpdateText(todo.id, e.target.value)}
            onKeyDown={e => handleLineKeyDown(e, todo)}
          />
          <div className="todo-item-badges">
            {!todo.done && todo.createdAtDate === todayKey && (
              <span className="todo-badge today-badge">오늘</span>
            )}
            {todo.done && (
              <span className="todo-badge done-badge">완료</span>
            )}
            <button
              type="button"
              className="icon-button small todo-delete-btn"
              aria-label={`${todo.text} 삭제`}
              title="할 일 삭제"
              onClick={e => {
                e.stopPropagation();
                onDelete(todo.id);
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {hasTree && (
          <div className="todo-children-list" role="group" aria-label={`${todo.text} 하위 항목`}>
            {children.map(child => renderChildNode(child, 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="todos-workspace" aria-label="누적 TODO 관리">
      <section className="card todo-current-panel" aria-label="현재 해야 할 일">
        <PanelHeading
          title="List"
          action={<span className="count-pill">{activeTodos.length}</span>}
        />
        <div className="todo-items-list">
          {activeTodos.map(renderTodoGroup)}
        </div>
        {renderComposerLine()}

        {completedTodayTodos.length > 0 && (
          <div className="todo-completed-tray" aria-label="오늘 완료한 항목">
            <div className="todo-completed-list">
              {completedTodayTodos.map(renderTodoGroup)}
            </div>
          </div>
        )}
      </section>

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
    </section>
  );
}

export function OverviewTodoSection({
  todos,
  todayKey,
  onToggle,
  onAdd,
  onOpenTodos,
}: {
  todos: TodoItem[];
  todayKey: string;
  onToggle: (id: string) => void;
  onAdd: (text: string) => void;
  onOpenTodos: () => void;
}) {
  const [quickText, setQuickText] = useState('');
  const remaining = getRemainingTodos(todos);
  const childrenMap = useMemo(() => buildChildrenMap(todos), [todos]);

  function submitQuick(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = quickText.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setQuickText('');
  }

  return (
    <section className="card overview-panel overview-todos" aria-label="남아있는 TODO">
      <div className="panel-heading">
        <div className="panel-title-inline">
          <h2>To-Do</h2>
          <span className="count-pill">{remaining.length}</span>
        </div>
        <button className="text-button" onClick={onOpenTodos}>
          TODO 관리
          <ArrowRight size={15} />
        </button>
      </div>

      <form className="overview-todo-quick todo-composer-row" onSubmit={submitQuick}>
        <span className="todo-checkbox-box composer-plus-box" aria-hidden="true">
          <Plus size={13} strokeWidth={2.5} className="composer-plus-icon" />
        </span>
        <input
          type="text"
          className="todo-line-input"
          aria-label="홈 빠른 할 일 추가"
          placeholder="새 할 일 입력… (Enter 등록)"
          value={quickText}
          onChange={e => setQuickText(e.target.value)}
        />
        <kbd className="key-hint">Enter 등록</kbd>
      </form>

      <div className="overview-todo-list">
        {remaining.map(todo => {
                    const children = childrenMap.get(todo.id) ?? [];

          return (
            <div key={todo.id} className="overview-todo-group">
              <div className="overview-todo-row">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={todo.done}
                  aria-label={`${todo.text} 완료 체크`}
                  className="todo-check-btn"
                  onClick={() => onToggle(todo.id)}
                >
                  <span className="todo-checkbox-box">
                    {todo.done && <Check size={13} strokeWidth={3} />}
                  </span>
                  <span className="todo-item-text">{todo.text}</span>
                </button>
                <div className="todo-item-badges">
                  {todo.createdAtDate === todayKey && (
                    <span className="todo-badge today-badge">오늘</span>
                  )}
                </div>
              </div>
              {children.length > 0 && (
                <div className="overview-subtodo-list">
                  {children.map(function renderOverviewSub(child) {
                    const subChildren = childrenMap.get(child.id) ?? [];

                    return (
                      <div key={child.id} className="todo-subitem-group">
                        <div className={`todo-subitem-row ${child.done ? 'is-done' : ''}`}>
                          <span className="subitem-branch" aria-hidden="true" />
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={child.done}
                            aria-label={`${child.text} 완료 체크`}
                            className={`todo-check-btn ${child.done ? 'checked' : ''}`}
                            onClick={() => onToggle(child.id)}
                          >
                            <span className="todo-checkbox-box sub-box">
                              {child.done && <Check size={11} strokeWidth={3} />}
                            </span>
                            <span className="todo-item-text">{child.text}</span>
                          </button>
                        </div>
                        {subChildren.length > 0 && (
                          <div className="overview-subtodo-list is-nested">
                            {subChildren.map(renderOverviewSub)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {!remaining.length && (
          <p className="preview-empty">남아있는 할 일이 없어요.</p>
        )}
      </div>
    </section>
  );
}
