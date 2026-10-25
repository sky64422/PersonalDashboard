import { memo, useMemo, useState } from 'react';
import { Eye, EyeOff, ListFilter, SquareCheck, GitBranch, CalendarDays } from 'lucide-react';
import { ALL, TASK_COLUMNS, type Task, type TaskFilters } from '../../data/model';
import { filterTasks } from './filter';
import { useBoardMotion } from './useBoardMotion';
import { EmptyState, Modal, PriorityBadge, SearchInput, StatusBadge } from '../../components/ui';

export const TaskList = memo(function TaskList({ tasks, onSelect }: { tasks: Task[]; onSelect: (task: Task) => void }) {
  return <div className="task-list">
    <div className="task-table-head"><span>업무</span><span>상태</span><span>우선순위</span><span>프로젝트</span></div>
    {tasks.map(task => <button className="task-row" key={task.id} onClick={() => onSelect(task)}>
      <span className="task-main"><span className={`task-type ${task.project.startsWith('Atlas') ? 'lavender' : 'mint'}`}><SquareCheck size={16} /></span><span><span className="task-key">{task.key}</span><strong>{task.title}</strong></span></span>
      <StatusBadge status={task.status} /><PriorityBadge priority={task.priority} /><span className="task-project">{task.project}</span>
    </button>)}
  </div>;
});
export function Tasks({ tasks, filters, setFilters, onSelect, hiddenTaskIds, onToggleHidden, reduceMotion }: { tasks: Task[]; filters: TaskFilters; setFilters: (filters: TaskFilters) => void; onSelect: (task: Task) => void; hiddenTaskIds: string[]; onToggleHidden: (id: string) => void; reduceMotion: boolean }) {
  const [showHidden, setShowHidden] = useState(false);
  const hiddenSet = useMemo(() => new Set(hiddenTaskIds), [hiddenTaskIds]);
  const owned = useMemo(() => filterTasks(tasks, { ...filters, query: '', status: ALL }, { includeClosed: true }), [tasks, filters.assigneeId, filters.sort]);
  const hiddenCount = useMemo(() => owned.filter(task => hiddenSet.has(task.id)).length, [owned, hiddenSet]);
  const scoped = useMemo(() => owned.filter(task => hiddenSet.has(task.id) === showHidden), [owned, hiddenSet, showHidden]);
  const matched = useMemo(() => filterTasks(scoped, { ...filters, status: ALL }, { includeClosed: true }), [scoped, filters]);
  const columns = useMemo(() => TASK_COLUMNS.map(column => ({ ...column, tasks: matched.filter(task => column.statuses.includes(task.status) && (filters.status === ALL || filters.status === column.id)) })), [matched, filters.status]);
  const layoutKey = useMemo(() => columns.map(column => column.tasks.map(task => task.id).join(',')).join('|'), [columns]);
  const boardRef = useBoardMotion(layoutKey, reduceMotion);
  const visibleCount = useMemo(() => columns.reduce((total, column) => total + column.tasks.length, 0), [columns]);
  const filtered = !!filters.query.trim() || filters.status !== ALL;
  return <section className="workflow" aria-label="내 Jira 업무 보드">
    <div className="board-toolbar"><SearchInput value={filters.query} onChange={query => setFilters({ ...filters, query })} placeholder="업무 이름, 키, 프로젝트 검색" label="업무 검색" /><div className="select-wrap"><ListFilter size={15} /><select aria-label="업무 정렬" value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value as TaskFilters['sort'] })}><option value="priority">우선순위순</option><option value="updated">최근 업데이트순</option></select></div><select aria-label="업무 상태" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value={ALL}>모든 상태</option>{TASK_COLUMNS.map(column => <option key={column.id} value={column.id}>{column.label}</option>)}</select><button className="button secondary hidden-toggle" aria-pressed={showHidden} onClick={() => { setShowHidden(!showHidden); setFilters({ ...filters, query: '', status: ALL }); }}><EyeOff size={14} />숨긴 업무 <span>{hiddenCount}</span></button>{filtered && <button className="text-button" onClick={() => setFilters({ ...filters, query: '', status: ALL })}>필터 초기화</button>}</div>
    {!visibleCount && (showHidden && !filtered ? <div className="empty-state"><Eye size={26} /><h3>숨긴 업무가 없어요</h3></div> : <EmptyState />)}
    <div className="task-board-scroll" role="region" aria-label="상태별 업무 열 — 좁은 창에서는 가로로 스크롤" tabIndex={0}>
      <div className="task-board" ref={boardRef}>{columns.map(column => <section className={`task-column column-${column.id}`} key={column.id} aria-label={column.label} tabIndex={-1}>
        <header className="column-heading"><div><span className="column-status-mark" aria-hidden="true" /><h3>{column.label}</h3><span className="column-count">{column.tasks.length}</span></div></header>
        <div className="column-cards">{column.tasks.map(task => <article className="task-tile" key={task.id} data-task-id={task.id}><button className="task-open" onClick={() => onSelect(task)}>
          <span className="tile-top"><span className="tile-key"><SquareCheck size={13} />{task.key}</span></span>
          <strong className="tile-title">{task.title}</strong>
        </button><button className="task-hide-action" title={showHidden ? '다시 표시' : '숨기기'} aria-label={`${task.key} ${showHidden ? '다시 표시' : '숨기기'}`} onClick={event => { const column = event.currentTarget.closest('section'); onToggleHidden(task.id); column?.focus(); }}>{showHidden ? <Eye size={13} /> : <EyeOff size={13} />}</button></article>)}</div>
        {!column.tasks.length && <div className="column-empty"><span aria-hidden="true">—</span></div>}
      </section>)}</div>
    </div>
  </section>;
}
export const TaskDetails = memo(function TaskDetails({ task, onClose, hidden, onToggleHidden }: { task: Task | null; onClose: () => void; hidden: boolean; onToggleHidden: () => void }) {
  return <Modal open={!!task} onClose={onClose} title={task?.key ?? 'Task'} panel>{task && <div className="task-details"><div className="detail-status"><StatusBadge status={task.status} /><PriorityBadge priority={task.priority} /></div><h2>{task.title}</h2><dl className="detail-fields"><div><dt><GitBranch size={16} />프로젝트</dt><dd>{task.project}</dd></div><div><dt>담당자</dt><dd><span className="mini-avatar">ME</span> 나</dd></div><div><dt><CalendarDays size={16} />업데이트</dt><dd>{new Date(task.updatedAt).toLocaleString('ko-KR')}</dd></div></dl><button className="button secondary detail-hide-action" onClick={onToggleHidden}>{hidden ? <Eye size={15} /> : <EyeOff size={15} />}{hidden ? '업무 다시 표시' : '이 업무 숨기기'}</button><h3>업무 설명</h3><p>{task.description}</p></div>}</Modal>;
});
