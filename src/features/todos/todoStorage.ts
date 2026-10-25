import type { TodoItem } from '../../data/model';
import { formatDateKey } from './todoModel';
import { createArchiveDemoTodos, createDemoTodos } from './demoTodos';

export const TODOS_STORAGE_KEY = 'friday.todos.v4';

export function loadInitialTodos(todayKey: string = formatDateKey()): { todos: TodoItem[]; error: string } {
  try {
    const raw = localStorage.getItem(TODOS_STORAGE_KEY);
    if (!raw) return { todos: createDemoTodos(todayKey), error: '' };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Extend existing demo workspaces without replacing edits or duplicating archive records.
      const ids = new Set(parsed.map((item: TodoItem) => item.id));
      const archive = ids.has('todo-1')
        ? createArchiveDemoTodos().filter(item => !ids.has(item.id))
        : [];
      return { todos: [...archive, ...parsed], error: '' };
    }
    return { todos: createDemoTodos(todayKey), error: '' };
  } catch {
    return { todos: createDemoTodos(todayKey), error: '' };
  }
}
