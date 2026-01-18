import { useEffect } from 'react';

/**
 * Hook to manage unsaved changes warnings
 * - Shows browser confirmation on page close/refresh
 * - Note: React Router navigation blocking requires Data Router (createBrowserRouter)
 *   which is not used in this app, so we only use beforeunload event
 */
export const useUnsavedChanges = (isDirty: boolean) => {
  // Browser close/refresh warning
  useEffect(() => {
    if (!isDirty) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return { isDirty };
};
