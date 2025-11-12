import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useLanguageDirection = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    
    // Determine if the current path should use RTL
    const isRTL = 
      path.startsWith('/he') || 
      path.startsWith('/admin-dashboard') || 
      path.startsWith('/owner-portal') ||
      path.startsWith('/owner-financials') ||
      path === '/' ||
      (!path.startsWith('/en') && !path.startsWith('/brokerage-form'));

    // Apply RTL or LTR
    if (isRTL) {
      document.documentElement.classList.add('rtl');
      document.documentElement.classList.remove('ltr');
      document.dir = 'rtl';
    } else {
      document.documentElement.classList.add('ltr');
      document.documentElement.classList.remove('rtl');
      document.dir = 'ltr';
    }
  }, [location.pathname]);
};
