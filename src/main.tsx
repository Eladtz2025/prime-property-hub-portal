import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { registerServiceWorker } from './utils/pwa'
import { initSentry } from './lib/sentry'

// Initialize Sentry first
initSentry();

// Register service worker for PWA functionality
registerServiceWorker();

// Render the app
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
