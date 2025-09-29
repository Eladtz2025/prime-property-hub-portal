
import React from 'react';
import { EnhancedTopNavigation } from './EnhancedTopNavigation';
import { AppSidebar } from './AppSidebar';
import { BreadcrumbNav } from './ui/breadcrumb-nav';
import { MobileBottomNavigation } from './MobileBottomNavigation';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { Building2, Menu } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

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
        <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 mobile-header shadow-sm">{/* Added mobile-header class */}
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
          <div className="flex-1 mobile-container mobile-scroll"> {/* Changed padding */}
            <BreadcrumbNav />
            {children}
          </div>
        </main>
        <MobileBottomNavigation />
      </div>
    );
  }

  // Desktop layout with sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-200 flex-shrink-0 shadow-primary">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-foreground text-xl leading-tight">
                  PrimePropertyAI
                </h1>
                <p className="text-sm text-muted-foreground">ניהול נכסים חכם ומתקדם</p>
              </div>
            </div>
            <EnhancedTopNavigation onLogout={onLogout} />
          </header>
          
          <main className="flex-1 flex flex-col">
            <div className="flex-1 p-6">
              <BreadcrumbNav />
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
