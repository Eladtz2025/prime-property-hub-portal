import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './utils/pwa'

// Register service worker for PWA functionality
registerServiceWorker();

// Dynamically import Sentry to avoid React hooks conflicts
import('./lib/sentry').then(({ initSentry }) => {
  initSentry();
}).catch(() => {
  console.log('[Sentry] Failed to load, continuing without error monitoring');
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
