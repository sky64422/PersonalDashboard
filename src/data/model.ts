export type ViewId = 'overview' | 'calendar' | 'tasks' | 'todos' | 'builds' | 'firmware';
export const TASK_STATUS = { todo: 'To Do', progress: 'In Progress', review: 'In Review', done: 'Done', closed: 'Closed' } as const;
export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];
export type Priority = 'High' | 'Medium' | 'Low';
export interface Task { id: string; key: string; title: string; project: string; assigneeId: string; status: TaskStatus; priority: Priority; updatedAt: string; description: string; }
export interface TodoItem { id: string; text: string; createdAtDate: string; done: boolean; completedAtDate?: string; parentId?: string; }
export interface BuildRequest { target: string; branch: string; branchNote?: string; profile: string; }
export type BuildStatus = 'Success' | 'Failed' | 'Queued';
export interface Build extends BuildRequest { id: string; status: BuildStatus; createdAt: string; duration: string; demo: true; }
export interface FirmwareArtifact { id: string; filename: string; model: string; version: string; branch: string; buildId: string; path: string; size: string; createdAt: string; }
export interface TaskFilters { assigneeId: string; query: string; status: string; sort: 'priority' | 'updated'; }
export const DEMO_USER_ID = 'demo-me';
export const ALL = 'all';
export const TASK_COLUMNS: { id: string; label: string; statuses: readonly TaskStatus[] }[] = [
  { id: 'open', label: 'Open', statuses: [TASK_STATUS.todo] },
  { id: 'progress', label: 'Progress', statuses: [TASK_STATUS.progress, TASK_STATUS.review] },
  { id: 'resolved', label: 'Resolved', statuses: [TASK_STATUS.done] },
  { id: 'closed', label: 'Closed', statuses: [TASK_STATUS.closed] },
];
export const PRIORITY_RANK: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
export const NAV_ITEMS: { id: ViewId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'tasks', label: 'Jira Tasks' },
  { id: 'todos', label: 'To-Do' },
  { id: 'builds', label: 'Builds' },
  { id: 'firmware', label: 'Firmware' },
];
