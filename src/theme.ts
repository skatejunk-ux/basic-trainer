import type { AppSettings } from './types';

/** Zet data-theme op <html>. 'system' volgt prefers-color-scheme. */
export function applyTheme(theme: AppSettings['theme']): void {
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
      : theme;
  document.documentElement.dataset.theme = resolved;
}
