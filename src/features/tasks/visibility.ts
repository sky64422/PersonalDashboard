export const HIDDEN_TASKS_STORAGE_KEY = 'friday.hidden-task-ids';

// This preference is local to the dashboard; Jira records are never changed.
function readHiddenTasks(): { ids: string[]; error: string } {
  try {
    const saved = localStorage.getItem(HIDDEN_TASKS_STORAGE_KEY);
    if (!saved) return { ids: [], error: '' };
    const ids: unknown = JSON.parse(saved);
    if (!Array.isArray(ids) || !ids.every(id => typeof id === 'string')) throw new Error('Invalid hidden task IDs');
    return { ids: [...new Set(ids)], error: '' };
  } catch {
    return { ids: [], error: '숨긴 업무 설정을 읽지 못해 모든 업무를 표시합니다. 다시 숨기면 설정을 저장할 수 있습니다.' };
  }
}
export const initialHiddenTasks = readHiddenTasks();
