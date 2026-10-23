export const THEME_STORAGE_KEY = 'folio.theme';
export const THEMES = [
  { id: 'light', name: 'Daylight', description: '밝고 선명한 업무 공간' },
  { id: 'dark', name: 'Midnight', description: '차콜, 스톤, 아이보리' },
] as const;
export type Theme = typeof THEMES[number]['id'];

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

// Resolve before React mounts so a saved dark theme never renders a light app first.
let savedTheme: Theme = 'light';
let storageError = '';
try {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'dark') savedTheme = saved;
} catch {
  storageError = '저장된 테마를 읽지 못했습니다. 이 세션에서는 테마를 변경할 수 있습니다.';
}
export const initialTheme = savedTheme;
export const initialThemeError = storageError;
applyTheme(initialTheme);
