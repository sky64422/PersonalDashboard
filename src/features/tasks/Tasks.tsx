import { useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, ListFilter, SquareCheck, GitBranch, CalendarDays } from 'lucide-react';
import { ALL, PAGE_SIZE, TASK_STATUS, type Task, type TaskFilters } from '../../data/model';
import { filterTasks } from './filter';
import { EmptyState, Modal, PanelHeading, PriorityBadge, SearchInput, StatusBadge } from '../../components/ui';

export function TaskList({ tasks, onSelect, compact = false }: { tasks: Task[]; onSelect: (task: Task) => void; compact?: boolean }) {
  return <div className={`task-list ${compact ? 'compact' : ''}`}>
    {!compact && <div className="task-table-head"><span>업무</span><span>상태</span><span>우선순위</span><span>프로젝트</span></div>}
    {tasks.map(task => <button className="task-row" key={task.id} onClick={() => onSelect(task)}>
      <span className="task-main"><span className={`task-type ${task.project.startsWith('Atlas') ? 'lavender' : 'mint'}`}><SquareCheck size={16} /></span><span><span className="task-key">{task.key}</span><strong>{task.title}</strong>{compact && <span className="task-project">{task.project}</span>}</span></span>
      <StatusBadge status={task.status} /><PriorityBadge priority={task.priority} />{!compact && <span className="task-project">{task.project}</span>}{compact && <ArrowUpRight className="row-arrow" size={17} />}
    </button>)}
  </div>;
}
export function Tasks({ tasks, filters, setFilters, onSelect }: { tasks: Task[]; filters: TaskFilters; setFilters: (filters: TaskFilters) => void; onSelect: (task: Task) => void }) {
  const [page, setPage] = useState(0);
  const results = filterTasks(tasks, filters);
  const change = (patch: Partial<TaskFilters>) => { setFilters({ ...filters, ...patch }); setPage(0); };
  const maxPage = Math.max(0, Math.ceil(results.length / PAGE_SIZE) - 1);
  const safePage = Math.min(page, maxPage);
  const owned = filterTasks(tasks, { ...filters, query: '', status: ALL });
  return <>
    <div className="task-status-overview">{[TASK_STATUS.progress, TASK_STATUS.review, TASK_STATUS.todo, TASK_STATUS.done].map(status => <button key={status} className={`status-summary ${filters.status === status ? 'selected' : ''}`} onClick={() => change({ status: filters.status === status ? ALL : status })}><StatusBadge status={status} /><strong>{owned.filter(t => t.status === status).length.toString().padStart(2, '0')}</strong><span>내 업무</span></button>)}</div>
    <section className="card task-card"><PanelHeading title="Assigned to me" subtitle="내 담당 업무 · Closed 제외" action={<span className="count-pill">{owned.length} tasks</span>} />
      <div className="filter-bar"><SearchInput value={filters.query} onChange={query => change({ query })} placeholder="업무 이름, 키, 프로젝트 검색" label="업무 검색" /><div className="select-wrap"><ListFilter size={15} /><select aria-label="업무 정렬" value={filters.sort} onChange={e => change({ sort: e.target.value as TaskFilters['sort'] })}><option value="priority">우선순위순</option><option value="updated">최근 업데이트순</option></select></div><select aria-label="업무 상태" value={filters.status} onChange={e => change({ status: e.target.value })}><option value={ALL}>모든 상태</option>{Object.values(TASK_STATUS).filter(s => s !== TASK_STATUS.closed).map(s => <option key={s}>{s}</option>)}</select></div>
      {results.length ? <TaskList tasks={results.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)} onSelect={onSelect} /> : <EmptyState onReset={() => change({ query: '', status: ALL })} />}
      <div className="table-footer"><span>{results.length}개 업무 중 {results.length ? safePage * PAGE_SIZE + 1 : 0}–{Math.min((safePage + 1) * PAGE_SIZE, results.length)}</span><div className="pagination"><button className="icon-button" aria-label="이전 페이지" disabled={!safePage} onClick={() => setPage(safePage - 1)}><ChevronLeft size={17} /></button><span>{safePage + 1}</span><button className="icon-button" aria-label="다음 페이지" disabled={safePage >= maxPage} onClick={() => setPage(safePage + 1)}><ChevronRight size={17} /></button></div></div>
    </section>
  </>;
}
export function TaskDetails({ task, onClose }: { task: Task | null; onClose: () => void }) {
  return <Modal open={!!task} onClose={onClose} title={task?.key ?? 'Task'} description="내 업무 상세 · 샘플 데이터" panel>{task && <div className="task-details"><div className="detail-status"><StatusBadge status={task.status} /><PriorityBadge priority={task.priority} /></div><h2>{task.title}</h2><dl className="detail-fields"><div><dt><GitBranch size={16} />프로젝트</dt><dd>{task.project}</dd></div><div><dt>담당자</dt><dd><span className="mini-avatar">ME</span> 나</dd></div><div><dt><CalendarDays size={16} />업데이트</dt><dd>{new Date(task.updatedAt).toLocaleString('ko-KR')}</dd></div></dl><h3>업무 설명</h3><p>{task.description}</p><div className="note-box">지금은 샘플 업무입니다. 회사의 Jira를 연결하면 이곳에서 실제 업무를 확인할 수 있습니다.</div></div>}</Modal>;
}
