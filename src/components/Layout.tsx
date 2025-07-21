
import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isMobile } = useMobileOptimization();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className={`h-14 border-b bg-card flex items-center px-4 ${isMobile ? 'sticky top-0 z-10' : ''}`}>
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">PM</span>
              </div>
              <h1 className={`font-bold text-foreground ${isMobile ? 'text-lg' : 'text-xl'}`}>
                מערכת ניהול נכסים
              </h1>
            </div>
          </header>
          <div className={`flex-1 ${isMobile ? 'p-4' : 'p-6'}`}>
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
