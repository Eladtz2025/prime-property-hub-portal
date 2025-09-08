import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Building, 
  MessageSquare, 
  AlertTriangle, 
  Mail, 
  FileText, 
  Database, 
  Users, 
  UserPlus, 
  Settings,
  Building2
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

// Main navigation items
const navigationItems = [
  { title: 'לוח בקרה', url: '/', icon: Home },
  { title: 'נכסים', url: '/properties', icon: Building },
  { title: 'תור יצירת קשר', url: '/contact-queue', icon: MessageSquare },
  { title: 'התראות', url: '/alerts', icon: AlertTriangle },
  { title: 'הודעות', url: '/messages', icon: Mail },
  { title: 'דוחות', url: '/reports', icon: FileText },
];

// Admin-specific navigation items
const adminItems = [
  { title: 'העברת נתונים', url: '/data-migration', icon: Database, requiredRole: 'admin' },
  { title: 'ניהול משתמשים', url: '/users', icon: Users, requiredRole: 'admin' },
  { title: 'הזמנות נכסים', url: '/property-invitations', icon: UserPlus, requiredRole: 'admin' },
  { title: 'מרכז בקרה', url: '/admin-control', icon: Settings, requiredRole: 'admin' },
];

export function AppSidebar() {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const { permissions, profile } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50';

  // Check if user has admin permissions
  const hasAdminAccess = profile?.role === 'admin' || profile?.role === 'super_admin' || 
    permissions.some(p => p.resource === 'users' && (p.action === 'create' || p.action === 'update'));

  return (
    <Sidebar
      className={`${collapsed ? 'w-14' : 'w-60'} bg-gradient-to-b from-background to-muted/30 border-r border-border/50 shadow-lg backdrop-blur-sm`}
      collapsible="default"
    >
      <SidebarContent className="relative">
        {/* Enhanced Brand Section */}
        <div className={`relative p-6 bg-gradient-primary ${collapsed ? 'px-3' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary backdrop-blur-sm"></div>
          <div className={`relative flex items-center gap-4 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg backdrop-blur-sm border border-white/30">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            {!collapsed && (
              <div className="text-white">
                <h1 className="font-bold text-xl leading-tight tracking-tight">PrimePropertyAI</h1>
                <p className="text-xs text-white/80 font-medium">ניהול נכסים חכם</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <div className="p-4 space-y-2">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-2 mb-3">
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
                              ? 'bg-gradient-primary text-white shadow-lg shadow-primary/25 font-medium scale-[1.02]' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-accent/30 hover:shadow-md hover:scale-[1.01]'
                          }`
                        }
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && (
                          <span className="font-medium truncate">{item.title}</span>
                        )}
                        {!collapsed && (
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Admin Section */}
        {hasAdminAccess && (
          <div className="px-4 pb-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-2 mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-warning rounded-full"></div>
                אדמין
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
                                ? 'bg-gradient-warning text-white shadow-lg shadow-orange-500/25 font-medium scale-[1.02]' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-yellow-500/10 hover:shadow-md hover:scale-[1.01]'
                            }`
                          }
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {!collapsed && (
                            <span className="font-medium truncate">{item.title}</span>
                          )}
                          {!collapsed && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                          )}
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