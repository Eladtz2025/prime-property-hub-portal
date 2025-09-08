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
      className={collapsed ? 'w-14' : 'w-60'}
      collapsible="default"
    >
      <SidebarContent>
        {/* Brand */}
        <div className={`flex items-center gap-3 p-4 border-b ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-foreground">PrimePropertyAI</span>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>ניווט ראשי</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {hasAdminAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>אדמין</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}