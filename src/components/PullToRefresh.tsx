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

  const threshold = 70; // Minimum distance to trigger refresh

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY > 0) return;
    setStartY(e.touches[0].clientY);
    setIsPulling(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || window.scrollY > 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
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

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    
    if (isPulling && pullDistance > 0) {
      document.addEventListener('touchmove', preventDefault, { passive: false });
      return () => document.removeEventListener('touchmove', preventDefault);
    }
  }, [isPulling, pullDistance]);

  const refreshProgress = Math.min(pullDistance / threshold, 1);
  const showRefreshIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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