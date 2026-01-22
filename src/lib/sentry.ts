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
    
    // Performance Monitoring - Enhanced tracing
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0, // 20% in prod, 100% in dev
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/.*\.supabase\.co/,
      /^https:\/\/.*\.lovable\.app/,
    ],
    
    // Session Replay for debugging - reduced to prevent 429 rate limiting
    replaysSessionSampleRate: import.meta.env.PROD ? 0.05 : 0.5, // 5% in prod
    replaysOnErrorSampleRate: 0.5, // 50% of sessions with errors (reduced from 100%)
    
    // Environment
    environment: import.meta.env.MODE,
    
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    
    // Enhanced logging
    debug: import.meta.env.DEV,
    
    // Attach stack traces to all messages
    attachStacktrace: true,
    
    // Normalize depth for context data
    normalizeDepth: 6,
    
    // Filter events
    beforeSend(event, hint) {
      // Don't send in development unless explicitly enabled
      if (import.meta.env.DEV && !import.meta.env.VITE_SENTRY_DEV_ENABLED) {
        console.log('[Sentry] Event captured (dev mode):', event.message || event.exception?.values?.[0]?.value);
        return null;
      }
      
      const error = hint.originalException;
      
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
        
        // Skip cancelled requests
        if (error.message?.includes('AbortError') || error.message?.includes('cancelled')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Enhanced breadcrumbs
    beforeBreadcrumb(breadcrumb, hint) {
      // Add more context to fetch breadcrumbs
      if (breadcrumb.category === 'fetch' && hint?.input) {
        const url = hint.input[0];
        if (typeof url === 'string') {
          breadcrumb.data = {
            ...breadcrumb.data,
            endpoint: url.split('?')[0],
          };
        }
      }
      
      // Filter out noisy console breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null;
      }
      
      return breadcrumb;
    },
    
    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      // Network errors
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      // Chrome specific
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // User interactions
      'Non-Error promise rejection captured',
      // Preload and meta tag warnings (browser-specific, not actionable)
      'preloaded using link preload',
      'apple-mobile-web-app-capable',
    ],
    
    // Integrations
    integrations: [
      // Browser tracing for performance
      Sentry.browserTracingIntegration({
        enableInp: true, // Interaction to Next Paint
      }),
      
      // Session replay for debugging
      Sentry.replayIntegration({
        maskAllText: false, // Allow text for better debugging
        maskAllInputs: true, // Mask sensitive inputs
        blockAllMedia: false,
        networkDetailAllowUrls: [
          /supabase\.co/,
        ],
      }),
      
      // HTTP client integration for better fetch tracking
      Sentry.httpClientIntegration(),
      
      // Capture console errors - only errors, not warnings (reduces noise)
      Sentry.captureConsoleIntegration({
        levels: ['error'],
      }),
    ],
  });

  console.log('[Sentry] Initialized successfully with enhanced tracing');
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

// Helper function to capture messages with levels
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureMessage(message, level);
  });
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
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info'
) => {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    data,
    level,
  });
};

// Helper function to start a transaction for performance monitoring
export const startTransaction = (name: string, op: string) => {
  return Sentry.startInactiveSpan({
    name,
    op,
  });
};

// Helper function to measure async operations
export const measureAsync = async <T>(
  name: string,
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> => {
  const span = Sentry.startInactiveSpan({
    name,
    op: 'function',
  });
  
  try {
    const result = await operation();
    span?.end();
    return result;
  } catch (error) {
    span?.end();
    captureError(error as Error, { operation: name, ...context });
    throw error;
  }
};

// Helper to log API calls
export const logApiCall = (
  endpoint: string,
  method: string,
  status: number,
  duration?: number
) => {
  addBreadcrumb(
    `API ${method} ${endpoint} - ${status}`,
    'api',
    { endpoint, method, status, duration },
    status >= 400 ? 'error' : 'info'
  );
};

// Error boundary wrapper component
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Wrap routes with performance monitoring
export const withSentryRouting = Sentry.withSentryRouting;
