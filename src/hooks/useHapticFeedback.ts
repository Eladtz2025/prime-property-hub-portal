import { useCallback } from 'react';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export const useHapticFeedback = () => {
  const trigger = useCallback((type: HapticType = 'light') => {
    // Check if device supports haptics
    if ('vibrate' in navigator) {
      let pattern: number | number[];
      
      switch (type) {
        case 'light':
          pattern = 10;
          break;
        case 'medium':
          pattern = 50;
          break;
        case 'heavy':
          pattern = 100;
          break;
        case 'success':
          pattern = [50, 50, 50];
          break;
        case 'warning':
          pattern = [100, 50, 100];
          break;
        case 'error':
          pattern = [200, 100, 200];
          break;
        default:
          pattern = 10;
      }
      
      navigator.vibrate(pattern);
    }
  }, []);

  return { trigger };
};