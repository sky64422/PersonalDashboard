import { describe, expect, it } from 'vitest';
import { createLargeHistoryDemo } from '../src/features/todos/demoHistory';

it('large history covers 2020 through 2026 without carry records leaking into 2019', () => {
  const todos = createLargeHistoryDemo('2026-10-24');
  const groups = buildMonthlyTodoGroups(buildDailyTodoLog(todos, '2026-10-24'));
  expect(groups).toHaveLength(82);
  expect(groups.at(-1)?.monthKey).toBe('2020-01');
  expect(groups[0].monthKey).toBe('2026-10');
  expect(todos.length).toBeGreaterThan(12000);
  expect(groups.find(group => group.monthKey === '2020-02')?.totalDays).toBe(29);
});
import { filterTasks } from '../src/features/tasks/filter';
import { validateBuildRequest } from '../src/features/builds/validation';
import { filterFirmware } from '../src/features/firmware/filter';
import { addSubTodo, getComposerTargetParent, getCurrentTodoList, getRemainingTodos, indentTodo, insertTodoAfter, isCarriedOver, outdentTodo, reorderTodos, toggleTodoWithHierarchy, updateTodoText } from '../src/features/todos/todoModel';
import { buildDailyTodoLog, buildMonthlyTodoGroups, searchDailyTodoLog } from '../src/features/todos/todoHistoryModel';
import type { Task, FirmwareArtifact, TodoItem } from '../src/data/model';

const tasks: Task[] = [
  { id: '1', key: 'FW-1', title: 'Boot timing', project: 'Core', assigneeId: 'me', status: 'In Progress', priority: 'Low', updatedAt: '2026-10-20', description: '' },
  { id: '2', key: 'FW-2', title: 'Closed work', project: 'Core', assigneeId: 'me', status: 'Closed', priority: 'High', updatedAt: '2026-10-22', description: '' },
  { id: '3', key: 'FW-3', title: 'Other work', project: 'Core', assigneeId: 'other', status: 'To Do', priority: 'High', updatedAt: '2026-10-22', description: '' },
  { id: '4', key: 'FW-4', title: 'Boot review', project: 'Core', assigneeId: 'me', status: 'Done', priority: 'High', updatedAt: '2026-10-21', description: '' },
];
const filters = { assigneeId: 'me', query: '', status: 'all', sort: 'priority' as const };
describe('assigned task semantics', () => {
  it('excludes Closed and other assignees but retains Done', () => expect(filterTasks(tasks, filters).map(t => t.id)).toEqual(['4', '1']));
  it('includes owned Closed work only when the board requests it', () => expect(filterTasks(tasks, filters, { includeClosed: true }).map(t => t.id)).toEqual(['2', '4', '1']));
  it('combines trimmed case-insensitive search and status', () => expect(filterTasks(tasks, { ...filters, query: ' BOOT ', status: 'In Progress' }).map(t => t.id)).toEqual(['1']));
  it('treats whitespace as an empty query and sorts updates', () => expect(filterTasks(tasks, { ...filters, query: '  ', sort: 'updated' }).map(t => t.id)).toEqual(['4', '1']));
  it('returns an empty result without mutating input', () => { expect(filterTasks(tasks, { ...filters, query: 'missing' })).toEqual([]); expect(tasks.map(t => t.id)).toEqual(['1', '2', '3', '4']); });
});
describe('build validation', () => {
  it.each(['target', 'branch', 'profile'] as const)('rejects blank %s', (field) => expect(validateBuildRequest({ target: 'Atlas', branch: 'main', profile: 'Release', [field]: ' ' })).not.toBeNull());
  it('accepts a complete request', () => expect(validateBuildRequest({ target: 'Atlas', branch: 'main', profile: 'Release' })).toBeNull());
});
const artifacts: FirmwareArtifact[] = [
  { id: 'a', filename: 'Atlas-v2.bin', model: 'Atlas', version: '2.0', branch: 'main', buildId: '100', path: 'C:/demo/Atlas-v2.bin', size: '10 MB', createdAt: '2026-10-22' },
  { id: 'b', filename: 'Nova-v1.bin', model: 'Nova', version: '1.0', branch: 'develop', buildId: '101', path: 'C:/demo/Nova-v1.bin', size: '10 MB', createdAt: '2026-10-22' },
];
describe('firmware lookup', () => {
  it('combines model and normalized filename query', () => expect(filterFirmware(artifacts, { query: ' ATLAS-V2 ', model: 'Atlas' }).map(a => a.id)).toEqual(['a']));
  it('searches build association and branch', () => { expect(filterFirmware(artifacts, { query: '101', model: 'all' }).map(a => a.id)).toEqual(['b']); expect(filterFirmware(artifacts, { query: 'develop', model: 'Atlas' })).toEqual([]); });
});

