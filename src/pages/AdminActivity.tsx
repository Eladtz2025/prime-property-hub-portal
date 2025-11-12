import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityLogsList } from '@/components/ActivityLogsList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

export const AdminActivity = () => {
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">פעילות אחרונה</h1>
          <p className="text-muted-foreground mt-1">
            לוג מלא של כל הפעילויות במערכת
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>סינון פעילות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">סוג פעולה</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="כל הפעולות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הפעולות</SelectItem>
                  <SelectItem value="login">כניסה למערכת</SelectItem>
                  <SelectItem value="property_created">נכס נוצר</SelectItem>
                  <SelectItem value="property_updated">נכס עודכן</SelectItem>
                  <SelectItem value="property_deleted">נכס נמחק</SelectItem>
                  <SelectItem value="payment_recorded">תשלום נרשם</SelectItem>
                  <SelectItem value="document_uploaded">מסמך הועלה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">תאריך</label>
              <div className="relative">
                <Input 
                  type="date" 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>רשימת פעילויות</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityLogsList limit={100} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminActivity;
