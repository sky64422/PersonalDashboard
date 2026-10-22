import { ALL, PRIORITY_RANK, TASK_STATUS, type Task, type TaskFilters } from '../../data/model';
export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return tasks.filter(task => task.assigneeId === filters.assigneeId && task.status !== TASK_STATUS.closed)
    .filter(task => filters.status === ALL || task.status === filters.status)
    .filter(task => `${task.key} ${task.title} ${task.project}`.toLocaleLowerCase().includes(query))
    .sort((a, b) => filters.sort === 'priority'
      ? PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.updatedAt.localeCompare(a.updatedAt)
      : b.updatedAt.localeCompare(a.updatedAt));
}
