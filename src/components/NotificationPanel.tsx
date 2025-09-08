import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import type { Notification } from '@/types/owner-portal';
import { markNotificationAsRead } from '@/lib/owner-portal';
import { logger } from '@/utils/logger';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ 
  notifications, 
  onMarkAsRead 
}) => {
  const getNotificationIcon = (type: string, priority: string) => {
    if (priority === 'urgent') return <AlertTriangle className="h-5 w-5 text-red-500" />;
    
    switch (type) {
      case 'lease_expiry': return <Clock className="h-5 w-5 text-orange-500" />;
      case 'rent_due': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'maintenance': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'document_upload': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'דחוף';
      case 'high': return 'גבוה';
      case 'medium': return 'בינוני';
      default: return 'נמוך';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'אתמול';
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    return date.toLocaleDateString('he-IL');
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      onMarkAsRead(notificationId);
    } catch (error) {
      logger.error('Error marking notification as read:', error, 'NotificationPanel');
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">התראות</h2>
        <Badge variant="outline">
          {unreadNotifications.length} התראות חדשות
        </Badge>
      </div>

      {/* Unread Notifications */}
      {unreadNotifications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            התראות חדשות
          </h3>
          
          {unreadNotifications.map((notification) => (
            <Card key={notification.id} className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type, notification.priority)}
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold">{notification.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(notification.priority)}>
                          {getPriorityText(notification.priority)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        סמן כנקרא
                      </Button>
                      
                      {notification.action_url && (
                        <Button size="sm" variant="outline">
                          פעולה נדרשת
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Read Notifications */}
      {readNotifications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground">
            התראות שנקראו
          </h3>
          
          {readNotifications.slice(0, 10).map((notification) => (
            <Card key={notification.id} className="opacity-75">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type, notification.priority)}
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {readNotifications.length > 10 && (
            <div className="text-center">
              <Button variant="outline" size="sm">
                טען עוד התראות
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {notifications.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">אין התראות</h3>
            <p className="text-muted-foreground">
              כל ההתראות יופיעו כאן
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};