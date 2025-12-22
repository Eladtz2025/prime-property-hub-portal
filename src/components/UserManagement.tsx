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
import { UserPlus, Check, X, Settings, Pencil, Award, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/utils/logger';

export const UserManagement: React.FC = () => {
  const { profile, hasPermission } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    role: 'viewer' as UserRole,
    is_approved: false,
    broker_license_number: '',
    id_number: '',
    address: ''
  });

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

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      role: (user.role || 'viewer') as UserRole,
      is_approved: user.is_approved,
      broker_license_number: user.broker_license_number || '',
      id_number: user.id_number || '',
      address: user.address || ''
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      // עדכון טבלת profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          is_approved: editForm.is_approved,
          broker_license_number: editForm.broker_license_number,
          id_number: editForm.id_number,
          address: editForm.address
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // עדכון תפקיד אם השתנה
      if (editForm.role !== editingUser.role) {
        await handleRoleChange(editingUser.id, editForm.role);
      }

      toast({
        title: "המשתמש עודכן בהצלחה",
        description: "השינויים נשמרו במערכת"
      });

      setEditingUser(null);
      await fetchUsers();
    } catch (error) {
      logger.error('Error updating user:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון המשתמש",
        variant: "destructive"
      });
    }
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
                <SelectContent>
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
                  <TableHead>אימייל</TableHead>
                  <TableHead>שם</TableHead>
                  <TableHead>טלפון</TableHead>
                  <TableHead>תפקיד</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <Collapsible
                    key={user.id}
                    open={editingUser?.id === user.id}
                    onOpenChange={(open) => {
                      if (open) {
                        handleEditUser(user);
                      } else {
                        setEditingUser(null);
                      }
                    }}
                  >
                    <TableRow className={editingUser?.id === user.id ? 'bg-muted/30' : ''}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.full_name || '-'}</TableCell>
                      <TableCell>
                        <span className="text-sm">{user.phone || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_approved ? 'default' : 'secondary'}>
                          {user.is_approved ? 'מאושר' : 'ממתין לאישור'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={editingUser?.id === user.id ? 'default' : 'outline'}
                            onClick={() => {
                              if (editingUser?.id === user.id) {
                                setEditingUser(null);
                              } else {
                                handleEditUser(user);
                              }
                            }}
                          >
                            {editingUser?.id === user.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <Pencil className="h-4 w-4" />
                            )}
                          </Button>
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
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    <CollapsibleContent asChild>
                      <TableRow className="bg-muted/20 hover:bg-muted/30">
                        <TableCell colSpan={6} className="p-0">
                          <div className="p-4 space-y-4">
                            {/* Personal Details */}
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <User className="h-4 w-4" />
                                פרטים אישיים
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">שם מלא</Label>
                                  <Input
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                    placeholder="שם מלא"
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">טלפון</Label>
                                  <Input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    placeholder="054-1234567"
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">ת.ז.</Label>
                                  <Input
                                    value={editForm.id_number}
                                    onChange={(e) => setEditForm({ ...editForm, id_number: e.target.value })}
                                    placeholder="מספר ת.ז."
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">כתובת</Label>
                                  <Input
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    placeholder="כתובת"
                                    className="h-8"
                                  />
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {/* Broker Details & System Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                  <Award className="h-4 w-4" />
                                  פרטי מתווך
                                </h4>
                                <div className="space-y-1">
                                  <Label className="text-xs">מספר רישיון תיווך</Label>
                                  <Input
                                    value={editForm.broker_license_number}
                                    onChange={(e) => setEditForm({ ...editForm, broker_license_number: e.target.value })}
                                    placeholder="מספר רישיון"
                                    className="h-8"
                                  />
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                  <Settings className="h-4 w-4" />
                                  הגדרות מערכת
                                </h4>
                                <div className="flex flex-col sm:flex-row gap-3">
                                  <div className="flex-1 space-y-1">
                                    <Label className="text-xs">תפקיד</Label>
                                    <Select
                                      value={editForm.role}
                                      onValueChange={(value: UserRole) => setEditForm({ ...editForm, role: value })}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="viewer">צופה</SelectItem>
                                        <SelectItem value="manager">מנהל תיקים</SelectItem>
                                        <SelectItem value="admin">מנהל</SelectItem>
                                        {profile?.role === 'super_admin' && (
                                          <SelectItem value="super_admin">מנהל עליון</SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex items-center gap-2 border rounded-md px-3 py-1.5">
                                    <Switch
                                      id={`approved-${user.id}`}
                                      checked={editForm.is_approved}
                                      onCheckedChange={(checked) => setEditForm({ ...editForm, is_approved: checked })}
                                    />
                                    <Label htmlFor={`approved-${user.id}`} className="text-xs whitespace-nowrap">
                                      {editForm.is_approved ? 'מאושר' : 'ממתין'}
                                    </Label>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2 pt-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setEditingUser(null)}
                              >
                                ביטול
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={handleUpdateUser}
                              >
                                <Check className="h-4 w-4 ml-1" />
                                שמור
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
};