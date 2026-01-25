import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { registerServiceWorker } from './utils/pwa'
import { initSentry } from './lib/sentry'

// Register service worker for PWA functionality
registerServiceWorker();

// Render the app first, then initialize Sentry
// This avoids React hook conflicts with Sentry's instrumentation
const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize Sentry after React is mounted
// Use requestIdleCallback for non-blocking initialization
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => initSentry());
} else {
  setTimeout(() => initSentry(), 100);
}
