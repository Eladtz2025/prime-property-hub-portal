import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Building, 
  Users, 
  DollarSign, 
  Bell,
  Settings,
  MessageSquare,
  Wrench,
  FileText
} from 'lucide-react';

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  notifications?: number;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onTabChange,
  notifications = 0
}) => {
  const navItems = [
    { id: 'overview', label: 'סקירה', icon: Home },
    { id: 'properties', label: 'נכסים', icon: Building },
    { id: 'tenants', label: 'דיירים', icon: Users },
    { id: 'finances', label: 'כספים', icon: DollarSign },
    { id: 'maintenance', label: 'תחזוקה', icon: Wrench },
    { id: 'messages', label: 'הודעות', icon: MessageSquare },
    { id: 'reports', label: 'דוחות', icon: FileText },
    { id: 'notifications', label: 'התראות', icon: Bell, badge: notifications }
  ];

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 rounded-t-lg rounded-b-none border-t bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-around p-2">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                isActive ? 'text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 w-4 h-4 p-0 text-xs flex items-center justify-center"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
      
      {/* Second Row for additional items */}
      <div className="flex items-center justify-around p-2 border-t">
        {navItems.slice(4).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                isActive ? 'text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 w-4 h-4 p-0 text-xs flex items-center justify-center"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </Card>
  );
};