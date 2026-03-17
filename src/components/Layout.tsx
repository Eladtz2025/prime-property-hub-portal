import React from 'react';
import { EnhancedTopNavigation } from './EnhancedTopNavigation';
import { MobileBottomNavigation } from './MobileBottomNavigation';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  onLogout
}) => {
  const { isMobile } = useMobileOptimization();
  const { profile } = useAuth();

  const getUserName = () => {
    if (profile?.full_name) return profile.full_name.split(' ')[0];
    if (profile?.email) return profile.email.split('@')[0];
    return '';
  };

  const userName = getUserName();
  const today = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-background">
        <header className="border-b bg-primary sticky top-0 z-50 shadow-md" dir="rtl">
          <div className="flex items-center justify-between px-4 h-14">
            <EnhancedTopNavigation onLogout={onLogout} isMobile={true} today={today} />
            <div className="flex items-center gap-2 flex-shrink-0">
              <img src="/images/city-market-icon.png" alt="City Market" className="w-9 h-9 object-contain" />
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          <div className="flex-1 p-4 pb-20">
            {children}
          </div>
        </main>
        <MobileBottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <header className="border-b bg-primary sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between px-6 h-16 max-w-screen-2xl mx-auto gap-4">
          <EnhancedTopNavigation onLogout={onLogout} />
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <h1 className="font-bold text-primary-foreground text-lg leading-tight">City Market</h1>
              <p className="text-primary-foreground/70 text-xs">{today}</p>
            </div>
            <img src="/images/city-market-icon.png" alt="City Market" className="w-12 h-12 object-contain" />
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
