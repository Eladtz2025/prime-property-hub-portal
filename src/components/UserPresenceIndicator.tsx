import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealtimePresence } from '@/hooks/useRealtimePresence';
import { Users, Circle } from 'lucide-react';

export const UserPresenceIndicator: React.FC = () => {
  const { presenceData, onlineUsers } = useRealtimePresence();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'מחובר';
      case 'away': return 'לא פעיל';
      default: return 'לא מחובר';
    }
  };

  if (presenceData.length === 0) return null;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <CardTitle className="text-sm">משתמשים מחוברים</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {onlineUsers}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {onlineUsers} מתוך {presenceData.length} משתמשים פעילים
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {presenceData.slice(0, 5).map((user) => (
          <div key={user.userId} className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {user.userName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <Circle
                className={`absolute -bottom-1 -right-1 h-3 w-3 border-2 border-background rounded-full ${getStatusColor(user.status)}`}
                fill="currentColor"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.userName}
              </p>
              <p className="text-xs text-muted-foreground">
                {getStatusText(user.status)}
                {user.currentPage && user.currentPage !== '/' && (
                  <span className="ml-1">• {user.currentPage}</span>
                )}
              </p>
            </div>
          </div>
        ))}
        {presenceData.length > 5 && (
          <p className="text-xs text-muted-foreground text-center">
            ועוד {presenceData.length - 5} משתמשים...
          </p>
        )}
      </CardContent>
    </Card>
  );
};