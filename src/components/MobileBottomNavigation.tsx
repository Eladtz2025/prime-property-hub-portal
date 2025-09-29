import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Building, 
  AlertTriangle, 
  MessageSquare, 
  BarChart3, 
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const navigationItems = [
  { title: "בית", url: "/", icon: Home },
  { title: "נכסים", url: "/properties", icon: Building },
  { title: "ווטסאפ", url: "/whatsapp", icon: MessageSquare },
  { title: "התראות", url: "/alerts", icon: AlertTriangle },
];

interface MobileBottomNavigationProps {
  notificationCount?: number;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({ 
  notificationCount = 0 
}) => {
  const location = useLocation();
  const { hasPermission, profile } = useAuth();

  const filteredNavItems = navigationItems.filter(item => {
    if (item.url === '/users') {
      return hasPermission('users', 'read') || profile?.role === 'admin' || profile?.role === 'super_admin';
    }
    return true;
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-card/95 backdrop-blur-sm border-t border-border shadow-lg">
        <div className="flex items-center justify-around px-1 py-1.5 safe-area-padding-bottom">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.url;
            const showBadge = item.url === '/alerts' && notificationCount > 0;
            
            return (
              <NavLink
                key={item.title}
                to={item.url}
                aria-label={`עבור ל${item.title}`}
                className={cn(
                  "flex flex-col items-center justify-center min-h-[40px] px-2 py-1.5 rounded-lg transition-all duration-200 relative",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  {showBadge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center min-w-[16px]"
                    >
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium mt-1 transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.title}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};