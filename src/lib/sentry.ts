import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const initSentry = () => {
  // Only initialize if DSN is provided
  if (!SENTRY_DSN) {
    console.log('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Session Replay (optional, for debugging)
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Environment
    environment: import.meta.env.MODE,
    
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    
    // Filter events
    beforeSend(event, hint) {
      // Filter out specific errors if needed
      const error = hint.originalException;
      
      // Don't send network errors for local development
      if (import.meta.env.DEV) {
        return null;
      }
      
      // Filter out common non-critical errors
      if (error instanceof Error) {
        // Skip ResizeObserver errors (common in React)
        if (error.message?.includes('ResizeObserver')) {
          return null;
        }
        
        // Skip chunk load errors (usually network issues)
        if (error.message?.includes('Loading chunk')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Network errors
      'NetworkError',
      'Failed to fetch',
      // Chrome specific
      'ResizeObserver loop limit exceeded',
    ],
    
    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });

  console.log('[Sentry] Initialized successfully');
};

// Helper function to capture errors with context
export const captureError = (
  error: Error,
  context?: Record<string, unknown>
) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
};

// Helper function to capture messages
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info'
) => {
  Sentry.captureMessage(message, level);
};

// Helper function to set user context
export const setUser = (user: { id: string; email?: string; name?: string } | null) => {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  } else {
    Sentry.setUser(null);
  }
};

// Helper function to add breadcrumb
export const addBreadcrumb = (
  message: string,
  category?: string,
  data?: Record<string, unknown>
) => {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    data,
    level: 'info',
  });
};

// Error boundary wrapper component
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Wrap routes with performance monitoring
export const withSentryRouting = Sentry.withSentryRouting;
