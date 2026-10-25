import { useMemo, useState } from 'react';
import { ArrowRight, Check, Plus } from 'lucide-react';
import type { TodoItem } from '../../data/model';
import { buildChildrenMap, getRemainingTodos } from './todoModel';

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
