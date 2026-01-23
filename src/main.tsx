import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { registerServiceWorker } from './utils/pwa'
import { initSentry } from './lib/sentry'

// Initialize Sentry BEFORE importing App to ensure React hooks work
initSentry();

// Register service worker for PWA functionality
registerServiceWorker();

// Import App after Sentry is initialized
import('./App').then(({ default: App }) => {
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch((err) => {
  console.error('Failed to load App:', err);
});
