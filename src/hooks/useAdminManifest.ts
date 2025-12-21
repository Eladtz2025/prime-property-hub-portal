import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useAdminManifest = () => {
  const location = useLocation();
  
  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin') || 
                         location.pathname === '/properties' ||
                         location.pathname === '/settings';
    
    const manifestLink = document.querySelector('link[rel="manifest"]');
    
    if (manifestLink) {
      if (isAdminRoute) {
        manifestLink.setAttribute('href', '/admin-manifest.json');
      } else {
        manifestLink.setAttribute('href', '/manifest.json');
      }
    }
  }, [location.pathname]);
};
