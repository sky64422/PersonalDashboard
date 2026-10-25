import type { TodoItem } from '../../data/model';

export const TODOS_STORAGE_KEY = 'friday.todos.v4';

export function formatDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function offsetDateKey(baseDateKey: string, deltaDays: number): string {
  const [y, m, d] = baseDateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return formatDateKey(dt);
}

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

export function getDescendantIds(todos: TodoItem[], rootId: string): Set<string> {
  const childrenMap = new Map<string, string[]>();
  for (const item of todos) {
    if (item.parentId) {
      let list = childrenMap.get(item.parentId);
      if (!list) {
        list = [];
        childrenMap.set(item.parentId, list);
      }
      list.push(item.id);
    }
  }

  const result = new Set<string>();
  const queue: string[] = [rootId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = childrenMap.get(current);
    if (children) {
      for (const childId of children) {
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

  const itemMap = new Map<string, TodoItem>();
  const childrenMap = new Map<string, TodoItem[]>();

  for (const item of todos) {
    itemMap.set(item.id, item);
    if (item.parentId) {
      let list = childrenMap.get(item.parentId);
      if (!list) {
        list = [];
        childrenMap.set(item.parentId, list);
      }
      list.push(item);
    }
  }

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
  totalCompleted: number;
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

export function buildMonthlyTodoGroups(todos: TodoItem[], todayKey: string): MonthlyTodoGroup[] {
  const allEntries = buildDailyTodoLog(todos, todayKey);
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
    const totalCompleted = entries.reduce((sum, e) => sum + e.completedOnDay.length, 0);
    return {
      monthKey,
      label: formatMonthLabel(monthKey),
      entries,
      totalDays: entries.length,
      totalCompleted,
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

const ARCHIVE_DEMO_YEARS = [2022, 2023, 2024, 2025];
const ARCHIVE_DEMO_MONTHS = ['03', '06', '09', '12'];
const ARCHIVE_DEMO_RECORDS = [
  ['08', 'Atlas 전원 시퀀스 측정 및 보드 초기 구동 검증'],
  ['12', '센서 수집 인터페이스 테스트와 SDK 예제 정리'],
  ['18', 'OTA 롤백 시나리오 회귀 테스트 완료'],
  ['24', '릴리스 산출물 검증 및 변경 사항 문서화'],
];

function createArchiveDemoTodos(): TodoItem[] {
  return ARCHIVE_DEMO_YEARS.flatMap(year => ARCHIVE_DEMO_MONTHS.flatMap(month =>
    ARCHIVE_DEMO_RECORDS.map(([day, text]) => {
      const date = `${year}-${month}-${day}`;
      return { id: `demo-archive-${date}`, text, createdAtDate: date, completedAtDate: date, done: true };
    }),
  ));
}

export function createDemoTodos(todayKey: string = formatDateKey()): TodoItem[] {
  const d18 = offsetDateKey(todayKey, -18);
  const d14 = offsetDateKey(todayKey, -14);
  const d11 = offsetDateKey(todayKey, -11);
  const d8 = offsetDateKey(todayKey, -8);
  const d5 = offsetDateKey(todayKey, -5);
  const d3 = offsetDateKey(todayKey, -3);
  const d2 = offsetDateKey(todayKey, -2);
  const d1 = offsetDateKey(todayKey, -1);

  const m1_d1 = offsetDateKey(todayKey, -26);
  const m1_d2 = offsetDateKey(todayKey, -31);
  const m1_d3 = offsetDateKey(todayKey, -36);
  const m1_d4 = offsetDateKey(todayKey, -41);
  const m1_d5 = offsetDateKey(todayKey, -46);

  const m2_d1 = offsetDateKey(todayKey, -56);
  const m2_d2 = offsetDateKey(todayKey, -62);
  const m2_d3 = offsetDateKey(todayKey, -68);
  const m2_d4 = offsetDateKey(todayKey, -74);

  return [
    ...createArchiveDemoTodos(),
    {
      id: 'todo-1',
      text: 'Atlas A1 저전력 복귀 시나리오 전류 파형 재측정',
      createdAtDate: d3,
      done: false,
    },
    {
      id: 'todo-2',
      text: 'OTA 롤백 테스트 보드 점퍼 핀 배열 최종 확인',
      createdAtDate: d1,
      done: false,
    },
    {
      id: 'todo-3',
      text: 'BLE 연결 끊김 복구 전략 투트랙 실험',
      createdAtDate: todayKey,
      done: false,
    },
    {
      id: 'todo-3-a',
      parentId: 'todo-3',
      text: 'A안: Fast Advertising 인터벌 단축 재연결 측정',
      createdAtDate: todayKey,
      done: true,
      completedAtDate: todayKey,
    },
    {
      id: 'todo-3-b',
      parentId: 'todo-3',
      text: 'B안: Supervision Timeout 4s 연장 안정성 실험',
      createdAtDate: todayKey,
      done: false,
    },
    {
      id: 'todo-4',
      text: '신규 리비전 PCB 전원 시퀀스 오실로스코프 캡처',
      createdAtDate: todayKey,
      done: false,
    },

    // Completed today (shown at bottom of current list with strikethrough)
    {
      id: 'todo-5',
      text: '릴리스 2.4.0 바이너리 SHA-256 체크섬 검증',
      createdAtDate: todayKey,
      done: true,
      completedAtDate: todayKey,
    },
    {
      id: 'todo-6',
      text: '오전 빌드 큐 대기열 상태 점검',
      createdAtDate: d1,
      done: true,
      completedAtDate: todayKey,
    },

    // Current month past days history
    {
      id: 'todo-7',
      text: 'UART 진단 로그 누락 재현 조건 문서화',
      createdAtDate: d3,
      done: true,
      completedAtDate: d1,
    },
    {
      id: 'todo-8',
      text: 'BLE 광고 패킷 인터벌 튜닝 값 적용',
      createdAtDate: d1,
      done: true,
      completedAtDate: d1,
    },
    {
      id: 'todo-9',
      text: 'Atlas A2 워치독 타이머 타임아웃 임계치 조정',
      createdAtDate: d2,
      done: true,
      completedAtDate: d2,
    },
    {
      id: 'todo-10',
      text: '플래시 파티션 테이블 오프셋 계산 스크립트 수정',
      createdAtDate: d3,
      done: true,
      completedAtDate: d2,
    },
    {
      id: 'todo-11',
      text: '주간 펌웨어 빌드 타겟 브랜치 동기화',
      createdAtDate: d3,
      done: true,
      completedAtDate: d3,
    },
    {
      id: 'todo-12',
      text: 'Nova N1 디버그 프로파일 심볼 테이블 크기 점검',
      createdAtDate: d5,
      done: true,
      completedAtDate: d5,
    },
    {
      id: 'todo-13',
      text: '초기 부트로더 CRC 검증 루틴 코드 리뷰',
      createdAtDate: d8,
      done: true,
      completedAtDate: d5,
    },
    {
      id: 'todo-14',
      text: '개발 환경 시리얼 모니터 보드레이트 프리셋 정리',
      createdAtDate: d8,
      done: true,
      completedAtDate: d8,
    },
    {
      id: 'todo-15',
      text: 'I2C 버스 클럭 스트레칭 예외 처리 로직 추가',
      createdAtDate: d11,
      done: true,
      completedAtDate: d11,
    },
    {
      id: 'todo-16',
      text: '센서 폴링 태스크 스택 오버플로 워터마크 확인',
      createdAtDate: d14,
      done: true,
      completedAtDate: d11,
    },
    {
      id: 'todo-17',
      text: '테스트 지그 펌웨어 자동 플래싱 배치 파일 작성',
      createdAtDate: d14,
      done: true,
      completedAtDate: d14,
    },
    {
      id: 'todo-18',
      text: 'RTOS 태스크 우선순위 테이블 정리 및 공유',
      createdAtDate: d18,
      done: true,
      completedAtDate: d18,
    },

    // Previous month (-1 month) history
    {
      id: 'todo-19',
      text: '슬립 모드 진입 전 GPIO 누설 전류 차단 설정',
      createdAtDate: m1_d2,
      done: true,
      completedAtDate: m1_d1,
    },
    {
      id: 'todo-20',
      text: 'SPI DMA 전송 완료 인터럽트 핸들러 최적화',
      createdAtDate: m1_d1,
      done: true,
      completedAtDate: m1_d1,
    },
    {
      id: 'todo-21',
      text: '배터리 잔량 ADC 캘리브레이션 커브 테이블 보정',
      createdAtDate: m1_d2,
      done: true,
      completedAtDate: m1_d2,
    },
    {
      id: 'todo-22',
      text: 'OTA 이미지 서명 키 교체 테스트 수행',
      createdAtDate: m1_d3,
      done: true,
      completedAtDate: m1_d3,
    },
    {
      id: 'todo-23',
      text: '하드웨어 리비전 B 핀맵 변경점 드라이버 반영',
      createdAtDate: m1_d4,
      done: true,
      completedAtDate: m1_d3,
    },
    {
      id: 'todo-24',
      text: '메모리 덤프 추출용 Python 파서 스크립트 개선',
      createdAtDate: m1_d4,
      done: true,
      completedAtDate: m1_d4,
    },
    {
      id: 'todo-25',
      text: '부트 로고 디스플레이 초기화 타이밍 단축',
      createdAtDate: m1_d5,
      done: true,
      completedAtDate: m1_d5,
    },

    // Two months ago (-2 months) history
    {
      id: 'todo-26',
      text: '외부 크리스탈 오실레이터 안정화 대기 시간 측정',
      createdAtDate: m2_d1,
      done: true,
      completedAtDate: m2_d1,
    },
    {
      id: 'todo-27',
      text: '초기 보드 브링업 체크리스트 템플릿 생성',
      createdAtDate: m2_d2,
      done: true,
      completedAtDate: m2_d1,
    },
    {
      id: 'todo-28',
      text: '프로토타입 보드 열화상 카메라 발열 포인트 기록',
      createdAtDate: m2_d2,
      done: true,
      completedAtDate: m2_d2,
    },
    {
      id: 'todo-29',
      text: 'JTAG 디버거 드라이버 및 오픈오씨디 환경 구성',
      createdAtDate: m2_d3,
      done: true,
      completedAtDate: m2_d3,
    },
    {
      id: 'todo-30',
      text: '신규 MCU SDK 레퍼런스 매뉴얼 레지스터 맵 정리',
      createdAtDate: m2_d4,
      done: true,
      completedAtDate: m2_d4,
    },
  ];
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
