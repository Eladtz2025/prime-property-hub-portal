import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCard } from '@/components/AlertCard';
import { Alert } from '@/types/property';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';

export const AdminAlerts = () => {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');

  // TODO: Replace with actual data from Supabase/context
  const mockAlerts: Alert[] = [
    {
      id: '1',
      type: 'payment',
      message: 'תשלום שכר דירה באיחור - 15 ימים',
      priority: 'urgent',
      propertyAddress: 'רח׳ דיזנגוף 100, תל אביב',
      ownerName: 'משה כהן',
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      type: 'maintenance',
      message: 'דרושה תחזוקה דחופה - נזילת מים',
      priority: 'high',
      propertyAddress: 'רח׳ רוטשילד 45, תל אביב',
      ownerName: 'שרה לוי',
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      type: 'lease_expiry',
      message: 'חוזה שכירות יפוג בעוד 30 ימים',
      priority: 'medium',
      propertyAddress: 'רח׳ בן יהודה 23, תל אביב',
      ownerName: 'דוד ישראלי',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: '4',
      type: 'vacancy',
      message: 'נכס פנוי - חסרים מסמכים',
      priority: 'medium',
      propertyAddress: 'רח׳ אלנבי 78, תל אביב',
      ownerName: 'רחל אברהם',
      createdAt: new Date().toISOString()
    }
  ];

  const filteredAlerts = useMemo(() => {
    return mockAlerts.filter(alert => {
      const matchesPriority = priorityFilter === 'all' || alert.priority === priorityFilter;
      const matchesStatus = statusFilter === 'active'; // TODO: Add actual status field
      return matchesPriority && matchesStatus;
    });
  }, [priorityFilter, statusFilter]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">התראות ומעקב</h1>
          <p className="text-muted-foreground mt-1">
            {filteredAlerts.length} התראות פעילות
          </p>
        </div>
      </div>

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
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">אין התראות תואמות</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAlerts;
