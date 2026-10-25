import type { TodoItem } from '../../data/model';
import { formatMonthLabel } from './todoModel';

export interface DailyTodoLogEntry {
  date: string;
  addedOnDay: TodoItem[];
  completedOnDay: TodoItem[];
  carriedForwardFromDay: TodoItem[];
  isLatest: boolean;
}

export interface MonthlyTodoGroup {
  monthKey: string;
  label: string;
  entries: DailyTodoLogEntry[];
  totalDays: number;
}

export function buildDailyTodoLog(todos: TodoItem[], todayKey: string): DailyTodoLogEntry[] {
  const addedByDate = new Map<string, TodoItem[]>();
  const completedByDate = new Map<string, TodoItem[]>();
  const changeDates = new Set<string>();

  for (const todo of todos) {
    if (todo.parentId) continue;

    const created = todo.createdAtDate;
    if (created && created < todayKey) {
      changeDates.add(created);
      let list = addedByDate.get(created);
      if (!list) {
        list = [];
        addedByDate.set(created, list);
      }
      list.push(todo);
    }

    if (todo.done && todo.completedAtDate && todo.completedAtDate < todayKey) {
      const completed = todo.completedAtDate;
      changeDates.add(completed);
      let list = completedByDate.get(completed);
      if (!list) {
        list = [];
        completedByDate.set(completed, list);
      }
      list.push(todo);
    }
  }

  const sortedDates = Array.from(changeDates).sort((a, b) => a.localeCompare(b));
  const entries: DailyTodoLogEntry[] = [];

  for (const date of sortedDates) {
    const addedOnDay = addedByDate.get(date) ?? [];
    const completedOnDay = completedByDate.get(date) ?? [];
    if (addedOnDay.length === 0 && completedOnDay.length === 0) continue;

    const carriedForwardFromDay = addedOnDay.filter(
      t => (!t.done && date < todayKey) || (t.done && t.completedAtDate && t.completedAtDate > date),
    );

    entries.push({
      date,
      addedOnDay,
      completedOnDay,
      carriedForwardFromDay,
      isLatest: false,
    });
  }

  if (entries.length > 0) {
    entries[entries.length - 1].isLatest = true;
  }
  return entries;
}

export function buildMonthlyTodoGroups(allEntries: DailyTodoLogEntry[]): MonthlyTodoGroup[] {
  const byMonth = new Map<string, DailyTodoLogEntry[]>();

  for (const entry of allEntries) {
    const monthKey = entry.date.slice(0, 7);
    const list = byMonth.get(monthKey) ?? [];
    list.push({ ...entry, isLatest: false });
    byMonth.set(monthKey, list);
  }

  const monthKeys = Array.from(byMonth.keys()).sort((a, b) => b.localeCompare(a));

  return monthKeys.map(monthKey => {
    const entries = byMonth.get(monthKey)!;
    if (entries.length > 0) {
      entries[entries.length - 1].isLatest = true;
    }
    return {
      monthKey,
      label: formatMonthLabel(monthKey),
      entries,
      totalDays: entries.length,
    };
  });
}

/**
 * Filter historical daily entries by search query across completed, added, and carried tasks.
 */
export function searchDailyTodoLog(
  allEntries: DailyTodoLogEntry[],
  query: string,
): DailyTodoLogEntry[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return allEntries;

  const results: DailyTodoLogEntry[] = [];
  for (const entry of allEntries) {
    const matchingCompleted = entry.completedOnDay.filter(item =>
      item.text.toLowerCase().includes(trimmed),
    );
    const matchingAdded = entry.addedOnDay.filter(item =>
      item.text.toLowerCase().includes(trimmed),
    );

    if (matchingCompleted.length > 0 || matchingAdded.length > 0) {
      results.push({
        date: entry.date,
        addedOnDay: matchingAdded,
        completedOnDay: matchingCompleted,
        carriedForwardFromDay: [],
        isLatest: false,
      });
    }
  }

  if (results.length > 0) {
    results[results.length - 1].isLatest = true;
  }
  return results;
}
