import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './utils/pwa'
import { initSentry } from './lib/sentry'

// Initialize Sentry for error monitoring
initSentry();

// Register service worker for PWA functionality
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
