import { ALL, PRIORITY_RANK, TASK_STATUS, type Task, type TaskFilters } from '../../data/model';
import { createTextMatcher } from '../../data/search';
export function filterTasks(tasks: Task[], filters: TaskFilters, { includeClosed = false }: { includeClosed?: boolean } = {}): Task[] {
  const matches = createTextMatcher(filters.query);
  return tasks.filter(task => task.assigneeId === filters.assigneeId && (includeClosed || task.status !== TASK_STATUS.closed))
    .filter(task => filters.status === ALL || task.status === filters.status)
    .filter(task => matches(`${task.key} ${task.title} ${task.project}`))
    .sort((a, b) => filters.sort === 'priority'
      ? PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.updatedAt.localeCompare(a.updatedAt)
      : b.updatedAt.localeCompare(a.updatedAt));
}
