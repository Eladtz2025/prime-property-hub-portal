import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Building, 
  LogOut, 
  Settings,
  ChevronDown,
  LayoutDashboard,
  Users,
  Wrench,
  FileText,
  ImagePlus,
  Search
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
  { title: "נכסים", url: "/admin-dashboard/properties", icon: Building },
  { title: "לקוחות", url: "/admin-dashboard/customers", icon: Users },
  { title: "טפסים", url: "/admin-dashboard/forms", icon: FileText },
  { title: "סטודיו תמונות", url: "/admin-dashboard/photo-studio", icon: ImagePlus },
  { title: "סקאוט נדל\"ן", url: "/admin-dashboard/property-scout", icon: Search },
  { title: "לוח בקרה", url: "/admin-dashboard", icon: Home },
];

interface EnhancedTopNavigationProps {
  onLogout?: () => void;
  isMobile?: boolean;
}

export const EnhancedTopNavigation: React.FC<EnhancedTopNavigationProps> = ({ 
  onLogout, 
  isMobile = false 
}) => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={cn(
      "flex items-center gap-4",
      isMobile ? "justify-start" : "flex-1 justify-between"
    )}>
      {/* User Menu - now on the left */}
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
          <DropdownMenuContent align="start" className="w-56 bg-popover border shadow-lg">
            <div dir="rtl">
              <DropdownMenuLabel className="text-right">
                <div className="text-sm font-medium">{profile?.full_name || profile?.email}</div>
                <div className="text-xs text-muted-foreground">{profile?.role}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="flex items-center gap-2 cursor-pointer flex-row-reverse justify-end"
                onClick={() => navigate('/owner-portal')}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>פורטל בעלים</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="flex items-center gap-2 cursor-pointer flex-row-reverse justify-end"
                onClick={() => navigate('/admin-dashboard/devops')}
              >
                <Wrench className="h-4 w-4" />
                <span>QA & DevOps</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="flex items-center gap-2 cursor-pointer flex-row-reverse justify-end"
                onClick={() => navigate('/admin-dashboard/settings')}
              >
                <Settings className="h-4 w-4" />
                <span>הגדרות</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onLogout && (
                <DropdownMenuItem 
                  className="flex items-center gap-2 cursor-pointer text-destructive hover:text-destructive flex-row-reverse justify-end"
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>יציאה</span>
                </DropdownMenuItem>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Navigation in the center */}
      {!isMobile && (
        <div className="flex-1 flex justify-center">
          <nav className="flex items-center gap-2 flex-row-reverse" dir="rtl">
            {navigationItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === '/' || item.url === '/admin-dashboard'}
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
    </div>
  );
};