import type { TodoItem } from '../../data/model';
import { offsetDateKey } from '../../data/date';
export { formatDateKey, offsetDateKey } from '../../data/date';

export function formatKoreanDateLabel(dateKey: string, todayKey: string): string {
  if (dateKey === todayKey) return `오늘 · ${formatShortDate(dateKey)}`;
  if (dateKey === offsetDateKey(todayKey, -1)) return `어제 · ${formatShortDate(dateKey)}`;
  const [y, m, d] = dateKey.split('-').map(Number);
  return `${y}. ${String(m).padStart(2, '0')}. ${String(d).padStart(2, '0')}`;
}

export function formatShortDate(dateKey: string): string {
  const parts = dateKey.split('-');
  return parts.length === 3 ? `${parts[1]}.${parts[2]}` : dateKey;
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return `${year}년 ${month}월`;
}

export function isCarriedOver(todo: TodoItem, todayKey: string): boolean {
  return !todo.done && todo.createdAtDate < todayKey;
}

export function getChildTodos(todos: TodoItem[], parentId: string): TodoItem[] {
  return todos.filter(todo => todo.parentId === parentId);
}

export function buildChildrenMap(todos: TodoItem[]): Map<string, TodoItem[]> {
  const map = new Map<string, TodoItem[]>();
  for (const item of todos) {
    if (item.parentId) {
      let list = map.get(item.parentId);
      if (!list) {
        list = [];
        map.set(item.parentId, list);
      }
      list.push(item);
    }
  }
  return map;
}

export function getDescendantIds(todos: TodoItem[], rootId: string): Set<string> {
  const childrenMap = buildChildrenMap(todos);

  const result = new Set<string>();
  const queue: string[] = [rootId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = childrenMap.get(current);
    if (children) {
      for (const { id: childId } of children) {
        if (!result.has(childId)) {
          result.add(childId);
          queue.push(childId);
        }
      }
    }
  }
  return result;
}

export function getRootAncestorId(todos: TodoItem[], id: string): string {
  let current = todos.find(item => item.id === id);
  const visited = new Set<string>();
  while (current?.parentId && !visited.has(current.id)) {
    visited.add(current.id);
    const parent = todos.find(item => item.id === current!.parentId);
    if (!parent) break;
    current = parent;
  }
  return current?.id ?? id;
}

function syncAncestorsUpward(
  todos: TodoItem[],
  startParentId: string | undefined,
  todayKey: string,
): TodoItem[] {
  if (!startParentId) return todos;

  const itemMap = new Map(todos.map(item => [item.id, item]));
  const childrenMap = buildChildrenMap(todos);

  const updates = new Map<string, { done: boolean; completedAtDate?: string }>();
  let currentParentId: string | undefined = startParentId;
  const visited = new Set<string>();

  while (currentParentId && !visited.has(currentParentId)) {
    visited.add(currentParentId);
    const parent = itemMap.get(currentParentId);
    if (!parent) break;

    const children = childrenMap.get(currentParentId) ?? [];
    if (children.length > 0) {
      const allChildrenDone = children.every(item => {
        const update = updates.get(item.id);
        return update !== undefined ? update.done : item.done;
      });

      const parentCurrentDone = updates.has(parent.id) ? updates.get(parent.id)!.done : parent.done;
      if (parentCurrentDone !== allChildrenDone) {
        updates.set(parent.id, {
          done: allChildrenDone,
          completedAtDate: allChildrenDone ? todayKey : undefined,
        });
      }
    }
    currentParentId = parent.parentId;
  }

  if (updates.size === 0) return todos;

  return todos.map(item => {
    const update = updates.get(item.id);
    return update ? { ...item, ...update } : item;
  });
}

export function getRemainingTodos(todos: TodoItem[]): TodoItem[] {
  return todos.filter(todo => !todo.parentId && !todo.done);
}

/**
 * Returns top-level items for the Current To-Do list:
 * - Unfinished items (!todo.done) at the top (oldest carried-over first)
 * - Items completed today (todo.done && todo.completedAtDate === todayKey) moved to the bottom with strikethrough
 */
export function getCurrentTodoList(todos: TodoItem[], todayKey: string): TodoItem[] {
  const remaining = getRemainingTodos(todos);
  const completedToday = todos.filter(
    t => !t.parentId && t.done && t.completedAtDate === todayKey,
  );
  return [...remaining, ...completedToday];
}

