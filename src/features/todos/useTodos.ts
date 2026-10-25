import { useCallback, useEffect, useRef, useState } from 'react';
import type { TodoItem } from '../../data/model';
import { addSubTodo, deleteTodoWithHierarchy, indentTodo, insertTodoAfter, outdentTodo, reorderTodos, toggleTodoWithHierarchy, updateTodoText } from './todoModel';
import { TODOS_STORAGE_KEY } from './todoStorage';

const TODO_SAVE_DELAY_MS = 350;

export function useTodos(initialTodos: TodoItem[], todayKey: string, preview: boolean, notify: (message: string) => void) {
  const [todos, setTodos] = useState(initialTodos);
  const pendingSaveTimeout = useRef<number | null>(null);
  const latestTodosRef = useRef<TodoItem[]>(todos);
  latestTodosRef.current = todos;

  const saveToStorage = useCallback((items: TodoItem[]) => {
    if (preview) return;
    try {
      localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(items));
    } catch {
      notify('할 일 목록을 저장하지 못했습니다. 이번 실행에만 적용됩니다.');
    }
  }, [preview, notify]);

  const flushStorageSave = useCallback(() => {
    if (pendingSaveTimeout.current !== null) {
      clearTimeout(pendingSaveTimeout.current);
      pendingSaveTimeout.current = null;
      saveToStorage(latestTodosRef.current);
    }
  }, [saveToStorage]);

  useEffect(() => {
    window.addEventListener('beforeunload', flushStorageSave);
    return () => {
      flushStorageSave();
      window.removeEventListener('beforeunload', flushStorageSave);
    };
  }, [flushStorageSave]);

  function persistTodos(next: TodoItem[], debounce = false) {
    setTodos(next);
    latestTodosRef.current = next;
    if (preview) return;

    if (debounce) {
      if (pendingSaveTimeout.current !== null) {
        clearTimeout(pendingSaveTimeout.current);
      }
      pendingSaveTimeout.current = window.setTimeout(() => {
        pendingSaveTimeout.current = null;
        saveToStorage(next);
      }, TODO_SAVE_DELAY_MS);
    } else {
      if (pendingSaveTimeout.current !== null) {
        clearTimeout(pendingSaveTimeout.current);
        pendingSaveTimeout.current = null;
      }
      saveToStorage(next);
    }
  }

  function addTodo(text: string, parentId?: string): string {
    const id = `todo-${crypto.randomUUID().slice(0, 8)}`;
    if (parentId) {
      persistTodos(addSubTodo(todos, parentId, text, todayKey, id));
      return id;
    }
    const item: TodoItem = {
      id,
      text,
      createdAtDate: todayKey,
      done: false,
    };
    persistTodos([...todos, item]);
    return id;
  }

  function handleUpdateTodoText(id: string, text: string) {
    persistTodos(updateTodoText(todos, id, text), true);
  }

  function handleInsertTodoAfter(targetId: string): string {
    const result = insertTodoAfter(todos, targetId, todayKey);
    persistTodos(result.todos);
    return result.createdId;
  }

  function handleIndentTodo(id: string) {
    persistTodos(indentTodo(todos, id, todayKey));
  }

  function handleOutdentTodo(id: string) {
    persistTodos(outdentTodo(todos, id, todayKey));
  }

  function toggleTodo(id: string) {
    persistTodos(toggleTodoWithHierarchy(todos, id, todayKey));
  }

  function deleteTodo(id: string) {
    persistTodos(deleteTodoWithHierarchy(todos, id, todayKey));
  }

  function handleReorderTodo(sourceId: string, targetId: string) {
    persistTodos(reorderTodos(todos, sourceId, targetId));
  }
  return {
    todos,
    onAdd: addTodo,
    onUpdateText: handleUpdateTodoText,
    onInsertAfter: handleInsertTodoAfter,
    onIndent: handleIndentTodo,
    onOutdent: handleOutdentTodo,
    onToggle: toggleTodo,
    onDelete: deleteTodo,
    onReorder: handleReorderTodo,
  };
}
