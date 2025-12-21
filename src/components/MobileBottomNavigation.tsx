import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Building, 
  Users,
  MessageSquare,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

// Main navigation items - core features accessible from bottom nav
const navigationItems = [
  { title: "לוח בקרה", url: "/admin-dashboard", icon: Home },
  { title: "נכסים", url: "/admin-dashboard/properties", icon: Building },
  { title: "לקוחות", url: "/admin-dashboard/customers", icon: Users },
  { title: "פניות", url: "/admin-dashboard/leads", icon: MessageSquare },
  { title: "טפסים", url: "/admin-dashboard/forms", icon: FileText },
];

interface MobileBottomNavigationProps {
  notificationCount?: number;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({ 
  notificationCount = 0 
}) => {
  const location = useLocation();

  // All nav items are now in the main array
  const allNavItems = navigationItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-card/95 backdrop-blur-sm border-t border-border shadow-lg">
        <div className="flex items-center justify-around px-2 py-2 safe-area-padding-bottom" dir="rtl">
          {allNavItems.map((item) => {
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