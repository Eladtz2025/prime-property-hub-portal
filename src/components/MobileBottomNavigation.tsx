import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Building, 
  Users,
  MessageSquare,
  MoreVertical,
  ImagePlus,
  Search,
  FileText,
  Settings,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// Main navigation items - core features in bottom nav
const mainNavItems = [
  { title: "לוח בקרה", url: "/admin-dashboard", icon: Home },
  { title: "נכסים", url: "/admin-dashboard/properties", icon: Building },
  { title: "לקוחות", url: "/admin-dashboard/customers", icon: Users },
  { title: "פניות", url: "/admin-dashboard/leads", icon: MessageSquare },
];

// Additional items in "More" menu
const moreNavItems = [
  { title: "סטודיו תמונות", url: "/admin-dashboard/photo-studio", icon: ImagePlus },
  { title: "סקאוט נדל\"ן", url: "/admin-dashboard/property-scout", icon: Search },
  
  { title: "הגדרות", url: "/admin-dashboard/settings", icon: Settings },
];

interface MobileBottomNavigationProps {
  notificationCount?: number;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({ 
  notificationCount = 0 
}) => {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Check if current route is in the "more" menu
  const isMoreActive = moreNavItems.some(item => location.pathname === item.url);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-card/95 backdrop-blur-sm border-t border-border shadow-lg">
        <div className="flex items-center justify-around px-2 py-2 safe-area-padding-bottom" dir="rtl">
          {mainNavItems.map((item) => {
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

          {/* More Menu Button */}
          <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center min-h-[44px] px-3 py-2 rounded-lg transition-all duration-200 relative touch-target",
                  isMoreActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <MoreVertical className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isMoreActive && "scale-110"
                )} />
                <span className={cn(
                  "text-xs font-medium mt-1 transition-colors duration-200",
                  isMoreActive ? "text-primary" : "text-muted-foreground"
                )}>
                  עוד
                </span>
                {isMoreActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[50vh] rounded-t-2xl">
              <SheetHeader className="text-right pb-4">
                <SheetTitle>תפריט נוסף</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-3 pb-6" dir="rtl">
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.url;
                  
                  return (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      onClick={() => setIsMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl transition-all duration-200",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted/50 hover:bg-muted text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium text-sm">{item.title}</span>
                    </NavLink>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};
