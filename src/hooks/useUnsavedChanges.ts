import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Hook to manage unsaved changes warnings
 * - Shows browser confirmation on page close/refresh
 * - Blocks React Router navigation when dirty
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

  // React Router navigation blocking
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  return { blocker };
};
