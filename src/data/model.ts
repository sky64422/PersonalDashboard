export type ViewId = 'overview' | 'tasks' | 'builds' | 'firmware';
export const TASK_STATUS = { todo: 'To Do', progress: 'In Progress', review: 'In Review', done: 'Done', closed: 'Closed' } as const;
export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];
export type Priority = 'High' | 'Medium' | 'Low';
export interface Task { id: string; key: string; title: string; project: string; assigneeId: string; status: TaskStatus; priority: Priority; updatedAt: string; description: string; }
export interface BuildRequest { target: string; branch: string; profile: string; }
export type BuildStatus = 'Success' | 'Failed' | 'Queued';
export interface Build extends BuildRequest { id: string; status: BuildStatus; createdAt: string; duration: string; demo: true; }
export interface FirmwareArtifact { id: string; filename: string; model: string; version: string; branch: string; buildId: string; path: string; size: string; createdAt: string; }
export interface TaskFilters { assigneeId: string; query: string; status: string; sort: 'priority' | 'updated'; }
export const DEMO_USER_ID = 'demo-me';
export const ALL = 'all';
export const TASK_COLUMNS: { id: string; label: string; description: string; statuses: readonly TaskStatus[] }[] = [
  { id: 'open', label: 'Open', description: '다음 시작을 기다리는 일', statuses: [TASK_STATUS.todo] },
  { id: 'progress', label: 'Progress', description: '지금 만들어가는 중', statuses: [TASK_STATUS.progress, TASK_STATUS.review] },
  { id: 'resolved', label: 'Resolved', description: '해결을 마치고 확인 중', statuses: [TASK_STATUS.done] },
  { id: 'closed', label: 'Closed', description: '깔끔하게 마무리한 일', statuses: [TASK_STATUS.closed] },
];
export const PRIORITY_RANK: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
export const NAV_ITEMS: { id: ViewId; label: string; eyebrow: string; subtitle: string }[] = [
  { id: 'overview', label: 'Overview', eyebrow: 'YOUR DAILY WORKSPACE', subtitle: '중요한 일에 집중할 수 있도록, 필요한 모든 것을 한곳에.' },
  { id: 'tasks', label: 'My Tasks', eyebrow: 'MAKE ROOM FOR FOCUS', subtitle: '나에게 할당된 업무를 살펴보고, 다음 할 일을 정리하세요.' },
  { id: 'builds', label: 'Builds', eyebrow: 'FROM SOURCE TO SOMETHING', subtitle: '빌드를 준비하고, 진행 이력을 한눈에 확인하세요.' },
  { id: 'firmware', label: 'Firmware', eyebrow: 'THE RIGHT FILE, RIGHT HERE', subtitle: '필요한 펌웨어와 경로를 빠르게 찾아보세요.' },
];
