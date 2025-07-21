
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Building, AlertTriangle, MessageSquare, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

const navigationItems = [
  { title: "דשבורד", url: "/", icon: Home },
  { title: "נכסים", url: "/properties", icon: Building },
  { title: "התראות", url: "/alerts", icon: AlertTriangle },
  { title: "הודעות", url: "/messages", icon: MessageSquare },
  { title: "דוחות", url: "/reports", icon: BarChart3 },
];

export const TopNavigation: React.FC = () => {
  const { isMobile } = useMobileOptimization();

  return (
    <nav className="flex items-center space-x-1 space-x-reverse rtl:space-x-reverse">
      {navigationItems.map((item) => (
        <NavLink 
          key={item.title}
          to={item.url}
          className={({ isActive }) => cn(
            "flex items-center px-3 py-2 rounded-md transition-colors",
            isActive 
              ? "bg-primary text-primary-foreground" 
              : "text-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          {!isMobile && (
            <span className="mr-2 rtl:ml-2 rtl:mr-0">{item.title}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );
};
