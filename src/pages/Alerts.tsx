import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell, Clock, CheckCircle } from 'lucide-react';
import { Alert, Property } from '../types/property';
import { AlertCard } from '../components/AlertCard';
import { PullToRefresh } from '../components/PullToRefresh';
import { usePropertyData } from '@/hooks/usePropertyData';

export const Alerts: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'urgent' | 'high' | 'medium'>('all');
  const { properties, isLoading, refetch } = usePropertyData();
  
  // Generate alerts from properties data
  const alerts = useMemo(() => {
    const alertsList: Alert[] = [];
    const now = new Date();
    
    properties.forEach(property => {
      if (property.leaseEndDate) {
        const endDate = new Date(property.leaseEndDate);
        const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        
        if (daysUntilEnd <= 60 && daysUntilEnd > 0) {
          let priority: 'urgent' | 'high' | 'medium' = 'medium';
          let message = '';
          
          if (daysUntilEnd <= 14) {
            priority = 'urgent';
            message = `חוזה מסתיים בעוד ${daysUntilEnd} ימים - דרושה פעולה מיידית!`;
          } else if (daysUntilEnd <= 30) {
            priority = 'high';
            message = `חוזה מסתיים בעוד ${daysUntilEnd} ימים - יש להתחיל תיאום חידוש`;
          } else {
            priority = 'medium';
            message = `חוזה מסתיים בעוד ${daysUntilEnd} ימים - תכנון מוקדם לחידוש`;
          }
          
          alertsList.push({
            id: `lease-${property.id}`,
            type: 'lease_expiry',
            priority,
            message,
            propertyAddress: property.address,
            ownerName: property.ownerName,
            tenantName: property.tenantName,
            dueDate: property.leaseEndDate,
            createdAt: now.toISOString()
          });
        }
      }
      
      // Check for vacant properties
      if (property.status === 'vacant') {
        alertsList.push({
          id: `vacant-${property.id}`,
          type: 'vacancy',
          priority: 'high',
          message: 'נכס פנוי - דרושה השכרה',
          propertyAddress: property.address,
          ownerName: property.ownerName,
          createdAt: now.toISOString()
        });
      }
      
      // Check for maintenance
      if (property.status === 'maintenance') {
        alertsList.push({
          id: `maintenance-${property.id}`,
          type: 'maintenance',
          priority: 'medium',
          message: 'נכס בתחזוקה - בדיקת התקדמות',
          propertyAddress: property.address,
          ownerName: property.ownerName,
          tenantName: property.tenantName,
          createdAt: now.toISOString()
        });
      }
    });
    
    return alertsList.sort((a, b) => {
      const priorityOrder = { urgent: 3, high: 2, medium: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [properties]);

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(alert => alert.priority === filter);

  const alertCounts = {
    urgent: alerts.filter(a => a.priority === 'urgent').length,
    high: alerts.filter(a => a.priority === 'high').length,
    medium: alerts.filter(a => a.priority === 'medium').length,
    total: alerts.length
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-foreground">התראות ומעקב</h2>
        <div className="text-center py-8">טוען נתונים...</div>
      </div>
    );
  }

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-foreground">התראות ומעקב</h2>
          <div className="text-sm text-muted-foreground">
            {filteredAlerts.length} התראות פעילות
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">דחופות</p>
                  <p className="text-2xl font-bold text-red-700">{alertCounts.urgent}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">עדיפות גבוהה</p>
                  <p className="text-2xl font-bold text-orange-700">{alertCounts.high}</p>
                </div>
                <Bell className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">עדיפות בינונית</p>
                  <p className="text-2xl font-bold text-yellow-700">{alertCounts.medium}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">סה״כ התראות</p>
                  <p className="text-2xl font-bold text-blue-700">{alertCounts.total}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>סינון התראות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                הכל ({alertCounts.total})
              </Button>
              <Button
                variant={filter === 'urgent' ? 'default' : 'outline'}
                onClick={() => setFilter('urgent')}
                className={filter === 'urgent' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                דחופות ({alertCounts.urgent})
              </Button>
              <Button
                variant={filter === 'high' ? 'default' : 'outline'}
                onClick={() => setFilter('high')}
                className={filter === 'high' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                עדיפות גבוהה ({alertCounts.high})
              </Button>
              <Button
                variant={filter === 'medium' ? 'default' : 'outline'}
                onClick={() => setFilter('medium')}
                className={filter === 'medium' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              >
                עדיפות בינונית ({alertCounts.medium})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">אין התראות בקטגוריה זו</h3>
                <p className="text-muted-foreground">כל הנכסים תקינים בקטגוריה שנבחרה.</p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          )}
        </div>
      </div>
    </PullToRefresh>
  );
};