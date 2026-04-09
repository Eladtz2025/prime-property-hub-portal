import * as Sentry from '@sentry/react';

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.log('[Sentry] No DSN configured, Sentry disabled');
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 0.5,
  });
  
  logger.info('[Sentry] Initialized successfully');
};

export const captureError = (
  error: Error,
  context?: Record<string, unknown>
) => {
  Sentry.captureException(error, { extra: context });
};

export const captureMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
) => {
  Sentry.captureMessage(message, { level, extra: context });
};

export const setUser = (user: { id: string; email?: string; name?: string } | null) => {
  Sentry.setUser(user);
};

export const addBreadcrumb = (
  message: string,
  category?: string,
  data?: Record<string, unknown>,
  level: 'info' | 'warning' | 'error' = 'info'
) => {
  Sentry.addBreadcrumb({ message, category, data, level });
};

export const startTransaction = (name: string, op: string) => {
  return Sentry.startSpan({ name, op }, () => {});
};

export const measureAsync = async <T>(
  name: string,
  operation: () => Promise<T>,
  _context?: Record<string, unknown>
): Promise<T> => {
  return await Sentry.startSpan({ name, op: 'function' }, async () => {
    return await operation();
  });
};

export const logApiCall = (
  endpoint: string,
  method: string,
  status: number,
  duration?: number
) => {
  Sentry.addBreadcrumb({
    message: `${method} ${endpoint}`,
    category: 'api',
    data: { status, duration },
    level: status >= 400 ? 'error' : 'info',
  });
};

export const SentryErrorBoundary = Sentry.ErrorBoundary;

export const withSentryRouting = Sentry.withSentryRouting;
