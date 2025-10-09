
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Building, AlertTriangle, MessageSquare, BarChart3, Phone, LogOut, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from './UserAvatar';

const navigationItems = [
  { title: "דף הבית", url: "/", icon: Home },
  { title: "לוח בקרה", url: "/admin-dashboard", icon: BarChart3, requireAdmin: true },
  { title: "נכסים", url: "/properties", icon: Building },
  { title: "צור קשר", url: "/contact-queue", icon: Phone },
  { title: "התראות", url: "/alerts", icon: AlertTriangle },
  { title: "הודעות", url: "/messages", icon: MessageSquare },
  { title: "משתמשים", url: "/users", icon: Users },
];

interface TopNavigationProps {
  onLogout?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ onLogout }) => {
  const { isMobile } = useMobileOptimization();
  const { hasPermission, profile } = useAuth();

  const filteredNavItems = navigationItems.filter(item => {
    if (item.url === '/users') {
      return hasPermission('users', 'read') || profile?.role === 'admin' || profile?.role === 'super_admin';
    }
    if ('requireAdmin' in item && item.requireAdmin) {
      return profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'manager';
    }
    return true;
  });

  return (
    <div className="flex items-center gap-2">
      <nav className={cn(
        "flex items-center rtl:space-x-reverse",
        isMobile ? "gap-0.5" : "space-x-1 space-x-reverse"
      )}>
        {filteredNavItems.map((item) => (
          <NavLink 
            key={item.title}
            to={item.url}
            className={({ isActive }) => cn(
              "flex items-center rounded-md transition-colors",
              isMobile ? "px-2 py-1.5" : "px-3 py-2",
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className={cn(
              isMobile ? "h-3.5 w-3.5" : "h-4 w-4"
            )} />
            {!isMobile && (
              <span className="mr-2 rtl:ml-2 rtl:mr-0">{item.title}</span>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="flex items-center gap-2">
        {!isMobile && <UserAvatar size="default" />}
        
        {onLogout && (
          <Button
            variant="ghost"
            size={isMobile ? "sm" : "default"}
            onClick={onLogout}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className={cn(
              isMobile ? "h-3.5 w-3.5" : "h-4 w-4"
            )} />
            {!isMobile && (
              <span className="mr-2 rtl:ml-2 rtl:mr-0">יציאה</span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
