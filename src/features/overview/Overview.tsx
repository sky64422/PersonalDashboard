import { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Box, Check, CircleDashed, FileBox, GitBranch, Layers3, Search, Sparkles, SquareCheck } from 'lucide-react';
import { TASK_STATUS, type Build, type FirmwareArtifact, type Task, type TodoItem, type ViewId } from '../../data/model';
import { PanelHeading, StatusBadge } from '../../components/ui';
import { TaskList } from '../tasks/Tasks';
import { OverviewTodoSection } from '../todos/Todos';

const PREVIEW_LIMIT = 3;
const PREVIEW_MODES = [
  { id: 'priority', label: '우선순위' },
  { id: TASK_STATUS.progress, label: '진행 중' },
  { id: TASK_STATUS.review, label: '리뷰 대기' },
] as const;

export function Overview({
  tasks,
  todos,
  todayKey,
  onToggleTodo,
  onAddTodo,
  builds,
  firmware,
  navigate,
  onTask,
  onBuild,
  onFirmwareSearch,
}: {
  tasks: Task[];
  todos: TodoItem[];
  todayKey: string;
  onToggleTodo: (id: string) => void;
  onAddTodo: (text: string) => void;
  builds: Build[];
  firmware: FirmwareArtifact[];
  navigate: (view: ViewId) => void;
  onTask: (task: Task) => void;
  onBuild: (build: Build) => void;
  onFirmwareSearch: (query: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [previewMode, setPreviewMode] = useState<string>('priority');

  const progress = useMemo(() => tasks.filter(t => t.status === TASK_STATUS.progress).length, [tasks]);
  const review = useMemo(() => tasks.filter(t => t.status === TASK_STATUS.review).length, [tasks]);
  const high = useMemo(() => tasks.filter(t => t.priority === 'High'), [tasks]);
  const focus = high[0];
  const matchingTasks = useMemo(() => previewMode === 'priority' ? high : tasks.filter(task => task.status === previewMode), [previewMode, high, tasks]);
  const priorityPreview = useMemo(() => matchingTasks.slice(0, PREVIEW_LIMIT), [matchingTasks]);
  const counts = useMemo(() => [
    { title: '내 업무', value: tasks.length, icon: SquareCheck, color: 'lavender', view: 'tasks' as const },
    { title: '진행 중', value: progress, icon: CircleDashed, color: 'mint', view: 'tasks' as const },
    { title: '리뷰 대기', value: review, icon: Check, color: 'peach', view: 'tasks' as const },
    { title: '빌드 기록', value: builds.length, icon: Layers3, color: 'blue', view: 'builds' as const },
  ], [tasks.length, progress, review, builds.length]);
  return <>
    <div className="metric-grid">{counts.map(({ title, value, icon: Icon, color, view }) => <button className="metric-card" key={title} onClick={() => navigate(view)}><div className="metric-top"><span>{title}</span><span className={`square-icon ${color}`}><Icon size={18} /></span></div><div className="metric-value">{value.toString().padStart(2, '0')}<ArrowUpRight size={18} /></div></button>)}</div>
    <div className="overview-grid"><div className="overview-main"><section className="card overview-tasks"><PanelHeading title="My tasks" action={<button className="text-button" onClick={() => navigate('tasks')}>전체 보기<ArrowUpRight size={15} /></button>} /><div className="preview-toolbar"><div className="preview-switch" role="group" aria-label="홈 업무 보기">{PREVIEW_MODES.map(mode => <button key={mode.id} aria-pressed={previewMode === mode.id} onClick={() => setPreviewMode(mode.id)}>{mode.label}<span>{mode.id === 'priority' ? high.length : tasks.filter(task => task.status === mode.id).length}</span></button>)}</div></div><div className="preview-results" aria-live="polite">{priorityPreview.length ? <TaskList tasks={priorityPreview} onSelect={onTask} compact /> : <p className="preview-empty">해당하는 업무가 없어요.</p>}</div></section>
      <OverviewTodoSection todos={todos} todayKey={todayKey} onToggle={onToggleTodo} onAdd={onAddTodo} onOpenTodos={() => navigate('todos')} />
      <section className="card recent-builds"><PanelHeading title="Recent builds" action={<button className="text-button" onClick={() => navigate('builds')}>빌드 보기<ArrowUpRight size={15} /></button>} />{builds.slice(0, 2).map(build => <button key={build.id} className="recent-build-row" onClick={() => onBuild(build)}><span className="square-icon mint"><Box size={19} /></span><span className="recent-build-name"><strong>{build.target}</strong><small><GitBranch size={11} />{build.branch}</small></span><StatusBadge status={build.status} /><span className="build-duration mono">{build.duration}</span><ArrowRight size={16} /></button>)}</section></div>
      <aside className="overview-side"><section className="focus-card"><div className="focus-top"><span><Sparkles size={13} />오늘의 포커스</span><span>{focus ? '01' : '00'} / {high.length.toString().padStart(2, '0')}</span></div><div className="focus-orbit" aria-hidden="true"><i /><i /><i /></div><div className="focus-content"><span className="focus-key">{focus?.key ?? 'NO FOCUS'}</span><h2>{focus?.title ?? '우선순위 업무가 없어요'}</h2>{focus && <button className="button focus-button" onClick={() => onTask(focus)}>업무 살펴보기<ArrowUpRight size={16} /></button>}</div></section>
      <section className="card quick-firmware"><div className="quick-firmware-head"><span className="square-icon lavender"><FileBox size={21} /></span><span className="count-pill">{firmware.length}</span></div><h2>Firmware</h2><form onSubmit={e => { e.preventDefault(); onFirmwareSearch(query); }}><div className="quick-search"><Search size={15} /><input aria-label="빠른 펌웨어 검색" placeholder="모델 또는 버전 검색" value={query} onChange={e => setQuery(e.target.value)} /><button aria-label="펌웨어 찾아보기" type="submit"><ArrowRight size={16} /></button></div></form></section></aside>
    </div>
  </>;
}
