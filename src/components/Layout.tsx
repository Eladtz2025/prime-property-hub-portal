
import React from 'react';
import { EnhancedTopNavigation } from './EnhancedTopNavigation';
import { BreadcrumbNav } from './ui/breadcrumb-nav';
import { MobileBottomNavigation } from './MobileBottomNavigation';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { Building2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const { isMobile } = useMobileOptimization();

  if (isMobile) {
    // Mobile layout without sidebar
    return (
      <div className="min-h-screen flex flex-col w-full bg-background">
        <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-200 flex-shrink-0 shadow-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-lg leading-tight">
                PrimePropertyAI
              </h1>
              <p className="text-xs text-muted-foreground">ניהול נכסים חכם</p>
            </div>
          </div>
          <EnhancedTopNavigation onLogout={onLogout} isMobile={true} />
        </header>
        <main className="flex-1 flex flex-col">
          <div className="flex-1 p-4 pb-20"> {/* Added bottom padding for mobile nav */}
            <BreadcrumbNav />
            {children}
          </div>
        </main>
        <MobileBottomNavigation />
      </div>
    );
  }

  // Desktop layout without sidebar
  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <header className="h-16 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between px-6 h-full max-w-screen-2xl mx-auto gap-4">
          {/* Logo on the left */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-200 shadow-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-xl leading-tight">
                PrimePropertyAI
              </h1>
              <p className="text-sm text-muted-foreground">ניהול נכסים חכם ומתקדם</p>
            </div>
          </div>
          
          {/* Navigation in the center - pass it as is */}
          <EnhancedTopNavigation onLogout={onLogout} />
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-6">
          <BreadcrumbNav />
          {children}
        </div>
      </main>
    </div>
  );
};
