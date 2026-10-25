import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Box, ChevronDown, FileBox, HelpCircle, LayoutGrid, ListTodo, PanelLeftClose, PanelLeftOpen, SlidersHorizontal, SquareCheck, X } from 'lucide-react';
import { ALL, DEMO_USER_ID, NAV_ITEMS, type Build, type BuildRequest, type FirmwareArtifact, type Task, type TaskFilters, type ViewId } from './data/model';
import { demoBuilds, demoFirmware, demoTasks } from './data/demo';
import { filterTasks } from './features/tasks/filter';
import { HIDDEN_TASKS_STORAGE_KEY, initialHiddenTasks } from './features/tasks/visibility';
import { TaskDetails, Tasks } from './features/tasks/Tasks';
import { Todos } from './features/todos/Todos';
import { useTodos } from './features/todos/useTodos';
import { createLargeHistoryDemo } from './features/todos/demoHistory';
import { formatDateKey, getRemainingTodos } from './features/todos/todoModel';
import { loadInitialTodos } from './features/todos/todoStorage';
import { BuildDetails, Builds } from './features/builds/Builds';
import { Firmware, FirmwareDetails } from './features/firmware/Firmware';
import { Overview } from './features/overview/Overview';
import { GlobalSearch } from './components/GlobalSearch';
import { Modal } from './components/ui';
import { applyTheme, initialTheme, initialThemeError, THEMES, THEME_STORAGE_KEY, type Theme } from './theme';

const APP_NAME = 'Friday';
const LARGE_HISTORY_PREVIEW = new URLSearchParams(window.location.search).get('todoHistory') === 'large';
const NAV_ICONS = { overview: LayoutGrid, tasks: SquareCheck, todos: ListTodo, builds: Box, firmware: FileBox };
const DEFAULT_FILTERS: TaskFilters = { assigneeId: DEMO_USER_ID, query: '', status: ALL, sort: 'priority' };
const DATE_FORMATTER = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('ko-KR', { weekday: 'long' });

