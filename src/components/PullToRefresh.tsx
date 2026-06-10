import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // Mirror isPulling into a ref so the document-level listener and unmount
  // cleanup can read the live value without re-subscribing.
  const isPullingRef = useRef(false);

  const threshold = 70; // Minimum distance to trigger refresh

  // True only when the relevant scroll container is at the very top.
  const isAtTop = () => {
    const el = containerRef.current;
    const containerTop = el ? el.scrollTop <= 0 : true;
    return window.scrollY <= 0 && containerTop;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isAtTop()) return;
    setStartY(e.touches[0].clientY);
    setIsPulling(true);
    isPullingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || !isAtTop()) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;

    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const stopPulling = () => {
    setIsPulling(false);
    isPullingRef.current = false;
    setPullDistance(0);
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    setIsPulling(false);
    isPullingRef.current = false;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  };

  const handleTouchCancel = () => {
    stopPulling();
  };

  useEffect(() => {
    // Block native scroll only while actively pulling AND at the top of the
    // scroll container. Reading the refs keeps this independent of stale state.
    const preventDefault = (e: Event) => {
      if (isPullingRef.current && isAtTop()) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safety net: if the component unmounts mid-gesture, reset pull state so we
  // never leave a scroll-lock or a dangling "pulling" flag behind.
  useEffect(() => {
    return () => {
      isPullingRef.current = false;
    };
  }, []);

  const refreshProgress = Math.min(pullDistance / threshold, 1);
  const showRefreshIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Refresh Indicator */}
      <div 
        className={`absolute top-0 left-0 right-0 flex items-center justify-center bg-primary/10 backdrop-blur-sm border-b border-primary/20 transition-all duration-300 z-10 ${
          showRefreshIndicator ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          height: isRefreshing ? '60px' : `${Math.max(0, pullDistance)}px`,
          transform: `translateY(${isRefreshing ? 0 : Math.max(-60, -60 + pullDistance)}px)`
        }}
      >
        <div className="flex items-center gap-2 text-primary">
          <RefreshCw 
            className={`h-5 w-5 transition-transform duration-300 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{ 
              transform: `rotate(${refreshProgress * 180}deg)` 
            }}
          />
          <span className="text-sm font-medium">
            {isRefreshing ? 'מרענן...' : pullDistance >= threshold ? 'שחרר לרענון' : 'משוך למטה'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div 
        className="transition-transform duration-300"
        style={{ 
          transform: `translateY(${isRefreshing ? '60px' : `${pullDistance}px`})` 
        }}
      >
        {children}
      </div>
    </div>
  );
};