import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, GripVertical, Plus, Trash2 } from 'lucide-react';
import { PanelHeading } from '../../components/ui';
import type { TodoItem } from '../../data/model';
import { buildChildrenMap, getComposerTargetParent, getCurrentTodoList } from './todoModel';

export function TodoEditor({
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

  const displayedCurrentTodos = getCurrentTodoList(todos, todayKey);
  const activeTodos = displayedCurrentTodos.filter(todo => !todo.done);
  const completedTodayTodos = displayedCurrentTodos.filter(todo => todo.done);

  const targetParent = getComposerTargetParent(todos, composerDepth);

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

  function renderTodoGroup(todo: TodoItem, depth = 0) {
    const children = childrenMap.get(todo.id) ?? [];
    const nested = depth > 0;
    const groupClass = nested
      ? `todo-subitem-group depth-${Math.min(depth, 4)}`
      : `todo-group ${children.length ? 'has-children' : ''} ${todo.done ? 'is-group-done' : ''}`;

    return <div key={todo.id} className={groupClass}>
      <div
        className={`${nested ? 'todo-subitem-row' : 'todo-item-row'} ${todo.done ? 'is-done' : ''} ${selectedTodoId === todo.id ? 'is-selected' : ''} ${draggingTodoId === todo.id ? 'is-dragging-item' : ''} ${dragOverTodoId === todo.id ? 'is-drop-target' : ''}`}
        data-todo-id={nested ? undefined : todo.id}
        data-subtodo-id={nested ? todo.id : undefined}
        draggable={!todo.done}
        onDragStart={e => handleDragStart(e, todo.id)}
        onDragOver={e => handleDragOver(e, todo.id)}
        onDragLeave={() => handleDragLeave(todo.id)}
        onDrop={e => handleDrop(e, todo.id)}
        onDragEnd={handleDragEnd}
        onClick={() => setSelectedTodoId(todo.id)}
      >
        {nested && <span className="subitem-branch" aria-hidden="true" />}
        <span className="todo-drag-handle" title="드래그하여 순서 변경" aria-hidden="true"><GripVertical size={13} /></span>
        <button type="button" role="checkbox" aria-checked={todo.done}
          aria-label={`${todo.text || '빈 항목'} 완료 체크`}
          className={`todo-check-btn ${todo.done ? 'checked' : ''}`} onClick={() => onToggle(todo.id)}>
          <span className={`todo-checkbox-box${nested ? ' sub-box' : ''}`}>
            {todo.done && <Check size={nested ? 11 : 13} strokeWidth={3} />}
          </span>
        </button>
        <span className="sr-only">{todo.text}</span>
        <input ref={el => setLineInputRef(todo.id, el)} type="text" className="todo-line-input"
          aria-label="할 일 내용 편집" placeholder="할 일을 입력하세요…" value={todo.text}
          onFocus={() => setSelectedTodoId(todo.id)} onChange={e => onUpdateText(todo.id, e.target.value)}
          onKeyDown={e => handleLineKeyDown(e, todo)} />
        <div className="todo-item-badges">
          {!nested && !todo.done && todo.createdAtDate === todayKey && <span className="todo-badge today-badge">오늘</span>}
          {!nested && todo.done && <span className="todo-badge done-badge">완료</span>}
          <button type="button" className="icon-button small todo-delete-btn" aria-label={`${todo.text} 삭제`}
            title={nested ? '하위 항목 삭제' : '할 일 삭제'} onClick={e => { e.stopPropagation(); onDelete(todo.id); }}>
            <Trash2 size={nested ? 12 : 13} />
          </button>
        </div>
      </div>
      {children.length > 0 && <div className={`todo-children-list${nested ? ' is-nested' : ''}`} role="group" aria-label={`${todo.text} 하위 항목`}>
        {children.map(child => renderTodoGroup(child, depth + 1))}
      </div>}
    </div>;
  }

  return (
      <section className="card todo-current-panel" aria-label="현재 해야 할 일">
        <PanelHeading
          title="List"
          action={<span className="count-pill">{activeTodos.length}</span>}
        />
        <div className="todo-items-list">
          {activeTodos.map(todo => renderTodoGroup(todo))}
        </div>
        {renderComposerLine()}

        {completedTodayTodos.length > 0 && (
          <div className="todo-completed-tray" aria-label="오늘 완료한 항목">
            <div className="todo-completed-list">
              {completedTodayTodos.map(todo => renderTodoGroup(todo))}
            </div>
          </div>
        )}
      </section>
  );
}
