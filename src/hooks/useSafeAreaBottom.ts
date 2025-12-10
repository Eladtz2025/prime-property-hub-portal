import { useState, useEffect } from 'react';

export function useSafeAreaBottom(baseOffset: number = 32) {
  const [bottomOffset, setBottomOffset] = useState(baseOffset);

  useEffect(() => {
    const updateOffset = () => {
      if (window.visualViewport) {
        // Calculate browser toolbar height dynamically
        const browserToolbarHeight = window.innerHeight - window.visualViewport.height;
        setBottomOffset(baseOffset + Math.max(0, browserToolbarHeight));
      }
    };

    updateOffset();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateOffset);
      window.visualViewport.addEventListener('scroll', updateOffset);
    }

    window.addEventListener('resize', updateOffset);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateOffset);
        window.visualViewport.removeEventListener('scroll', updateOffset);
      }
      window.removeEventListener('resize', updateOffset);
    };
  }, [baseOffset]);

  return bottomOffset;
}
