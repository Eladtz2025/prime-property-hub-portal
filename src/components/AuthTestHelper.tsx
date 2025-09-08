import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export const AuthTestHelper: React.FC = () => {
  const { profile, permissions } = useAuth();

  if (!profile) return null;

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="text-lg text-blue-700 dark:text-blue-300">מידע משתמש נוכחי</CardTitle>
        <CardDescription>מידע לבדיקת המערכת</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">אימייל:</p>
            <p className="text-sm">{profile.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">תפקיד:</p>
            <Badge variant={
              profile.role === 'super_admin' ? 'destructive' :
              profile.role === 'admin' ? 'default' :
              profile.role === 'property_owner' ? 'secondary' :
              'outline'
            }>
              {profile.role === 'super_admin' && 'מנהל על'}
              {profile.role === 'admin' && 'מנהל'}
              {profile.role === 'manager' && 'מנהל נכסים'}
              {profile.role === 'property_owner' && 'בעל נכס'}
              {profile.role === 'viewer' && 'צופה'}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">סטטוס:</p>
            <Badge variant={profile.is_approved ? 'default' : 'secondary'}>
              {profile.is_approved ? 'מאושר' : 'ממתין לאישור'}
            </Badge>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">הרשאות זמינות:</p>
          <div className="flex flex-wrap gap-1">
            {permissions.length > 0 ? permissions.map((permission, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {permission.resource}:{permission.action}
              </Badge>
            )) : (
              <span className="text-xs text-muted-foreground">אין הרשאות זמינות</span>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-md">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">הוראות בדיקה:</p>
          <ul className="text-xs text-blue-600 dark:text-blue-400 mt-1 space-y-1">
            <li>• <strong>מנהל על:</strong> eladtz@gmail.com (גישה לכל הפונקציות)</li>
            <li>• <strong>משתמש חדש:</strong> הירשם עם אימייל חדש (יקבל תפקיד "צופה" כברירת מחדל)</li>
            <li>• <strong>בעל נכס:</strong> השתמש בלינק הזמנה מהמנהל או שנה תפקיד למשתמש קיים</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};