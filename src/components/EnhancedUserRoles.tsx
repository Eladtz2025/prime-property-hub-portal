import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  User, 
  Users, 
  Eye, 
  Edit, 
  Trash2,
  Key,
  Building,
  DollarSign,
  MessageSquare,
  Wrench,
  FileText,
  Settings,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
  isSystemRole: boolean;
}

interface UserWithRole {
  id: string;
  email: string;
  full_name?: string;
  role_id: string;
  role_name: string;
  is_active: boolean;
  last_login?: string;
  permissions: string[];
}

const DEFAULT_PERMISSIONS: Permission[] = [
  { id: 'properties.view', resource: 'properties', action: 'view', description: 'צפייה בנכסים' },
  { id: 'properties.create', resource: 'properties', action: 'create', description: 'יצירת נכסים' },
  { id: 'properties.edit', resource: 'properties', action: 'edit', description: 'עריכת נכסים' },
  { id: 'properties.delete', resource: 'properties', action: 'delete', description: 'מחיקת נכסים' },
  
  { id: 'tenants.view', resource: 'tenants', action: 'view', description: 'צפייה בדיירים' },
  { id: 'tenants.create', resource: 'tenants', action: 'create', description: 'הוספת דיירים' },
  { id: 'tenants.edit', resource: 'tenants', action: 'edit', description: 'עריכת דיירים' },
  { id: 'tenants.delete', resource: 'tenants', action: 'delete', description: 'מחיקת דיירים' },
  
  { id: 'finances.view', resource: 'finances', action: 'view', description: 'צפייה בנתונים פיננסיים' },
  { id: 'finances.manage', resource: 'finances', action: 'manage', description: 'ניהול נתונים פיננסיים' },
  
  { id: 'maintenance.view', resource: 'maintenance', action: 'view', description: 'צפייה בתחזוקה' },
  { id: 'maintenance.manage', resource: 'maintenance', action: 'manage', description: 'ניהול תחזוקה' },
  
  { id: 'communications.view', resource: 'communications', action: 'view', description: 'צפייה בהתכתבויות' },
  { id: 'communications.send', resource: 'communications', action: 'send', description: 'שליחת הודעות' },
  
  { id: 'reports.view', resource: 'reports', action: 'view', description: 'צפייה בדוחות' },
  { id: 'reports.export', resource: 'reports', action: 'export', description: 'ייצוא דוחות' },
  
  { id: 'users.view', resource: 'users', action: 'view', description: 'צפייה במשתמשים' },
  { id: 'users.manage', resource: 'users', action: 'manage', description: 'ניהול משתמשים' },
  
  { id: 'system.admin', resource: 'system', action: 'admin', description: 'הרשאות מנהל מערכת' }
];

const DEFAULT_ROLES: Role[] = [
  {
    id: 'super_admin',
    name: 'מנהל עליון',
    description: 'גישה מלאה לכל המערכת',
    color: 'bg-red-100 text-red-800',
    permissions: DEFAULT_PERMISSIONS.map(p => p.id),
    isSystemRole: true
  },
  {
    id: 'admin',
    name: 'מנהל',
    description: 'ניהול נכסים ודיירים',
    color: 'bg-blue-100 text-blue-800',
    permissions: [
      'properties.view', 'properties.create', 'properties.edit',
      'tenants.view', 'tenants.create', 'tenants.edit',
      'finances.view', 'finances.manage',
      'maintenance.view', 'maintenance.manage',
      'communications.view', 'communications.send',
      'reports.view', 'reports.export'
    ],
    isSystemRole: true
  },
  {
    id: 'property_manager',
    name: 'מנהל נכסים',
    description: 'ניהול נכסים ותחזוקה',
    color: 'bg-green-100 text-green-800',
    permissions: [
      'properties.view', 'properties.edit',
      'tenants.view', 'tenants.edit',
      'maintenance.view', 'maintenance.manage',
      'communications.view', 'communications.send',
      'reports.view'
    ],
    isSystemRole: true
  },
  {
    id: 'viewer',
    name: 'צופה',
    description: 'צפייה בלבד',
    color: 'bg-gray-100 text-gray-800',
    permissions: [
      'properties.view',
      'tenants.view',
      'finances.view',
      'reports.view'
    ],
    isSystemRole: true
  }
];

