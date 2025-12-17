import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCard } from '@/components/AlertCard';
import { Alert } from '@/types/property';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Play, TestTube, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export const AdminAlerts = () => {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real notifications from database
  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          properties:property_id (
            address,
            city,
            owner_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    }
  });

  // Fetch lease expiry alert history
  const { data: alertHistory } = useQuery({
    queryKey: ['lease-expiry-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lease_expiry_alerts')
        .select(`
          *,
          properties:property_id (address, city),
          tenants:tenant_id (name)
        `)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    }
  });

  // Run lease check mutation
  const runLeaseCheck = useMutation({
    mutationFn: async ({ testMode, force }: { testMode: boolean; force: boolean }) => {
      const { data, error } = await supabase.functions.invoke('check-lease-expiry', {
        body: { test_mode: testMode, force }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['lease-expiry-alerts'] });
      
      const modeText = variables.testMode ? '(מצב בדיקה)' : '';
      toast({
        title: `בדיקת חוזים הושלמה ${modeText}`,
        description: `נבדקו ${data.checked} דיירים, נשלחו ${data.alertsSent} התראות${data.whatsappSent ? `, ${data.whatsappSent} הודעות WhatsApp` : ''}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'שגיאה בבדיקת חוזים',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    }
  });

  // Convert notifications to Alert format for display
  const alerts: Alert[] = useMemo(() => {
    if (!notifications) return [];
    
    return notifications.map((notif: any) => ({
      id: notif.id,
      type: notif.type === 'lease_expiry' ? 'lease_expiry' : 
            notif.type === 'payment' ? 'payment' : 
            notif.type === 'maintenance' ? 'maintenance' : 'vacancy',
      message: notif.message,
      priority: notif.priority === 'high' ? 'urgent' : 
               notif.priority === 'medium' ? 'medium' : 'low',
      propertyAddress: notif.properties?.address 
        ? `${notif.properties.address}, ${notif.properties.city || ''}` 
        : '',
      ownerName: notif.properties?.owner_name || '',
      createdAt: notif.created_at,
      isRead: notif.is_read
    }));
  }, [notifications]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesPriority = priorityFilter === 'all' || alert.priority === priorityFilter;
      const matchesStatus = statusFilter === 'active' ? !alert.isRead : alert.isRead;
      return matchesPriority && matchesStatus;
    });
  }, [alerts, priorityFilter, statusFilter]);

  const activeCount = alerts.filter(a => !a.isRead).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">התראות ומעקב</h1>
          <p className="text-muted-foreground mt-1">
            {activeCount} התראות פעילות
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            רענן
          </Button>
        </div>
      </div>

      {/* Lease Check Controls */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            בדיקת סיום חוזים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            המערכת בודקת אוטומטית כל בוקר חוזים שמסתיימים בעוד 60 או 30 יום ושולחת התראות ל-WhatsApp.
            ניתן להריץ בדיקה ידנית כאן.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => runLeaseCheck.mutate({ testMode: true, force: false })}
              disabled={runLeaseCheck.isPending}
              variant="outline"
            >
              <TestTube className="h-4 w-4 ml-2" />
              {runLeaseCheck.isPending ? 'בודק...' : 'בדיקה (ללא שליחה)'}
            </Button>
            <Button
              onClick={() => runLeaseCheck.mutate({ testMode: false, force: false })}
              disabled={runLeaseCheck.isPending}
              className="bg-primary"
            >
              <Play className="h-4 w-4 ml-2" />
              {runLeaseCheck.isPending ? 'שולח...' : 'הרץ ושלח התראות'}
            </Button>
          </div>
          
          {/* Last check results */}
          {alertHistory && alertHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">התראות אחרונות שנשלחו:</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {alertHistory.slice(0, 5).map((alert: any) => (
                  <div key={alert.id} className="flex justify-between">
                    <span>
                      {alert.tenants?.name} - {alert.properties?.address} ({alert.days_before} יום)
                    </span>
                    <span className="text-xs">
                      {new Date(alert.sent_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>סינון התראות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">עדיפות</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="כל העדיפויות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל העדיפויות</SelectItem>
                  <SelectItem value="urgent">דחוף</SelectItem>
                  <SelectItem value="high">גבוהה</SelectItem>
                  <SelectItem value="medium">בינונית</SelectItem>
                  <SelectItem value="low">נמוכה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">סטטוס</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">פעיל</SelectItem>
                  <SelectItem value="handled">טופל</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>רשימת התראות</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">טוען התראות...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">אין התראות תואמות</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div key={alert.id} className="relative">
                  <AlertCard alert={alert} />
                  {!alert.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 left-2"
                      onClick={() => markAsRead.mutate(alert.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 ml-1" />
                      סמן כטופל
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAlerts;