/**
 * Toggles a todo item and synchronizes multi-level parent/child completion state:
 * - Toggling a parent toggles all of its descendants.
 * - When all children of a parent become done, the parent automatically becomes done (recursively up to the root).
 * - When any child of a done parent is unchecked, ancestor parents automatically reopen.
 */
export function toggleTodoWithHierarchy(
  todos: TodoItem[],
  id: string,
  todayKey: string,
): TodoItem[] {
  const target = todos.find(item => item.id === id);
  if (!target) return todos;
  const nextDone = !target.done;
  const rootId = getRootAncestorId(todos, id);
  const rootBefore = todos.find(item => item.id === rootId);

  const descendants = getDescendantIds(todos, id);
  let nextList = todos.map(item => {
    if (item.id === id || descendants.has(item.id)) {
      return {
        ...item,
        done: nextDone,
        completedAtDate: nextDone ? todayKey : undefined,
      };
    }
    return item;
  });

  nextList = syncAncestorsUpward(nextList, target.parentId, todayKey);

  const rootAfter = nextList.find(item => item.id === rootId);
  if (rootAfter && rootBefore && rootAfter.done !== rootBefore.done) {
    const withoutRoot = nextList.filter(item => item.id !== rootId);
    return rootAfter.done ? [...withoutRoot, rootAfter] : [rootAfter, ...withoutRoot];
  }

  return nextList;
}

/**
 * Resolves the target parent for the bottom composer based on indent depth.
 * depth 0 = root
 * depth 1 = child of the last active root task
 * depth 2 = child of the last active child task (하위의 하위)
 * depth 3+ = child of deeper descendants
 */
export function getComposerTargetParent(
  todos: TodoItem[],
  depth: number,
): { parentId?: string; parentText?: string; maxDepth: number } {
  const activeRoots = getRemainingTodos(todos);
  if (activeRoots.length === 0) {
    return { parentId: undefined, parentText: undefined, maxDepth: 0 };
  }

  const lastRoot = activeRoots[activeRoots.length - 1];
  if (depth <= 0) {
    return { parentId: undefined, parentText: undefined, maxDepth: 1 };
  }

  let currentParent: TodoItem = lastRoot;
  let currentDepth = 1;

  while (currentDepth < depth) {
    const children = getChildTodos(todos, currentParent.id).filter(c => !c.done);
    if (children.length === 0) {
      break;
    }
    currentParent = children[children.length - 1];
    currentDepth++;
  }

  const deeperChildren = getChildTodos(todos, currentParent.id).filter(c => !c.done);
  const maxDepth = deeperChildren.length > 0 ? currentDepth + 1 : currentDepth;

  return {
    parentId: currentParent.id,
    parentText: currentParent.text,
    maxDepth,
  };
}

/**
 * Indents a todo item (`Tab`) to become a child of its immediately preceding sibling at the same level.
 * Pressing `Tab` again when it has a preceding sibling under the new parent indents it one level deeper (하위의 하위).
 */
export function indentTodo(
  todos: TodoItem[],
  id: string,
  todayKey: string,
): TodoItem[] {
  const target = todos.find(item => item.id === id);
  if (!target) return todos;

  const siblings = target.parentId
    ? todos.filter(item => item.parentId === target.parentId)
    : target.done
      ? todos.filter(item => !item.parentId && item.done && item.completedAtDate === todayKey)
      : getRemainingTodos(todos);

  const idx = siblings.findIndex(item => item.id === id);
  if (idx <= 0) return todos;

  const newParent = siblings[idx - 1];
  const descendants = getDescendantIds(todos, id);
  if (descendants.has(newParent.id)) return todos;

  const oldParentId = target.parentId;
  const updatedTarget: TodoItem = {
    ...target,
    parentId: newParent.id,
  };

  const withoutTarget = todos.filter(item => item.id !== id);
  const newParentIdx = withoutTarget.findIndex(item => item.id === newParent.id);
  const nextList = [...withoutTarget];
  const newParentDescendants = getDescendantIds(withoutTarget, newParent.id);
  let insertIdx = newParentIdx;
  for (let i = newParentIdx + 1; i < nextList.length; i++) {
    if (newParentDescendants.has(nextList[i].id)) {
      insertIdx = i;
    }
  }
  nextList.splice(insertIdx + 1, 0, updatedTarget);

  let synced = syncAncestorsUpward(nextList, newParent.id, todayKey);
  if (oldParentId) {
    synced = syncAncestorsUpward(synced, oldParentId, todayKey);
  }
  return synced;
}

