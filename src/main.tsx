import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { applyTheme } from './theme';
import { DEFAULT_SETTINGS } from './types';
import './index.css';

applyTheme(DEFAULT_SETTINGS.theme);
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