export default function App() {
  const todayKey = useMemo(() => formatDateKey(), []);
  const initialTodoState = useMemo(() => LARGE_HISTORY_PREVIEW
    ? { todos: createLargeHistoryDemo(todayKey), error: '' }
    : loadInitialTodos(todayKey), [todayKey]);
  const [view, setView] = useState<ViewId>(LARGE_HISTORY_PREVIEW ? 'todos' : 'overview');
  const [collapsed, setCollapsed] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [builds, setBuilds] = useState(demoBuilds);
  const [firmwareQuery, setFirmwareQuery] = useState('');
  const [model, setModel] = useState(ALL);
  const [task, setTask] = useState<Task | null>(null);
  const [build, setBuild] = useState<Build | null>(null);
  const [artifact, setArtifact] = useState<FirmwareArtifact | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [info, setInfo] = useState<'settings' | 'help' | null>(null);
  const [notification, setNotification] = useState(initialThemeError || initialHiddenTasks.error || initialTodoState.error);
  const todoActions = useTodos(initialTodoState.todos, todayKey, LARGE_HISTORY_PREVIEW, setNotification);
  const { todos } = todoActions;
  const [hiddenTaskIds, setHiddenTaskIds] = useState(initialHiddenTasks.ids);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [reduceMotion, setReduceMotion] = useState(false);
  const owned = useMemo(() => filterTasks(demoTasks.filter(task => !hiddenTaskIds.includes(task.id)), DEFAULT_FILTERS), [hiddenTaskIds]);
  const remainingTodos = useMemo(() => getRemainingTodos(todos), [todos]);
  const nav = NAV_ITEMS.find(item => item.id === view)!;
  const todayDate = useMemo(() => DATE_FORMATTER.format(new Date()), []);
  const todayWeekday = useMemo(() => WEEKDAY_FORMATTER.format(new Date()), []);

  const searchOpenRef = useRef(searchOpen);
  searchOpenRef.current = searchOpen;

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (searchOpenRef.current || !document.querySelector('[role="dialog"][data-state="open"]')) {
          setSearchOpen(value => !value);
        }
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reduceMotion);
    return () => { delete document.documentElement.dataset.reducedMotion; };
  }, [reduceMotion]);

  function submitBuild(request: BuildRequest) {
    setBuilds(current => [{ ...request, id: `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, status: 'Queued', createdAt: new Date().toISOString(), duration: '—', demo: true }, ...current]);
    setNotification('데모 대기열에 추가했습니다. 실제 빌드는 실행되지 않았습니다.');
  }
  function changeTheme(next: Theme) {
    setTheme(next);
    applyTheme(next);
    try { localStorage.setItem(THEME_STORAGE_KEY, next); }
    catch { setNotification('테마를 저장하지 못했습니다. 이번 실행에만 적용됩니다.'); }
  }
  function toggleTaskHidden(id: string) {
    const wasHidden = hiddenTaskIds.includes(id);
    const next = wasHidden ? hiddenTaskIds.filter(hidden => hidden !== id) : [...hiddenTaskIds, id];
    setHiddenTaskIds(next);
    try {
      localStorage.setItem(HIDDEN_TASKS_STORAGE_KEY, JSON.stringify(next));
      setNotification(wasHidden ? '업무를 다시 표시합니다.' : '업무를 숨겼습니다. 보드의 숨긴 업무에서 다시 표시할 수 있습니다.');
    } catch { setNotification('숨김 설정을 저장하지 못했습니다. 이번 실행에만 적용됩니다.'); }
  }
  return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${reduceMotion ? 'reduce-motion' : ''}`}>
    <aside className="sidebar"><div className="brand-row"><a className="brand" href="#" aria-label={`${APP_NAME} 홈`} onClick={e => { e.preventDefault(); setView('overview'); }}><span className="brand-mark"><span /><span /><span /></span><span className="brand-name"><span className="brand-f">{APP_NAME[0]}</span>{APP_NAME.slice(1)}<span className="brand-dot">.</span></span></a><button className="icon-button sidebar-toggle" aria-label={collapsed ? '메뉴 펼치기' : '메뉴 접기'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button></div>
      <button className="workspace-switch" onClick={() => setInfo('settings')}><span className="workspace-icon">W</span><span><strong>My workspace</strong></span><ChevronDown size={14} /></button>
      <nav aria-label="주 메뉴" style={{ '--active-index': NAV_ITEMS.findIndex(item => item.id === view) } as CSSProperties}><span className="nav-indicator" aria-hidden="true" />{NAV_ITEMS.map(item => {
        const Icon = NAV_ICONS[item.id];
        const tooltip = item.id === 'tasks' ? 'Jira Tasks · 프로젝트 이슈 및 칸반 보드' : item.id === 'todos' ? 'To-Do · 개인 일일 체크리스트 & 히스토리' : item.label;
        return <button aria-label={item.label} title={tooltip} aria-current={view === item.id ? 'page' : undefined} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)} key={item.id}><Icon size={19} /><span>{item.label}</span>{item.id === 'tasks' && <b>{owned.length}</b>}{item.id === 'todos' && <b>{remainingTodos.length}</b>}</button>;
      })}</nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-bottom"><button aria-label="워크스페이스 설정" title="워크스페이스 설정" onClick={() => setInfo('settings')}><SlidersHorizontal size={18} /><span>워크스페이스 설정</span></button><button aria-label="도움말" title="도움말" onClick={() => setInfo('help')}><HelpCircle size={18} /><span>도움말</span></button></div><div className="profile"><span className="avatar">ME</span><span><strong>My workspace</strong></span><span className="profile-dot" /></div>
    </aside>
    <main className="main-content">
      <div className={`page-content ${view === 'tasks' ? 'tasks-page' : ''} ${view === 'todos' ? 'todos-page' : ''}`}><div className="page-heading"><div><h1>{nav.label}</h1></div></div>
      <div className="view-content" key={view}>
        {view === 'overview' && <Overview dateLabel={`${todayDate} ${todayWeekday}`} tasks={owned} todos={todos} todayKey={todayKey} onToggleTodo={todoActions.onToggle} onAddTodo={todoActions.onAdd} builds={builds} firmware={demoFirmware} navigate={setView} onTask={setTask} onBuild={setBuild} onFirmwareSearch={query => { setFirmwareQuery(query); setModel(ALL); setView('firmware'); }} />}
        {view === 'tasks' && <Tasks tasks={demoTasks} filters={filters} setFilters={setFilters} onSelect={setTask} hiddenTaskIds={hiddenTaskIds} onToggleHidden={toggleTaskHidden} reduceMotion={reduceMotion} />}
        {view === 'todos' && <Todos {...todoActions} todayKey={todayKey} />}
        {view === 'builds' && <Builds builds={builds} onSubmit={submitBuild} onSelect={setBuild} />}
        {view === 'firmware' && <Firmware records={demoFirmware} query={firmwareQuery} setQuery={setFirmwareQuery} model={model} setModel={setModel} onSelect={setArtifact} notify={setNotification} />}
      </div></div>
    </main>
    <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} tasks={owned} builds={builds} firmware={demoFirmware} onTask={selected => { setView('tasks'); setTask(selected); }} onBuild={selected => { setView('builds'); setBuild(selected); }} onFirmware={selected => { setView('firmware'); setArtifact(selected); }} />
    <TaskDetails task={task} onClose={() => setTask(null)} hidden={!!task && hiddenTaskIds.includes(task.id)} onToggleHidden={() => { if (task) toggleTaskHidden(task.id); setTask(null); }} /><BuildDetails build={build} onClose={() => setBuild(null)} /><FirmwareDetails record={artifact} onClose={() => setArtifact(null)} notify={setNotification} />
    <Modal open={!!info} onClose={() => setInfo(null)} title={info === 'settings' ? '워크스페이스 설정' : `Welcome to ${APP_NAME}`}><div className="settings-body">{info === 'settings' ? <><fieldset className="theme-picker"><legend>화면 테마</legend><div className="theme-options">{THEMES.map(option => <label className="theme-option" key={option.id} data-preview={option.id}><input type="radio" name="theme" value={option.id} checked={theme === option.id} onChange={() => changeTheme(option.id)} /><span className="theme-swatch" aria-hidden="true"><i /><span><b /><b /><b /></span></span><span className="theme-option-name">{option.name}</span></label>)}</div></fieldset><label className="setting-row motion-setting"><span><strong>움직임 줄이기</strong></span><input className="switch-control" type="checkbox" role="switch" aria-label="움직임 줄이기" checked={reduceMotion} onChange={e => setReduceMotion(e.target.checked)} /></label><h3>연결 서비스</h3>{['Jira', 'Build system', 'Firmware source'].map(service => <div className="integration-row" key={service}><span>{service}</span><span className="status-badge neutral">연결 전</span></div>)}</> : <><div className="help-shortcut"><kbd>Ctrl</kbd> + <kbd>K</kbd><span>통합 검색</span></div><div className="help-shortcut"><kbd>Esc</kbd><span>패널 및 대화상자 닫기</span></div></>}</div></Modal>
    {notification && <div className="toast" role="status"><span>{notification}</span><button className="icon-button" aria-label="알림 닫기" onClick={() => setNotification('')}><X size={16} /></button></div>}
  </div>;
}
