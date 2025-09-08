import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Building, 
  AlertTriangle, 
  MessageSquare, 
  BarChart3, 
  Phone, 
  LogOut, 
  Users,
  Settings,
  ChevronDown
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
  { title: "צור קשר", url: "/contact-queue", icon: Phone },
  { title: "התראות", url: "/alerts", icon: AlertTriangle },
  { title: "הודעות", url: "/messages", icon: MessageSquare },
  { title: "דוחות", url: "/reports", icon: BarChart3 },
  { title: "משתמשים", url: "/users", icon: Users },
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
    if (item.url === '/users') {
      return hasPermission('users', 'read') || profile?.role === 'admin' || profile?.role === 'super_admin';
    }
    return true;
  });

  if (isMobile) {
    return (
      <div className="flex items-center gap-2">
        <UserAvatar size="sm" />
        {onLogout && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-1 rtl:space-x-reverse">
        {filteredNavItems.map((item) => (
          <NavLink 
            key={item.title}
            to={item.url}
            className={({ isActive }) => cn(
              "flex items-center px-3 py-2 rounded-md transition-all duration-200",
              isActive 
                ? "bg-primary text-primary-foreground shadow-primary" 
                : "text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="mr-2 rtl:ml-2 rtl:mr-0 font-medium">{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Menu */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 hover:bg-accent rounded-lg p-2"
            >
              <UserAvatar size="sm" />
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
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