/**
 * Outdents a todo item (`Shift+Tab`) by moving it up one hierarchy level
 * (its parentId becomes its current parent's parentId) and placing it immediately after its former parent.
 */
export function outdentTodo(
  todos: TodoItem[],
  id: string,
  todayKey: string,
): TodoItem[] {
  const target = todos.find(item => item.id === id);
  if (!target || !target.parentId) return todos;

  const oldParent = todos.find(item => item.id === target.parentId);
  if (!oldParent) {
    return todos.map(item => (item.id === id ? { ...item, parentId: undefined } : item));
  }

  const newParentId = oldParent.parentId;
  const updatedTarget: TodoItem = {
    ...target,
    parentId: newParentId,
  };

  const withoutTarget = todos.filter(item => item.id !== id);
  const parentIdx = withoutTarget.findIndex(item => item.id === oldParent.id);
  const nextList = [...withoutTarget];
  nextList.splice(parentIdx + 1, 0, updatedTarget);

  let synced = syncAncestorsUpward(nextList, oldParent.id, todayKey);
  if (newParentId) {
    synced = syncAncestorsUpward(synced, newParentId, todayKey);
  }
  return synced;
}

/**
 * Adds a child track under a parent todo. If the parent was already marked done,
 * adding an unfinished child re-opens the parent automatically.
 */
export function addSubTodo(
  todos: TodoItem[],
  parentId: string,
  text: string,
  todayKey: string,
  childId: string = `todo-${crypto.randomUUID().slice(0, 8)}`,
): TodoItem[] {
  const child: TodoItem = {
    id: childId,
    text,
    createdAtDate: todayKey,
    done: false,
    parentId,
  };
  const next = [...todos, child];
  return syncAncestorsUpward(next, parentId, todayKey);
}

export function updateTodoText(todos: TodoItem[], id: string, text: string): TodoItem[] {
  return todos.map(item => (item.id === id ? { ...item, text } : item));
}

export function insertTodoAfter(
  todos: TodoItem[],
  targetId: string,
  todayKey: string,
  newId: string = `todo-${crypto.randomUUID().slice(0, 8)}`,
): { todos: TodoItem[]; createdId: string } {
  const targetIdx = todos.findIndex(item => item.id === targetId);
  if (targetIdx === -1) {
    const fallback: TodoItem = { id: newId, text: '', createdAtDate: todayKey, done: false };
    return { todos: [...todos, fallback], createdId: newId };
  }
  const target = todos[targetIdx];
  const created: TodoItem = {
    id: newId,
    text: '',
    createdAtDate: todayKey,
    done: false,
    parentId: target.parentId,
  };
  const next = [...todos];
  next.splice(targetIdx + 1, 0, created);
  return {
    todos: target.parentId ? syncAncestorsUpward(next, target.parentId, todayKey) : next,
    createdId: newId,
  };
}

export function deleteTodoWithHierarchy(
  todos: TodoItem[],
  id: string,
  todayKey: string,
): TodoItem[] {
  const target = todos.find(item => item.id === id);
  if (!target) return todos;

  const descendants = getDescendantIds(todos, id);
  const remaining = todos.filter(item => item.id !== id && !descendants.has(item.id));
  if (target.parentId) {
    return syncAncestorsUpward(remaining, target.parentId, todayKey);
  }
  return remaining;
}

export function reorderTodos(
  todos: TodoItem[],
  sourceId: string,
  targetId: string,
): TodoItem[] {
  if (sourceId === targetId) return todos;
  const sourceItem = todos.find(item => item.id === sourceId);
  const targetItem = todos.find(item => item.id === targetId);
  if (!sourceItem || !targetItem) return todos;

  // Cannot move parent inside its own descendant
  const descendants = getDescendantIds(todos, sourceId);
  if (descendants.has(targetId)) return todos;

  const clusterIds = new Set([sourceId, ...descendants]);
  const cluster = todos.filter(item => clusterIds.has(item.id));
  const remaining = todos.filter(item => !clusterIds.has(item.id));

  const targetIdx = remaining.findIndex(item => item.id === targetId);
  if (targetIdx === -1) return todos;

  // Match parent hierarchy with target if moved across groups
  const updatedCluster = cluster.map(item => {
    if (item.id === sourceId) {
      return { ...item, parentId: targetItem.parentId };
    }
    return item;
  });

  const nextList = [...remaining];
  nextList.splice(targetIdx, 0, ...updatedCluster);
  return nextList;
}
