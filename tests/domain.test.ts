import { describe, expect, it } from 'vitest';
import { filterTasks } from '../src/features/tasks/filter';
import { validateBuildRequest } from '../src/features/builds/validation';
import { filterFirmware } from '../src/features/firmware/filter';
import type { Task, FirmwareArtifact } from '../src/data/model';

const tasks: Task[] = [
  { id: '1', key: 'FW-1', title: 'Boot timing', project: 'Core', assigneeId: 'me', status: 'In Progress', priority: 'Low', updatedAt: '2026-10-20', description: '' },
  { id: '2', key: 'FW-2', title: 'Closed work', project: 'Core', assigneeId: 'me', status: 'Closed', priority: 'High', updatedAt: '2026-10-22', description: '' },
  { id: '3', key: 'FW-3', title: 'Other work', project: 'Core', assigneeId: 'other', status: 'To Do', priority: 'High', updatedAt: '2026-10-22', description: '' },
  { id: '4', key: 'FW-4', title: 'Boot review', project: 'Core', assigneeId: 'me', status: 'Done', priority: 'High', updatedAt: '2026-10-21', description: '' },
];
const filters = { assigneeId: 'me', query: '', status: 'all', sort: 'priority' as const };
describe('assigned task semantics', () => {
  it('excludes Closed and other assignees but retains Done', () => expect(filterTasks(tasks, filters).map(t => t.id)).toEqual(['4', '1']));
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
