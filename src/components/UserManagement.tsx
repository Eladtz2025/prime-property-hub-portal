import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Check, X, Settings } from 'lucide-react';
import { logger } from '@/utils/logger';

export const UserManagement: React.FC = () => {
  const { profile, hasPermission } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');

  const canManageUsers = hasPermission('users', 'update');

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles_with_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data || []) as UserProfile[]);
    } catch (error) {
      logger.error('Error fetching users:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת רשימת המשתמשים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .insert([
          {
            email: inviteEmail,
            role: inviteRole,
            invited_by: profile?.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // יצירת קישור הרשמה
      const signupUrl = `${window.location.origin}/login?invite=${data.invitation_token}&email=${encodeURIComponent(inviteEmail)}`;

      toast({
        title: "הזמנה נוצרה",
        description: "קישור ההזמנה הועתק ללוח. שלח אותו למשתמש החדש.",
        action: (
          <Button 
            size="sm" 
            onClick={() => {
              navigator.clipboard.writeText(signupUrl);
              toast({ title: "הקישור הועתק!" });
            }}
          >
            העתק שוב
          </Button>
        ),
      });

      // העתק אוטומטית ללוח
      navigator.clipboard.writeText(signupUrl);

      setInviteEmail('');
      await fetchUsers();
    } catch (error) {
      logger.error('Error creating invitation:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה ביצירת ההזמנה",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "משתמש אושר",
        description: "המשתמש אושר בהצלחה",
      });

      await fetchUsers();
    } catch (error) {
      logger.error('Error approving user:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה באישור המשתמש",
        variant: "destructive"
      });
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "משתמש נדחה",
        description: "המשתמש נדחה והוסר מהמערכת",
      });

      await fetchUsers();
    } catch (error) {
      logger.error('Error rejecting user:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בדחיית המשתמש",
        variant: "destructive"
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      // Delete existing roles for this user
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      toast({
        title: "תפקיד עודכן",
        description: "תפקיד המשתמש עודכן בהצלחה",
      });

      await fetchUsers();
    } catch (error) {
      logger.error('Error updating user role:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון תפקיד המשתמש",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      case 'viewer': return 'outline';
      case 'property_owner': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role?: string) => {
    const labels: Record<string, string> = {
      'super_admin': 'מנהל עליון',
      'admin': 'מנהל',
      'manager': 'מנהל תיקים',
      'viewer': 'צופה',
      'property_owner': 'בעל נכס'
    };
    return labels[role || 'viewer'] || role || 'צופה';
  };

  if (!canManageUsers) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground">אין לך הרשאה לנהל משתמשים</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            הזמן משתמש חדש
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="invite-email">כתובת אימייל</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="invite-role">תפקיד</Label>
              <Select value={inviteRole} onValueChange={(value: UserRole) => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  <SelectItem value="viewer">צופה</SelectItem>
                  <SelectItem value="manager">מנהל תיקים</SelectItem>
                  <SelectItem value="admin">מנהל</SelectItem>
                  {profile?.role === 'super_admin' && (
                    <SelectItem value="super_admin">מנהל עליון</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleInviteUser}
                disabled={loading || !inviteEmail.trim()}
                className="w-full"
              >
                שלח הזמנה
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            ניהול משתמשים
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">אימייל</TableHead>
                  <TableHead className="text-right">שם</TableHead>
                  <TableHead className="text-right">תפקיד</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-right">{user.email}</TableCell>
                    <TableCell className="text-right">{user.full_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={user.is_approved ? 'default' : 'secondary'}>
                        {user.is_approved ? 'מאושר' : 'ממתין לאישור'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {!user.is_approved && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveUser(user.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectUser(user.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {user.is_approved && user.id !== profile?.id && (
                          <Select
                            value={user.role}
                            onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[100]">
                              <SelectItem value="viewer">צופה</SelectItem>
                              <SelectItem value="manager">מנהל תיקים</SelectItem>
                              <SelectItem value="admin">מנהל</SelectItem>
                              {profile?.role === 'super_admin' && (
                                <SelectItem value="super_admin">מנהל עליון</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};