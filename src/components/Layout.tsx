
import React from 'react';
import { TopNavigation } from './TopNavigation';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { Building2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const { isMobile } = useMobileOptimization();

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <header className={`h-14 border-b bg-card flex items-center justify-between px-4 ${isMobile ? 'sticky top-0 z-10' : ''}`}>
        <div className="flex items-center gap-6">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:scale-105 transition-transform duration-200 flex-shrink-0">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className={`font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap ${isMobile ? 'text-base' : 'text-xl'}`}>
            {isMobile ? 'ניהול נכסים' : 'מערכת ניהול נכסים'}
          </h1>
        </div>
        <TopNavigation onLogout={onLogout} />
      </header>
      <main className="flex-1 flex flex-col">
        <div className={`flex-1 ${isMobile ? 'p-4' : 'p-6'}`}>
          {children}
        </div>
      </main>
    </div>
  );
};
