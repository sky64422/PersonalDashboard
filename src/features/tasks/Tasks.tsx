import { useState } from 'react';
import { ArrowUpRight, Eye, EyeOff, ListFilter, SquareCheck, GitBranch, CalendarDays } from 'lucide-react';
import { ALL, TASK_COLUMNS, TASK_STATUS, type Task, type TaskFilters } from '../../data/model';
import { filterTasks } from './filter';
import { useBoardMotion } from './useBoardMotion';
import { EmptyState, Modal, PriorityBadge, SearchInput, StatusBadge } from '../../components/ui';

export function TaskList({ tasks, onSelect, compact = false }: { tasks: Task[]; onSelect: (task: Task) => void; compact?: boolean }) {
  return <div className={`task-list ${compact ? 'compact' : ''}`}>
    {!compact && <div className="task-table-head"><span>업무</span><span>상태</span><span>우선순위</span><span>프로젝트</span></div>}
    {tasks.map(task => <button className="task-row" key={task.id} onClick={() => onSelect(task)}>
      <span className="task-main"><span className={`task-type ${task.project.startsWith('Atlas') ? 'lavender' : 'mint'}`}><SquareCheck size={16} /></span><span><span className="task-key">{task.key}</span><strong>{task.title}</strong>{compact && <span className="task-project">{task.project}</span>}</span></span>
      <StatusBadge status={task.status} /><PriorityBadge priority={task.priority} />{!compact && <span className="task-project">{task.project}</span>}{compact && <ArrowUpRight className="row-arrow" size={17} />}
    </button>)}
  </div>;
}
export function Tasks({ tasks, filters, setFilters, onSelect, hiddenTaskIds, onToggleHidden, reduceMotion }: { tasks: Task[]; filters: TaskFilters; setFilters: (filters: TaskFilters) => void; onSelect: (task: Task) => void; hiddenTaskIds: string[]; onToggleHidden: (id: string) => void; reduceMotion: boolean }) {
  const [showHidden, setShowHidden] = useState(false);
  const owned = filterTasks(tasks, { ...filters, query: '', status: ALL }, { includeClosed: true });
  const hiddenCount = owned.filter(task => hiddenTaskIds.includes(task.id)).length;
  const scoped = owned.filter(task => hiddenTaskIds.includes(task.id) === showHidden);
  const matched = filterTasks(scoped, { ...filters, status: ALL }, { includeClosed: true });
  const columns = TASK_COLUMNS.map(column => ({ ...column, tasks: matched.filter(task => column.statuses.includes(task.status) && (filters.status === ALL || filters.status === column.id)) }));
  const boardRef = useBoardMotion(columns.map(column => column.tasks.map(task => task.id).join(',')).join('|'), reduceMotion);
  const visibleCount = columns.reduce((total, column) => total + column.tasks.length, 0);
  const activeCount = scoped.filter(task => task.status !== TASK_STATUS.closed).length;
  const filtered = !!filters.query.trim() || filters.status !== ALL;
  return <section className="workflow" aria-label="내 Jira 업무 보드">
    <div className="workflow-heading"><div><span className="workflow-eyebrow">YOUR WORK, IN MOTION</span><h2>한 걸음씩, 완료를 향해.</h2><p>작은 시작부터 마지막 확인까지, 내 업무의 흐름을 살펴보세요.</p></div><div className="workflow-summary"><span><strong>{activeCount}</strong> 진행할 업무</span><i /><span><strong>{scoped.length - activeCount}</strong> 마무리</span></div></div>
    <div className="board-toolbar"><SearchInput value={filters.query} onChange={query => setFilters({ ...filters, query })} placeholder="업무 이름, 키, 프로젝트 검색" label="업무 검색" /><div className="select-wrap"><ListFilter size={15} /><select aria-label="업무 정렬" value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value as TaskFilters['sort'] })}><option value="priority">우선순위순</option><option value="updated">최근 업데이트순</option></select></div><select aria-label="업무 상태" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value={ALL}>모든 상태</option>{TASK_COLUMNS.map(column => <option key={column.id} value={column.id}>{column.label}</option>)}</select><button className="button secondary hidden-toggle" aria-pressed={showHidden} onClick={() => { setShowHidden(!showHidden); setFilters({ ...filters, query: '', status: ALL }); }}><EyeOff size={14} />숨긴 업무 <span>{hiddenCount}</span></button>{filtered && <button className="text-button" onClick={() => setFilters({ ...filters, query: '', status: ALL })}>필터 초기화</button>}</div>
    {showHidden && <div className="hidden-task-note"><EyeOff size={15} /><span>내 대시보드에서만 숨긴 업무입니다. Jira 상태는 변경되지 않습니다.</span></div>}
    {!visibleCount && (showHidden && !filtered ? <div className="empty-state"><Eye size={26} /><h3>숨긴 업무가 없어요</h3><p>다시 표시한 업무는 기본 보드에서 확인할 수 있어요.</p></div> : <EmptyState />)}
    <div className="task-board-scroll" role="region" aria-label="상태별 업무 열 — 좁은 창에서는 가로로 스크롤" tabIndex={0}>
      <div className="task-board" ref={boardRef}>{columns.map(column => <section className={`task-column column-${column.id}`} key={column.id} aria-label={column.label} tabIndex={-1}>
        <header className="column-heading"><div><span className="column-status-mark" aria-hidden="true" /><h3>{column.label}</h3><span className="column-count">{column.tasks.length}</span></div><p>{column.description}</p></header>
        <div className="column-cards">{column.tasks.map(task => <article className="task-tile" key={task.id} data-task-id={task.id}><button className="task-open" onClick={() => onSelect(task)}>
          <span className="tile-top"><span className="tile-key"><SquareCheck size={13} />{task.key}</span><PriorityBadge priority={task.priority} /></span>
          <strong className="tile-title">{task.title}</strong><span className="tile-description">{task.description}</span>
          <span className="tile-project"><span aria-hidden="true" />{task.project}</span>
          <span className="tile-footer"><span><CalendarDays size={12} />{new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit' }).format(new Date(task.updatedAt))} 업데이트</span><span className="tile-avatar" aria-label="담당자 나">ME</span></span>
        </button><button className="task-hide-action" aria-label={`${task.key} ${showHidden ? '다시 표시' : '숨기기'}`} onClick={event => { const column = event.currentTarget.closest('section'); onToggleHidden(task.id); column?.focus(); }}>{showHidden ? <Eye size={13} /> : <EyeOff size={13} />}{showHidden ? '다시 표시' : '숨기기'}</button></article>)}</div>
        {!column.tasks.length && <div className="column-empty"><span aria-hidden="true">—</span><p>{filtered ? '조건에 맞는 업무가 없어요' : '아직 배치된 업무가 없어요'}</p></div>}
      </section>)}</div>
    </div>
    <div className="board-caption"><span><span className="tiny-dot" />{showHidden ? '숨긴 업무' : '나에게 할당된 업무'} · {visibleCount} / {scoped.length}개 표시</span><span>카드를 선택하면 상세 내용을 볼 수 있어요</span></div>
  </section>;
}
export function TaskDetails({ task, onClose, hidden, onToggleHidden }: { task: Task | null; onClose: () => void; hidden: boolean; onToggleHidden: () => void }) {
  return <Modal open={!!task} onClose={onClose} title={task?.key ?? 'Task'} description="내 업무 상세 · 샘플 데이터" panel>{task && <div className="task-details"><div className="detail-status"><StatusBadge status={task.status} /><PriorityBadge priority={task.priority} /></div><h2>{task.title}</h2><dl className="detail-fields"><div><dt><GitBranch size={16} />프로젝트</dt><dd>{task.project}</dd></div><div><dt>담당자</dt><dd><span className="mini-avatar">ME</span> 나</dd></div><div><dt><CalendarDays size={16} />업데이트</dt><dd>{new Date(task.updatedAt).toLocaleString('ko-KR')}</dd></div></dl><button className="button secondary detail-hide-action" onClick={onToggleHidden}>{hidden ? <Eye size={15} /> : <EyeOff size={15} />}{hidden ? '업무 다시 표시' : '이 업무 숨기기'}</button><h3>업무 설명</h3><p>{task.description}</p><div className="note-box">지금은 샘플 업무입니다. 회사의 Jira를 연결하면 이곳에서 실제 업무를 확인할 수 있습니다.</div></div>}</Modal>;
}
