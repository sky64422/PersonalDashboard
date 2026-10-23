import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Box, Check, CircleDashed, FileBox, GitBranch, Layers3, Search, Sparkles, SquareCheck } from 'lucide-react';
import { TASK_STATUS, type Build, type FirmwareArtifact, type Task, type ViewId } from '../../data/model';
import { PanelHeading, StatusBadge } from '../../components/ui';
import { TaskList } from '../tasks/Tasks';

const PREVIEW_LIMIT = 3;
const PREVIEW_MODES = [
  { id: 'priority', label: '우선순위' },
  { id: TASK_STATUS.progress, label: '진행 중' },
  { id: TASK_STATUS.review, label: '리뷰 대기' },
] as const;

export function Overview({ tasks, builds, firmware, navigate, onTask, onBuild, onFirmwareSearch }: { tasks: Task[]; builds: Build[]; firmware: FirmwareArtifact[]; navigate: (view: ViewId) => void; onTask: (task: Task) => void; onBuild: (build: Build) => void; onFirmwareSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');
  const [previewMode, setPreviewMode] = useState<string>('priority');
  const progress = tasks.filter(t => t.status === TASK_STATUS.progress).length;
  const review = tasks.filter(t => t.status === TASK_STATUS.review).length;
  const high = tasks.filter(t => t.priority === 'High');
  const focus = high[0];
  const matchingTasks = previewMode === 'priority' ? high : tasks.filter(task => task.status === previewMode);
  const priorityPreview = matchingTasks.slice(0, PREVIEW_LIMIT);
  const counts = [
    { title: '내 업무', value: tasks.length, sub: '나에게 할당된 미종료 업무', icon: SquareCheck, color: 'lavender', view: 'tasks' as const },
    { title: '진행 중', value: progress, sub: '지금 만들어가고 있는 것들', icon: CircleDashed, color: 'mint', view: 'tasks' as const },
    { title: '리뷰 대기', value: review, sub: '한 번 더 살펴볼 업무', icon: Check, color: 'peach', view: 'tasks' as const },
    { title: '빌드 기록', value: builds.length, sub: '샘플 및 데모 빌드', icon: Layers3, color: 'blue', view: 'builds' as const },
  ];
  return <>
    <div className="metric-grid">{counts.map(({ title, value, sub, icon: Icon, color, view }) => <button className="metric-card" key={title} onClick={() => navigate(view)}><div className="metric-top"><span>{title}</span><span className={`square-icon ${color}`}><Icon size={18} /></span></div><div className="metric-value">{value.toString().padStart(2, '0')}<ArrowUpRight size={18} /></div><p>{sub}</p></button>)}</div>
    <div className="overview-grid"><div className="overview-main"><section className="card overview-tasks"><PanelHeading title="My tasks" subtitle="오늘, 여기서부터 시작해요" action={<button className="text-button" onClick={() => navigate('tasks')}>전체 보기<ArrowUpRight size={15} /></button>} /><div className="preview-toolbar"><div className="preview-switch" role="group" aria-label="홈 업무 보기">{PREVIEW_MODES.map(mode => <button key={mode.id} aria-pressed={previewMode === mode.id} onClick={() => setPreviewMode(mode.id)}>{mode.label}<span>{mode.id === 'priority' ? high.length : tasks.filter(task => task.status === mode.id).length}</span></button>)}</div><span className="subtle-label">Assigned to me</span></div><div className="preview-results" aria-live="polite">{priorityPreview.length ? <TaskList tasks={priorityPreview} onSelect={onTask} compact /> : <p className="preview-empty">이 분류에 해당하는 업무가 없어요.</p>}</div><div className="card-footnote"><span className="tiny-dot purple-dot" />Closed 제외 · {matchingTasks.length}개 중 {priorityPreview.length}개 표시</div></section>
      <section className="card recent-builds"><PanelHeading title="Recent builds" subtitle="코드에서 결과물까지" action={<button className="text-button" onClick={() => navigate('builds')}>빌드 보기<ArrowUpRight size={15} /></button>} />{builds.slice(0, 2).map(build => <button key={build.id} className="recent-build-row" onClick={() => onBuild(build)}><span className="square-icon mint"><Box size={19} /></span><span className="recent-build-name"><strong>{build.target}</strong><small><GitBranch size={11} />{build.branch}</small></span><StatusBadge status={build.status} /><span className="build-duration mono">{build.duration}</span><ArrowRight size={16} /></button>)}</section></div>
      <aside className="overview-side"><section className="focus-card"><div className="focus-top"><span><Sparkles size={13} />오늘의 포커스</span><span>{focus ? '01' : '00'} / {high.length.toString().padStart(2, '0')}</span></div><div className="focus-orbit" aria-hidden="true"><i /><i /><i /></div><div className="focus-content"><span className="focus-key">{focus?.key ?? 'NO FOCUS'}</span><h2>{focus?.title ?? '지금 표시할 우선순위 업무가 없어요'}</h2><p>가장 중요한 일 하나에,<br />깊이 집중하는 시간.</p>{focus && <button className="button focus-button" onClick={() => onTask(focus)}>업무 살펴보기<ArrowUpRight size={16} /></button>}</div></section>
      <section className="card quick-firmware"><span className="square-icon lavender"><FileBox size={21} /></span><h2>Find your firmware</h2><p>필요한 파일을, 헤매지 않고.</p><form onSubmit={e => { e.preventDefault(); onFirmwareSearch(query); }}><div className="quick-search"><Search size={15} /><input aria-label="빠른 펌웨어 검색" placeholder="모델 또는 버전 검색" value={query} onChange={e => setQuery(e.target.value)} /><button aria-label="펌웨어 찾아보기" type="submit"><ArrowRight size={16} /></button></div></form><span className="library-count">{firmware.length}개의 샘플 펌웨어 <span>바로 찾아보세요</span></span></section></aside>
    </div>
    <div className="workspace-foot"><span><span className="tiny-dot" />A little clarity. A lot of possibility.</span><span>Made for your flow.</span></div>
  </>;
}
