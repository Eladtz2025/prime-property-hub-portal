
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Building, Bell, Users, FileText, Settings, Search } from 'lucide-react';
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

const navigationItems = [
  { title: "דשבורד", url: "/", icon: Home },
  { title: "כל הנכסים", url: "/properties", icon: Building },
  { title: "התראות", url: "/alerts", icon: Bell },
  { title: "בעלי נכסים", url: "/owners", icon: Users },
  { title: "חיפוש", url: "/search", icon: Search },
  { title: "דוחות", url: "/reports", icon: FileText },
  { title: "הגדרות", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

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
      </SidebarContent>
    </Sidebar>
  );
}
