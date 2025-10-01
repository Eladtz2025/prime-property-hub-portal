import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Building, 
  Phone, 
  LogOut, 
  Users,
  Settings,
  ChevronDown,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from './UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigationItems = [
  { title: "לוח בקרה", url: "/", icon: Home },
  { title: "נכסים", url: "/properties", icon: Building },
  { title: "ניהול משתמשים", url: "/users", icon: Users, adminOnly: true },
  { title: "הזמנות", url: "/property-invitations", icon: UserPlus, adminOnly: true },
];

interface EnhancedTopNavigationProps {
  onLogout?: () => void;
  isMobile?: boolean;
}

export const EnhancedTopNavigation: React.FC<EnhancedTopNavigationProps> = ({ 
  onLogout, 
  isMobile = false 
}) => {
  const { hasPermission, profile } = useAuth();

  const filteredNavItems = navigationItems.filter(item => {
    if (item.adminOnly) {
      return hasPermission('users', 'read') || profile?.role === 'admin' || profile?.role === 'super_admin';
    }
    return true;
  });

  return (
    <div className="flex items-center justify-between gap-4 flex-1">
      {/* Desktop Navigation in the center */}
      {!isMobile && (
        <div className="flex-1 flex justify-center">
          <nav className="flex items-center gap-2">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === '/'}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      {/* User Menu on the right */}
      <div className="flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 hover:bg-accent rounded-lg p-2"
            >
              <UserAvatar size="sm" />
              {!isMobile && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover border shadow-lg">
            <DropdownMenuLabel className="text-right">
              <div className="text-sm font-medium">{profile?.full_name || profile?.email}</div>
              <div className="text-xs text-muted-foreground">{profile?.role}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
              <Settings className="h-4 w-4" />
              <span>הגדרות</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onLogout && (
              <DropdownMenuItem 
                className="flex items-center gap-2 cursor-pointer text-destructive hover:text-destructive"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>יציאה</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};