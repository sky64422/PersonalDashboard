import { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Box, GitBranch, Search } from 'lucide-react';
import { PRIORITY_RANK, TASK_STATUS, type Build, type FirmwareArtifact, type Task, type TodoItem, type ViewId } from '../../data/model';
import { PanelHeading, StatusBadge } from '../../components/ui';
import { TaskList } from '../tasks/Tasks';
import { OverviewTodoSection } from '../todos/Todos';
import { FairyTaleSky, getCelestialState } from './FairyTaleSky';

const PREVIEW_LIMIT = 5;
const BUILD_PREVIEW_LIMIT = 3;

export function Overview({
  tasks,
  todos,
  todayKey,
  dateLabel,
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
  dateLabel: string;
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

  const prioritizedTasks = useMemo(() => tasks
    .filter(task => task.status !== TASK_STATUS.done && task.status !== TASK_STATUS.closed)
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]), [tasks]);
  const priorityPreview = useMemo(() => prioritizedTasks.slice(0, PREVIEW_LIMIT), [prioritizedTasks]);

  const celestial = useMemo(() => getCelestialState(), []);

  // Summary Metrics for Panoramic HUD
  const remainingTodosCount = useMemo(() => todos.filter(t => !t.done).length, [todos]);
  const inProgressTasksCount = useMemo(() => tasks.filter(t => t.status === TASK_STATUS.progress).length, [tasks]);
  const successfulBuildsCount = useMemo(() => builds.filter(b => b.status === 'Success').length, [builds]);

  return (
    <div className="overview-dashboard">
      {/* 1. Full-Width Panorama Hero */}
      <section className={`overview-hero panorama-hero period-${celestial.period}`} aria-label="개요 하이라이트">
        <FairyTaleSky state={celestial} />

        <div className="hero-content">
          <div className="hero-title-area">
            <time className="hero-date" dateTime={todayKey}>{dateLabel}</time>
            <h2 className="hero-title">
              {celestial.greeting}, <span className="hero-highlight">ME</span>
            </h2>
          </div>

          {/* Liquid Glass HUD stats (우측 하단 배치) */}
          <div className="hero-hud-stats" role="status" aria-label="일일 상태 요약">
            <div className="hud-pill hud-pill-amber" title="남은 할 일 목록">
              <span className="hud-icon">📋</span>
              <div className="hud-text">
                <span className="hud-label">남은 할 일</span>
                <strong className="hud-val">{remainingTodosCount}건 남음</strong>
              </div>
            </div>
            <div className="hud-pill hud-pill-blue" title="진행 중인 Jira 티켓">
              <span className="hud-icon">🔄</span>
              <div className="hud-text">
                <span className="hud-label">진행 중 티켓</span>
                <strong className="hud-val">{inProgressTasksCount}건 활성</strong>
              </div>
            </div>
            <div className="hud-pill hud-pill-green" title="최근 빌드 상태">
              <span className="hud-icon">🚀</span>
              <div className="hud-text">
                <span className="hud-label">최근 빌드</span>
                <strong className="hud-val">{successfulBuildsCount}/{builds.length} 성공</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Middle Row: To-Do (Left, ~60%) + Quick Ops (Right, ~40%: Builds 70% & Firmware 30%) */}
      <div className="overview-mid-row">
        {/* Left Column: To-Do List (넉넉한 가로폭) */}
        <div className="mid-col-todos">
          <OverviewTodoSection
            todos={todos}
            todayKey={todayKey}
            onToggle={onToggleTodo}
            onAdd={onAddTodo}
            onOpenTodos={() => navigate('todos')}
          />
        </div>

        {/* Right Column: Quick Ops (Recent Builds 70% + Firmware 30%) */}
        <div className="mid-col-ops">
          {/* Builds (70% 높이) */}
          <section className="overview-panel recent-builds">
            <PanelHeading
              title="Builds"
              action={
                <button className="text-button" onClick={() => navigate('builds')}>
                  빌드 보기<ArrowUpRight size={15} />
                </button>
              }
            />
            <div className="recent-build-list">
              {builds.slice(0, BUILD_PREVIEW_LIMIT).map(build => (
                <button
                  key={build.id}
                  className="recent-build-row"
                  onClick={() => onBuild(build)}
                >
                  <span className="square-icon mint">
                    <Box size={18} />
                  </span>
                  <span className="recent-build-name">
                    <strong>{build.target}</strong>
                    <small>
                      <GitBranch size={11} />
                      {build.branch}
                    </small>
                  </span>
                  <StatusBadge status={build.status} />
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          </section>

          {/* Firmware (Clean Search Only) */}
          <section className="overview-panel quick-firmware">
            <PanelHeading
              title={
                <span className="panel-title-with-pill">
                  Firmware <span className="count-pill">{firmware.length}</span>
                </span>
              }
              action={
                <button className="text-button" onClick={() => navigate('firmware')}>
                  전체 보기<ArrowUpRight size={15} />
                </button>
              }
            />
            <form
              onSubmit={e => {
                e.preventDefault();
                onFirmwareSearch(query);
              }}
            >
              <div className="quick-search">
                <Search size={15} />
                <input
                  aria-label="빠른 펌웨어 검색"
                  placeholder="모델 또는 버전 검색"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                <button aria-label="펌웨어 찾아보기" type="submit">
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      {/* 3. Bottom Row: Jira Tasks (한 줄 전체를 모두 사용하는 100% Full-Width!) */}
      <section className="overview-panel overview-tasks full-width-tasks">
        <PanelHeading
          title="Jira Tasks"
          action={
            <button className="text-button" onClick={() => navigate('tasks')}>
              전체 보기<ArrowUpRight size={15} />
            </button>
          }
        />
        <div className="preview-results" aria-live="polite">
          {priorityPreview.length ? (
            <TaskList tasks={priorityPreview} onSelect={onTask} />
          ) : (
            <p className="preview-empty">해당하는 업무가 없어요.</p>
          )}
        </div>
      </section>
    </div>
  );
}
