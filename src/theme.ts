import type { AppSettings } from './types';

let mediaListener: (() => void) | null = null;

/** Zet data-theme op <html>. 'system' volgt prefers-color-scheme (ook bij wisselen). */
export function applyTheme(theme: AppSettings['theme']): void {
  const media = window.matchMedia?.('(prefers-color-scheme: light)');
  const set = () => {
    const resolved = theme === 'system' ? (media?.matches ? 'light' : 'dark') : theme;
    document.documentElement.dataset.theme = resolved;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolved === 'light' ? '#f6f7f9' : '#0f1115');
  };
  if (mediaListener) media?.removeEventListener('change', mediaListener);
  mediaListener = theme === 'system' ? set : null;
  if (mediaListener) media?.addEventListener('change', mediaListener);
  set();
}
