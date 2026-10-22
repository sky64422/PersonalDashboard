import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ArrowUpRight, Box, ChevronDown, Command, FileBox, HelpCircle, LayoutGrid, PanelLeftClose, PanelLeftOpen, Search, SlidersHorizontal, SquareCheck, X } from 'lucide-react';
import { ALL, DEMO_USER_ID, NAV_ITEMS, type Build, type BuildRequest, type FirmwareArtifact, type Task, type TaskFilters, type ViewId } from './data/model';
import { demoBuilds, demoFirmware, demoTasks } from './data/demo';
import { filterTasks } from './features/tasks/filter';
import { TaskDetails, Tasks } from './features/tasks/Tasks';
import { BuildDetails, Builds } from './features/builds/Builds';
import { Firmware, FirmwareDetails } from './features/firmware/Firmware';
import { Overview } from './features/overview/Overview';
import { GlobalSearch } from './components/GlobalSearch';
import { Modal } from './components/ui';

const NAV_ICONS = { overview: LayoutGrid, tasks: SquareCheck, builds: Box, firmware: FileBox };
const DEFAULT_FILTERS: TaskFilters = { assigneeId: DEMO_USER_ID, query: '', status: ALL, sort: 'priority' };
export default function App() {
  const [view, setView] = useState<ViewId>('overview');
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
  const [notification, setNotification] = useState('');
  const [reduceMotion, setReduceMotion] = useState(false);
  const owned = useMemo(() => filterTasks(demoTasks, DEFAULT_FILTERS), []);
  const nav = NAV_ITEMS.find(item => item.id === view)!;
  const today = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (searchOpen || !document.querySelector('[role="dialog"][data-state="open"]')) setSearchOpen(value => !value);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [searchOpen]);
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reduceMotion);
    return () => { delete document.documentElement.dataset.reducedMotion; };
  }, [reduceMotion]);
  function submitBuild(request: BuildRequest) {
    setBuilds(current => [{ ...request, id: `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, status: 'Queued', createdAt: new Date().toISOString(), duration: '—', demo: true }, ...current]);
    setNotification('데모 대기열에 추가했습니다. 실제 빌드는 실행되지 않았습니다.');
  }
  return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${reduceMotion ? 'reduce-motion' : ''}`}>
    <aside className="sidebar"><div className="brand-row"><a className="brand" href="#" aria-label="Folio 홈" onClick={e => { e.preventDefault(); setView('overview'); }}><span className="brand-mark"><span /><span /><span /></span><span className="brand-name">folio<span>.</span></span></a><button className="icon-button sidebar-toggle" aria-label={collapsed ? '메뉴 펼치기' : '메뉴 접기'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button></div>
      <button className="workspace-switch" onClick={() => setInfo('settings')}><span className="workspace-icon">W</span><span><strong>My workspace</strong><small>Personal space</small></span><ChevronDown size={14} /></button>
      <button className="sidebar-search" aria-label="통합 검색 열기" onClick={() => setSearchOpen(true)}><Search size={17} /><span>빠른 검색</span><kbd>Ctrl K</kbd></button>
      <span className="nav-caption">WORKSPACE</span><nav aria-label="주 메뉴" style={{ '--active-index': NAV_ITEMS.findIndex(item => item.id === view) } as CSSProperties}><span className="nav-indicator" aria-hidden="true" />{NAV_ITEMS.map(item => { const Icon = NAV_ICONS[item.id]; return <button aria-label={item.label} aria-current={view === item.id ? 'page' : undefined} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)} key={item.id}><Icon size={19} /><span>{item.label}</span>{item.id === 'tasks' && <b>{owned.length}</b>}</button>; })}</nav>
      <div className="sidebar-spacer" /><div className="workspace-note"><span className="note-symbol"><Command size={17} /></span><strong>Your space to focus.</strong><p>흩어진 일을 모으고,<br />중요한 일에 집중하세요.</p><span>하나씩, 차근차근.<ArrowUpRight size={13} /></span></div>
      <div className="sidebar-bottom"><button onClick={() => setInfo('settings')}><SlidersHorizontal size={18} /><span>워크스페이스 설정</span></button><button onClick={() => setInfo('help')}><HelpCircle size={18} /><span>도움말</span></button></div><div className="profile"><span className="avatar">ME</span><span><strong>My workspace</strong><small>Make it your own</small></span><span className="profile-dot" /></div>
    </aside>
    <main className="main-content"><header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <strong>{nav.label}</strong></div><div className="topbar-right"><span className="demo-badge"><span className="tiny-dot" />샘플 데이터</span><button className="icon-button header-search" aria-label="검색" onClick={() => setSearchOpen(true)}><Search size={18} /></button><span className="mini-avatar">ME</span></div></header>
      <div className="page-content"><div className="page-heading"><div><span className="eyebrow">{nav.eyebrow}</span><h1>{view === 'overview' ? <>A little more <span>focus.</span></> : nav.label}</h1><p>{nav.subtitle}</p></div><div className="heading-action">{view === 'overview' ? <><span className="date-label">{today}</span><button className="button primary" onClick={() => setView('builds')}><Box size={15} />새 빌드<ArrowUpRight size={15} /></button></> : <span className="page-index">0{NAV_ITEMS.findIndex(item => item.id === view) + 1}<span> / 04</span></span>}</div></div>
      <div className="view-content" key={view}>
        {view === 'overview' && <Overview tasks={owned} builds={builds} firmware={demoFirmware} navigate={setView} onTask={setTask} onBuild={setBuild} onFirmwareSearch={query => { setFirmwareQuery(query); setModel(ALL); setView('firmware'); }} />}
        {view === 'tasks' && <Tasks tasks={demoTasks} filters={filters} setFilters={setFilters} onSelect={setTask} />}
        {view === 'builds' && <Builds builds={builds} onSubmit={submitBuild} onSelect={setBuild} />}
        {view === 'firmware' && <Firmware records={demoFirmware} query={firmwareQuery} setQuery={setFirmwareQuery} model={model} setModel={setModel} onSelect={setArtifact} notify={setNotification} />}
      </div></div>
    </main>
    <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} tasks={owned} builds={builds} firmware={demoFirmware} onTask={selected => { setView('tasks'); setTask(selected); }} onBuild={selected => { setView('builds'); setBuild(selected); }} onFirmware={selected => { setView('firmware'); setArtifact(selected); }} />
    <TaskDetails task={task} onClose={() => setTask(null)} /><BuildDetails build={build} onClose={() => setBuild(null)} /><FirmwareDetails record={artifact} onClose={() => setArtifact(null)} notify={setNotification} />
    <Modal open={!!info} onClose={() => setInfo(null)} title={info === 'settings' ? '워크스페이스 설정' : 'Welcome to Folio'} description="나만의 업무 공간을 준비하는 첫 단계"><div className="settings-body">{info === 'settings' ? <><div className="setting-row"><div><strong>움직임 줄이기</strong><p>화면 전환 효과를 줄입니다. Windows 설정도 자동으로 반영됩니다.</p></div><input type="checkbox" aria-label="움직임 줄이기" checked={reduceMotion} onChange={e => setReduceMotion(e.target.checked)} /></div><h3>연결 서비스</h3>{['Jira', 'Build system', 'Firmware source'].map(service => <div className="integration-row" key={service}><span>{service}</span><span className="status-badge neutral">연결 전</span></div>)}<p className="settings-note">현재는 예시 데이터로 동작합니다. 회사 환경에서 서비스를 연결해주세요. 데모 변경 사항은 앱을 다시 열면 초기화됩니다.</p></> : <><p>업무, 빌드, 펌웨어를 한곳에서 확인하는 개인용 대시보드입니다.</p><div className="help-shortcut"><kbd>Ctrl</kbd> + <kbd>K</kbd><span>어디서든 통합 검색</span></div><div className="help-shortcut"><kbd>Esc</kbd><span>상세 패널과 대화상자 닫기</span></div><div className="note-box">모든 업무·빌드·파일은 예시입니다. 빌드 추가는 데모 대기열에만 반영되고 실제 파일이나 서버는 변경하지 않습니다.</div></>}</div></Modal>
    {notification && <div className="toast" role="status"><span>{notification}</span><button className="icon-button" aria-label="알림 닫기" onClick={() => setNotification('')}><X size={16} /></button></div>}
  </div>;
}
