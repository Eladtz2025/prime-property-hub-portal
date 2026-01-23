// Sentry has been temporarily removed to resolve React hooks conflict
// The @sentry/react package was causing multiple React instances in the Vite preview

export const initSentry = () => {
  console.log('[Sentry] Disabled - package removed to fix React hooks conflict');
};

// Stub functions to prevent errors in code that references Sentry utilities
export const captureError = (
  error: Error,
  context?: Record<string, unknown>
) => {
  console.error('[Error]', error.message, context);
};

export const captureMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
) => {
  console.log(`[${level}]`, message, context);
};

export const setUser = (user: { id: string; email?: string; name?: string } | null) => {
  // No-op
};

export const addBreadcrumb = (
  message: string,
  category?: string,
  data?: Record<string, unknown>,
  level: 'info' | 'warning' | 'error' = 'info'
) => {
  // No-op
};

export const startTransaction = (name: string, op: string) => {
  return null;
};

export const measureAsync = async <T>(
  name: string,
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> => {
  return await operation();
};

export const logApiCall = (
  endpoint: string,
  method: string,
  status: number,
  duration?: number
) => {
  // No-op
};

// Stub ErrorBoundary - just render children
export const SentryErrorBoundary = ({ children }: { children: React.ReactNode }) => children;

// Stub routing wrapper - just return the component
export const withSentryRouting = <P extends object>(Component: React.ComponentType<P>) => Component;
