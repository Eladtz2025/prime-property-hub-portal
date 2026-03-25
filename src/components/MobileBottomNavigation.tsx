import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Building, 
  Users,
  Search,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

const mainNavItems = [
  { title: "לוח בקרה", url: "/admin-dashboard", icon: Home },
  { title: "נכסים", url: "/admin-dashboard/properties", icon: Building },
  { title: "פרסום", url: "/admin-dashboard/marketing", icon: Megaphone },
  { title: "לקוחות", url: "/admin-dashboard/customers", icon: Users },
  { title: "סקאוט", url: "/admin-dashboard/property-scout", icon: Search, minRole: 'manager' as UserRole },
];

const roleLevel = (role?: string): number => {
  const levels: Record<string, number> = { property_owner: 0, viewer: 1, manager: 2, admin: 3, super_admin: 4 };
  return levels[role ?? ''] ?? 0;
};

interface MobileBottomNavigationProps {
  notificationCount?: number;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({ 
  notificationCount = 0 
}) => {
  const location = useLocation();
  const { profile } = useAuth();
  const userLevel = roleLevel(profile?.role);

  const filteredItems = mainNavItems.filter(item => {
    if (item.minRole) {
      return userLevel >= roleLevel(item.minRole);
    }
    return true;
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-card/95 backdrop-blur-sm border-t border-border shadow-lg">
        <div className="flex items-center justify-around px-2 py-2 safe-area-padding-bottom" dir="rtl">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.url;
            
            return (
              <NavLink
                key={item.title}
                to={item.url}
                className={cn(
                  "flex flex-col items-center justify-center min-h-[44px] px-3 py-2 rounded-lg transition-all duration-200 relative touch-target",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
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