describe('cumulative todo semantics', () => {
  const sampleTodos: TodoItem[] = [
    { id: 't1', text: 'Unfinished from Oct 20', createdAtDate: '2026-10-20', done: false },
    { id: 't2', text: 'Created Oct 20, finished Oct 22', createdAtDate: '2026-10-20', done: true, completedAtDate: '2026-10-22' },
    { id: 't3', text: 'Completed today', createdAtDate: '2026-10-23', done: true, completedAtDate: '2026-10-23' },
    { id: 't4', text: 'Created today', createdAtDate: '2026-10-23', done: false },
  ];

  it('carries over unfinished items and places today completed items at the bottom of current list', () => {
    const remaining = getRemainingTodos(sampleTodos);
    expect(remaining.map(t => t.id)).toEqual(['t1', 't4']);
    expect(getCurrentTodoList(sampleTodos, '2026-10-23').map(t => t.id)).toEqual(['t1', 't4', 't3']);
    expect(isCarriedOver(sampleTodos[0], '2026-10-23')).toBe(true);
    expect(isCarriedOver(sampleTodos[3], '2026-10-23')).toBe(false);
  });

  it('omits unchanged days (such as 2026-10-21) and hangs past days oldest to Latest on the history line', () => {
    const log = buildDailyTodoLog(sampleTodos, '2026-10-23');
    expect(log.map(entry => entry.date)).toEqual(['2026-10-20', '2026-10-22']);
    expect(log[log.length - 1]?.isLatest).toBe(true);
    expect(log.find(entry => entry.date === '2026-10-21')).toBeUndefined();
  });

  it('groups past history by month and orders entries within each month oldest to Latest', () => {
    const multiMonthTodos: TodoItem[] = [
      ...sampleTodos,
      { id: 't0', text: 'September work', createdAtDate: '2026-09-15', done: true, completedAtDate: '2026-09-15' },
    ];
    const groups = buildMonthlyTodoGroups(buildDailyTodoLog(multiMonthTodos, '2026-10-23'));
    expect(groups.map(g => g.monthKey)).toEqual(['2026-10', '2026-09']);
    expect(groups[0].entries.map(e => e.date)).toEqual(['2026-10-20', '2026-10-22']);
    expect(groups[1].entries.map(e => e.date)).toEqual(['2026-09-15']);
  });

  it('auto-completes parent when all child tracks are done and reopens parent when a child is unchecked', () => {
    let list: TodoItem[] = [
      { id: 'p1', text: 'Two-track experiment', createdAtDate: '2026-10-23', done: false },
    ];
    list = addSubTodo(list, 'p1', 'Track A', '2026-10-23', 'c1');
    list = addSubTodo(list, 'p1', 'Track B', '2026-10-23', 'c2');

    list = toggleTodoWithHierarchy(list, 'c1', '2026-10-23');
    expect(list.find(t => t.id === 'p1')?.done).toBe(false);

    list = toggleTodoWithHierarchy(list, 'c2', '2026-10-23');
    expect(list.find(t => t.id === 'p1')?.done).toBe(true);
    expect(list.find(t => t.id === 'p1')?.completedAtDate).toBe('2026-10-23');

    list = toggleTodoWithHierarchy(list, 'c1', '2026-10-23');
    expect(list.find(t => t.id === 'p1')?.done).toBe(false);
  });

  it('indents with Tab into child and grandchild (하위의 하위) and outdents with Shift+Tab', () => {
    let list: TodoItem[] = [
      { id: 'p1', text: 'Root topic', createdAtDate: '2026-10-23', done: false },
      { id: 'c1', text: 'Track A', createdAtDate: '2026-10-23', done: false },
      { id: 'gc1', text: 'Sub-step A-1', createdAtDate: '2026-10-23', done: false },
    ];

    list = indentTodo(list, 'c1', '2026-10-23');
    expect(list.find(t => t.id === 'c1')?.parentId).toBe('p1');

    // First Tab on gc1 makes it a child of p1; second Tab makes it a child of c1 (하위의 하위)
    list = indentTodo(list, 'gc1', '2026-10-23');
    expect(list.find(t => t.id === 'gc1')?.parentId).toBe('p1');
    list = indentTodo(list, 'gc1', '2026-10-23');
    expect(list.find(t => t.id === 'gc1')?.parentId).toBe('c1');

    // Completing gc1 completes c1 and p1 recursively
    list = toggleTodoWithHierarchy(list, 'gc1', '2026-10-23');
    expect(list.find(t => t.id === 'c1')?.done).toBe(true);
    expect(list.find(t => t.id === 'p1')?.done).toBe(true);

    // Shift+Tab outdents gc1 up to p1, then to root
    list = outdentTodo(list, 'gc1', '2026-10-23');
    expect(list.find(t => t.id === 'gc1')?.parentId).toBe('p1');
    list = outdentTodo(list, 'gc1', '2026-10-23');
    expect(list.find(t => t.id === 'gc1')?.parentId).toBeUndefined();
  });

  it('updates text inline and inserts new line after target like a notepad', () => {
    let list: TodoItem[] = [
      { id: '1', text: 'Line 1', createdAtDate: '2026-10-23', done: false },
      { id: '2', text: 'Line 2', createdAtDate: '2026-10-23', done: false },
    ];
    list = updateTodoText(list, '1', 'Line 1 edited');
    expect(list.find(t => t.id === '1')?.text).toBe('Line 1 edited');

    const res = insertTodoAfter(list, '1', '2026-10-23', '1-next');
    expect(res.todos.map(t => t.id)).toEqual(['1', '1-next', '2']);
    expect(res.createdId).toBe('1-next');
  });

  it('resolves composer target parent for child and grandchild (하위의 하위) based on depth', () => {
    const list: TodoItem[] = [
      { id: 'p1', text: 'Parent task', createdAtDate: '2026-10-23', done: false },
      { id: 'c1', parentId: 'p1', text: 'Track A', createdAtDate: '2026-10-23', done: false },
    ];
    // depth 0: root
    expect(getComposerTargetParent(list, 0)).toEqual({
      parentId: undefined,
      parentText: undefined,
      maxDepth: 1,
    });
    // depth 1: child under p1
    expect(getComposerTargetParent(list, 1)).toEqual({
      parentId: 'p1',
      parentText: 'Parent task',
      maxDepth: 2,
    });
    // depth 2: grandchild under c1 (하위의 하위)
    expect(getComposerTargetParent(list, 2)).toEqual({
      parentId: 'c1',
      parentText: 'Track A',
      maxDepth: 2,
    });
  });

  it('reorders tasks along with their descendants without breaking hierarchy', () => {
    const list: TodoItem[] = [
      { id: '1', text: 'Task 1', createdAtDate: '2026-10-24', done: false },
      { id: '1-sub', parentId: '1', text: 'Sub 1', createdAtDate: '2026-10-24', done: false },
      { id: '2', text: 'Task 2', createdAtDate: '2026-10-24', done: false },
      { id: '3', text: 'Task 3', createdAtDate: '2026-10-24', done: false },
    ];
    // Move Task 1 to before Task 3
    const reordered = reorderTodos(list, '1', '3');
    expect(reordered.map(t => t.id)).toEqual(['2', '1', '1-sub', '3']);

    // Prevent dragging parent into its own child
    const invalid = reorderTodos(list, '1', '1-sub');
    expect(invalid).toBe(list);
  });

  describe('searchDailyTodoLog', () => {
    const historicalTodos: TodoItem[] = [
      { id: '1', text: 'Atlas A1 저전력 복귀 시나리오', createdAtDate: '2026-10-20', done: true, completedAtDate: '2026-10-20' },
      { id: '2', text: 'OTA 롤백 테스트 보드 점퍼 핀 배열', createdAtDate: '2026-10-21', done: true, completedAtDate: '2026-10-21' },
      { id: '3', text: 'Atlas A2 워치독 타이머 임계치 조정', createdAtDate: '2026-10-22', done: true, completedAtDate: '2026-10-22' },
      { id: '4', text: '릴리스 2.4.0 바이너리 SHA 검증', createdAtDate: '2026-10-23', done: true, completedAtDate: '2026-10-23' },
    ];
    const log = buildDailyTodoLog(historicalTodos, '2026-10-24');

    it('returns all entries when query is empty or whitespace', () => {
      expect(searchDailyTodoLog(log, '')).toBe(log);
      expect(searchDailyTodoLog(log, '   ')).toBe(log);
    });

    it('filters entries containing query across dates and marks latest result', () => {
      const results = searchDailyTodoLog(log, 'atlas');
      expect(results.length).toBe(2);
      expect(results[0].date).toBe('2026-10-20');
      expect(results[1].date).toBe('2026-10-22');
      expect(results[1].isLatest).toBe(true);
      expect(results[0].isLatest).toBe(false);
      expect(results[0].completedOnDay[0].text).toContain('Atlas');
    });

    it('returns empty array when no entries match query', () => {
      const results = searchDailyTodoLog(log, 'NonExistentKeyword');
      expect(results).toEqual([]);
    });
  });
});
