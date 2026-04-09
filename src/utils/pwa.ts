import { logger } from '@/utils/logger';
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // First, unregister any existing service workers to ensure fresh start
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of existingRegistrations) {
        await registration.unregister();
        logger.info('SW unregistered old:', registration);
      }
      
      // Register with cache-busting and force network fetch
      const registration = await navigator.serviceWorker.register(`/sw.js?v=${Date.now()}`, {
        updateViaCache: 'none' // Critical: always fetch sw.js from network
      });
      logger.info('SW registered: ', registration);
      
      // Force update check immediately
      registration.update();
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available - no auto-reload to prevent page jumps
              logger.info('[SW] New content available, refresh when convenient');
            }
          });
        }
      });
    } catch (error) {
      logger.info('SW registration failed: ', error);
    }
  }
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.png',
      badge: '/favicon.png',
      dir: 'rtl',
      lang: 'he',
      ...options
    });
  }
};