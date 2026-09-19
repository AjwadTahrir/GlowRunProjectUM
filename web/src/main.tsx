import React from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted. The wdth axis gives us the condensed display voice from the same family.
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/archivo/wdth-italic.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import { App } from './App';
import { listUnconfirmed } from './config/event';
import './index.css';

// The page shows blank fields for anything the organiser has not confirmed, so a
// missing value is quiet on screen. In development, say it out loud instead.
if (import.meta.env.DEV) {
  const missing = listUnconfirmed();
  if (missing.length > 0) console.info(`[Witches Glow Run] ${missing.length} unconfirmed fields:\n` + missing.join('\n'));
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