export const EnhancedUserRoles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [permissions] = useState<Permission[]>(DEFAULT_PERMISSIONS);
  const [isNewRoleOpen, setIsNewRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const { toast } = useToast();

  // New role form state
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const handleCreateRole = () => {
    if (!newRole.name.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא הזן שם לתפקיד",
        variant: "destructive"
      });
      return;
    }

    const role: Role = {
      id: crypto.randomUUID(),
      name: newRole.name,
      description: newRole.description,
      color: 'bg-purple-100 text-purple-800',
      permissions: newRole.permissions,
      isSystemRole: false
    };

    setRoles(prev => [...prev, role]);
    setNewRole({ name: '', description: '', permissions: [] });
    setIsNewRoleOpen(false);

    toast({
      title: "תפקיד נוצר",
      description: `התפקיד "${role.name}" נוצר בהצלחה`
    });
  };

  const handleUpdateRolePermissions = (roleId: string, permissionId: string, granted: boolean) => {
    setRoles(prev => prev.map(role => {
      if (role.id === roleId && !role.isSystemRole) {
        const updatedPermissions = granted
          ? [...role.permissions, permissionId]
          : role.permissions.filter(p => p !== permissionId);
        
        return { ...role, permissions: updatedPermissions };
      }
      return role;
    }));

    toast({
      title: "הרשאה עודכנה",
      description: "הרשאות התפקיד עודכנו בהצלחה"
    });
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystemRole) {
      toast({
        title: "לא ניתן למחוק",
        description: "לא ניתן למחוק תפקידי מערכת",
        variant: "destructive"
      });
      return;
    }

    setRoles(prev => prev.filter(r => r.id !== roleId));
    toast({
      title: "תפקיד נמחק",
      description: "התפקיד נמחק בהצלחה"
    });
  };

  const getPermissionsByResource = () => {
    const grouped = permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);

    return grouped;
  };

  const getResourceIcon = (resource: string) => {
    const icons = {
      properties: Building,
      tenants: Users,
      finances: DollarSign,
      maintenance: Wrench,
      communications: MessageSquare,
      reports: FileText,
      users: User,
      system: Settings
    };
    return icons[resource as keyof typeof icons] || Shield;
  };

  const getResourceLabel = (resource: string) => {
    const labels = {
      properties: 'נכסים',
      tenants: 'דיירים',
      finances: 'כספים',
      maintenance: 'תחזוקה',
      communications: 'תקשורת',
      reports: 'דוחות',
      users: 'משתמשים',
      system: 'מערכת'
    };
    return labels[resource as keyof typeof labels] || resource;
  };

  const permissionsByResource = getPermissionsByResource();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="roles">ניהול תפקידים</TabsTrigger>
          <TabsTrigger value="users">ניהול משתמשים</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          {/* Roles Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  תפקידים והרשאות
                </CardTitle>
                <Dialog open={isNewRoleOpen} onOpenChange={setIsNewRoleOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-1" />
                      תפקיד חדש
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>יצירת תפקיד חדש</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="role-name">שם התפקיד</Label>
                        <Input
                          id="role-name"
                          value={newRole.name}
                          onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="שם התפקיד"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role-description">תיאור</Label>
                        <Input
                          id="role-description"
                          value={newRole.description}
                          onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="תיאור התפקיד"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label>הרשאות</Label>
                        {Object.entries(permissionsByResource).map(([resource, resourcePermissions]) => {
                          const Icon = getResourceIcon(resource);
                          return (
                            <Card key={resource} className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Icon className="w-5 h-5" />
                                <h4 className="font-medium">{getResourceLabel(resource)}</h4>
                              </div>
                              <div className="space-y-2">
                                {resourcePermissions.map(permission => (
                                  <div key={permission.id} className="flex items-center justify-between">
                                    <span className="text-sm">{permission.description}</span>
                                    <Switch
                                      checked={newRole.permissions.includes(permission.id)}
                                      onCheckedChange={(checked) => {
                                        setNewRole(prev => ({
                                          ...prev,
                                          permissions: checked
                                            ? [...prev.permissions, permission.id]
                                            : prev.permissions.filter(p => p !== permission.id)
                                        }));
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </Card>
                          );
                        })}
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleCreateRole}>
                          יצירת תפקיד
                        </Button>
                        <Button variant="outline" onClick={() => setIsNewRoleOpen(false)}>
                          ביטול
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map(role => (
                  <Card key={role.id} className="relative">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={role.color}>
                              {role.name}
                            </Badge>
                            {role.isSystemRole && (
                              <Badge variant="outline" className="text-xs">
                                תפקיד מערכת
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                        {!role.isSystemRole && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">הרשאות ({role.permissions.length})</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRole(role)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            עריכה
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {Object.entries(permissionsByResource).slice(0, 3).map(([resource, resourcePermissions]) => {
                            const granted = resourcePermissions.filter(p => role.permissions.includes(p.id)).length;
                            const total = resourcePermissions.length;
                            const Icon = getResourceIcon(resource);

                            return (
                              <div key={resource} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4" />
                                  <span>{getResourceLabel(resource)}</span>
                                </div>
                                <span className="text-muted-foreground">{granted}/{total}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Permission Editor Modal */}
          {selectedRole && (
            <Dialog open={!!selectedRole} onOpenChange={() => setSelectedRole(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>עריכת הרשאות - {selectedRole.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {Object.entries(permissionsByResource).map(([resource, resourcePermissions]) => {
                    const Icon = getResourceIcon(resource);
                    return (
                      <Card key={resource}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5" />
                            <h3 className="font-semibold">{getResourceLabel(resource)}</h3>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {resourcePermissions.map(permission => (
                            <div key={permission.id} className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">{permission.description}</span>
                                <p className="text-xs text-muted-foreground">
                                  {permission.resource}.{permission.action}
                                </p>
                              </div>
                              <Switch
                                checked={selectedRole.permissions.includes(permission.id)}
                                onCheckedChange={(checked) => 
                                  handleUpdateRolePermissions(selectedRole.id, permission.id, checked)
                                }
                                disabled={selectedRole.isSystemRole}
                              />
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* Users Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                ניהול משתמשים ותפקידים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-4" />
                <p>ניהול משתמשים יהיה זמין בקרוב</p>
                <p className="text-sm">כאן תוכל לנהל משתמשים ולהקצות להם תפקידים</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};