// Keep the storage key across the Friday rename to retain existing preferences.
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

// Theme tokens and common constants for theme switching
export interface ThemeTokens {
  brandAccent: string;
  history: {
    accent: string;
    accentHover: string;
    monthAvailableBg: string;
    monthAvailableBorder: string;
    monthAvailableColor: string;
    monthDisabledBg: string;
    monthDisabledBorder: string;
    monthDisabledColor: string;
    monthActiveBg: string;
    monthActiveBorder: string;
    monthActiveColor: string;
    stageBg: string;
    stageBorder: string;
    cardBg: string;
    cardBorder: string;
    stampBg: string;
    stampColor: string;
    stampBorder: string;
  };
}

export const THEME_TOKENS: Record<Theme, ThemeTokens> = {
  light: {
    brandAccent: '#7c3aed',
    history: {
      accent: '#7c3aed',
      accentHover: '#6d28d9',
      monthAvailableBg: 'rgba(124, 58, 237, 0.04)',
      monthAvailableBorder: 'rgba(124, 58, 237, 0.14)',
      monthAvailableColor: '#29292f',
      monthDisabledBg: 'rgba(0, 0, 0, 0.03)',
      monthDisabledBorder: 'rgba(0, 0, 0, 0.06)',
      monthDisabledColor: '#71717a',
      monthActiveBg: '#7c3aed',
      monthActiveBorder: '#7c3aed',
      monthActiveColor: '#ffffff',
      stageBg: '#fafafc',
      stageBorder: '#eae8f0',
      cardBg: '#ffffff',
      cardBorder: '#e7e5ec',
      stampBg: 'rgba(124, 58, 237, 0.06)',
      stampColor: '#7c3aed',
      stampBorder: 'rgba(124, 58, 237, 0.16)',
    },
  },
  dark: {
    brandAccent: '#cca04b',
    history: {
      accent: '#cca04b',
      accentHover: '#dfb76c',
      monthAvailableBg: 'rgba(204, 160, 75, 0.06)',
      monthAvailableBorder: 'rgba(204, 160, 75, 0.2)',
      monthAvailableColor: '#f1f5f9',
      monthDisabledBg: 'rgba(255, 255, 255, 0.04)',
      monthDisabledBorder: 'rgba(255, 255, 255, 0.08)',
      monthDisabledColor: '#94a3b8',
      monthActiveBg: 'rgba(204, 160, 75, 0.2)',
      monthActiveBorder: 'rgba(204, 160, 75, 0.75)',
      monthActiveColor: '#f5e6cb',
      stageBg: '#121314',
      stageBorder: '#282a2e',
      cardBg: 'linear-gradient(180deg, #24262b 0%, #1c1d21 100%)',
      cardBorder: 'rgba(255, 255, 255, 0.12)',
      stampBg: 'rgba(204, 160, 75, 0.14)',
      stampColor: '#f5e6cb',
      stampBorder: 'rgba(204, 160, 75, 0.35)',
    },
  },
};

export function getThemeTokens(theme: Theme): ThemeTokens {
  return THEME_TOKENS[theme] ?? THEME_TOKENS.light;
}
