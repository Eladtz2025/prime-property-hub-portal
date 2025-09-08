import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Building, AlertTriangle, MessageSquare, BarChart3, Phone, Users, UserPlus, Monitor } from 'lucide-react';
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
} from "@/components/ui/sidebar";
import { useAuth } from '@/contexts/AuthContext';

const navigationItems = [
  { title: "דשבורד", url: "/", icon: Home },
  { title: "נכסים", url: "/properties", icon: Building },
  { title: "תור קשר", url: "/contact-queue", icon: Phone },
  { title: "התראות", url: "/alerts", icon: AlertTriangle },
  { title: "הודעות", url: "/messages", icon: MessageSquare },
  { title: "דוחות", url: "/reports", icon: BarChart3 },
];

const adminItems = [
  { title: "ניהול משתמשים", url: "/users", icon: Users, requiredRole: "admin" },
  { title: "הזמנות בעלי נכסים", url: "/property-invitations", icon: UserPlus, requiredRole: "admin" },
  { title: "מרכז בקרה", url: "/admin-control", icon: Monitor, requiredRole: "admin" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { hasPermission, profile } = useAuth();
  const isCollapsed = state === "collapsed";

  const canAccessAdmin = hasPermission('users', 'read') || profile?.role === 'admin' || profile?.role === 'super_admin';

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ניהול נכסים</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => 
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {canAccessAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>ניהול מערכת</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) => 
                          `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                            isActive 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
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