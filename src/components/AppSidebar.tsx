import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Building, 
  Users, 
  Briefcase
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';

// Main navigation items (public pages)
const navigationItems = [
  { title: 'דף הבית', url: '/', icon: Home },
];

// Admin navigation items
const adminItems = [
  { title: 'לוח בקרה', url: '/admin-dashboard', icon: Briefcase, requiredRole: 'admin' },
  { title: 'נכסים', url: '/admin-dashboard/properties', icon: Building },
];

// Property owner navigation items
const ownerItems = [
  { title: 'הפורטל שלי', url: '/owner-portal', icon: Briefcase, requiredRole: 'property_owner' },
];

export function AppSidebar() {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const { permissions, profile } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50';

  // Check if user is a property owner or admin
  const isPropertyOwner = profile?.role === 'property_owner' || profile?.role === 'super_admin' || profile?.role === 'admin';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'manager';

  return (
    <Sidebar
      className="bg-gradient-to-b from-background to-muted/30 border-r border-border/50 shadow-lg backdrop-blur-sm"
      collapsible="none"
    >
      <SidebarContent className="relative">

        {/* Main Navigation */}
        <div className="p-4 space-y-2">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-lg uppercase tracking-wider mb-3">
              ניווט ראשי
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={({ isActive }) => 
                          `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                            isActive 
                              ? 'bg-primary/10 text-primary shadow-sm font-medium' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-primary/5 hover:shadow-sm'
                          }`
                        }
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium truncate">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="px-4 pb-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-3 py-2 mb-3">
                ניהול
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          className={({ isActive }) => 
                            `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                              isActive 
                                ? 'bg-primary/10 text-primary shadow-sm font-medium' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-primary/5 hover:shadow-sm'
                            }`
                          }
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <span className="font-medium truncate">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      )}

        {/* Property Owner Section */}
        {isPropertyOwner && (
          <div className="px-4 pb-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-3 py-2 mb-3">
                בעל נכס
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {ownerItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          className={({ isActive }) => 
                            `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                              isActive 
                                ? 'bg-primary/10 text-primary shadow-sm font-medium' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-primary/5 hover:shadow-sm'
                            }`
                          }
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <span className="font-medium truncate">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      )}

        {/* Decorative Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-muted/20 to-transparent pointer-events-none"></div>
      </SidebarContent>
    </Sidebar>
  );
}