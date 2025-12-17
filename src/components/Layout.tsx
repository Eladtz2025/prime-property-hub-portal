import React from 'react';
import { EnhancedTopNavigation } from './EnhancedTopNavigation';
import { BreadcrumbNav } from './ui/breadcrumb-nav';
import { MobileBottomNavigation } from './MobileBottomNavigation';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}
export const Layout: React.FC<LayoutProps> = ({
  children,
  onLogout
}) => {
  const {
    isMobile
  } = useMobileOptimization();
  if (isMobile) {
    // Mobile layout without sidebar
    return <div className="min-h-screen flex flex-col w-full bg-background">
        <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/images/city-market-icon.png" alt="City Market" className="w-14 h-14 object-contain" />
            <div>
              <h1 className="font-bold text-foreground text-lg leading-tight">
                City Market
              </h1>
              <p className="text-xs text-muted-foreground">ניהול נכסים</p>
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
      </div>;
  }

  // Desktop layout without sidebar
  return <div className="min-h-screen flex flex-col w-full bg-background">
      <header className="h-16 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between px-6 h-full max-w-screen-2xl mx-auto gap-4">
          {/* Logo on the left */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <img src="/images/city-market-icon.png" alt="City Market" className="w-14 h-14 object-contain" />
            <div>
              <h1 className="font-bold text-foreground text-xl leading-tight">
                City Market CRM 
              </h1>
              <p className="text-sm text-muted-foreground">ניהול נכסים</p>
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
    </div>;
};