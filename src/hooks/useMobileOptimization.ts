
import { useEffect, useState } from 'react';

export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const checkMobile = () => {
      // Multi-factor mobile detection
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      const isNarrowViewport = window.screen.width < 768;
      
      // Force mobile mode if any mobile indicators are present
      const shouldBeMobile = isMobileUA || (hasTouch && isSmallScreen) || isNarrowViewport;
      
      setIsMobile(shouldBeMobile);
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
      
      // Add CSS class for mobile detection fallback
      if (shouldBeMobile) {
        document.documentElement.classList.add('mobile-device');
        // Ensure viewport is properly set for mobile devices
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, shrink-to-fit=no');
        }
      } else {
        document.documentElement.classList.remove('mobile-device');
      }
    };

    // Set RTL for Hebrew support
    document.documentElement.classList.add('rtl');
    document.dir = 'rtl';
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  return { isMobile, orientation };
};
