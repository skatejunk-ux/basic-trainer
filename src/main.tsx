import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getSettings, initDb } from './db';
import { applyTheme } from './theme';
import { DEFAULT_SETTINGS } from './types';
import '@fontsource/bangers/latin-400.css';
import './index.css';

applyTheme(DEFAULT_SETTINGS.theme);
registerSW({ immediate: true });
// Thema uit de opgeslagen instellingen zodra de database klaar is.
void initDb().then(async () => applyTheme((await getSettings()).theme));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
