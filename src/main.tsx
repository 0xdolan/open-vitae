import '@fontsource-variable/manrope';
import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { applyTheme } from './lib/theme';
import { useUiStore } from './stores/ui-store';
import { startPwa } from './pwa/register';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root is missing from index.html');
}

// Set the theme before the first paint, so a dark page does not flash white.
applyTheme(useUiStore.getState().theme);

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

startPwa();
