import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye,
  TrendingUp,
  Users,
  Building,
  DollarSign,
  Activity,
  BarChart3,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { UserProfile } from '@/types/auth';
import { logger } from '@/utils/logger';
import type { DatabaseProperty, FinancialRecord } from '@/types/owner-portal';

interface OwnerActivity {
  owner: UserProfile;
  properties: DatabaseProperty[];
  recent_activity: any[];
  financial_summary: {
    total_income: number;
    total_expenses: number;
    net_profit: number;
  };
  last_login?: string;
}

interface SystemStats {
  total_owners: number;
  total_properties: number;
  total_monthly_revenue: number;
  active_owners_today: number;
  properties_needing_attention: number;
  pending_invitations: number;
}

export const AdminControlDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [ownersActivity, setOwnersActivity] = useState<OwnerActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get system statistics
      const [
        { data: owners },
        { data: properties },
        { data: invitations },
        { data: financials }
      ] = await Promise.all([
        supabase.from('user_profiles_with_roles').select('*').eq('role', 'property_owner'),
        supabase.from('properties').select('*'),
        supabase.from('property_invitations').select('*').is('used_at', null),
        supabase.from('financial_records').select('*')
      ]);

      // Calculate stats
      const totalIncome = financials?.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0) || 0;
      const propertiesNeedingAttention = properties?.filter(p => 
        p.status === 'maintenance' || p.contact_status === 'needs_callback'
      ).length || 0;

      const systemStats: SystemStats = {
        total_owners: owners?.length || 0,
        total_properties: properties?.length || 0,
        total_monthly_revenue: totalIncome,
        active_owners_today: owners?.filter(o => 
          o.last_login && new Date(o.last_login).toDateString() === new Date().toDateString()
        ).length || 0,
        properties_needing_attention: propertiesNeedingAttention,
        pending_invitations: invitations?.length || 0,
      };

      setStats(systemStats);

      // Get detailed owner activity
      if (owners) {
        const ownerActivities = await Promise.all(
          owners.map(async (owner) => {
            // Get owner's properties
            const { data: ownerProps } = await supabase
              .from('properties')
              .select(`
                *,
                property_owners!inner(owner_id)
              `)
              .eq('property_owners.owner_id', owner.id);

            // Get owner's financial records
            const propertyIds = ownerProps?.map(p => p.id) || [];
            const { data: ownerFinancials } = await supabase
              .from('financial_records')
              .select('*')
              .in('property_id', propertyIds);

            // Get recent activity
            const { data: recentActivity } = await supabase
              .from('activity_logs')
              .select('*')
              .eq('user_id', owner.id)
              .order('created_at', { ascending: false })
              .limit(10);

            const income = ownerFinancials?.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0) || 0;
            const expenses = ownerFinancials?.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0) || 0;

            return {
              owner,
              properties: (ownerProps || []) as DatabaseProperty[],
              recent_activity: recentActivity || [],
              financial_summary: {
                total_income: income,
                total_expenses: expenses,
                net_profit: income - expenses,
              },
              last_login: owner.last_login,
            };
          })
        );

        setOwnersActivity(ownerActivities as OwnerActivity[]);
      }
    } catch (error) {
      logger.error('Error loading dashboard data:', error, 'AdminControlDashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'אף פעם';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'אתמול';
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    return date.toLocaleDateString('he-IL');
  };

  const getOwnerStatusColor = (owner: OwnerActivity) => {
    if (!owner.last_login) return 'bg-gray-500';
    
    const daysSinceLogin = Math.ceil(
      (new Date().getTime() - new Date(owner.last_login).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLogin <= 1) return 'bg-green-500';
    if (daysSinceLogin <= 7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען נתוני ניטור...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">מרכז בקרה - ניטור המערכת</h1>
        <p className="text-muted-foreground">
          מעקב אחר פעילות בעלי הנכסים ונתוני המערכת
        </p>
      </div>

      {/* System Overview Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">בעלי נכסים</p>
                  <p className="text-2xl font-bold">{stats.total_owners}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">נכסים</p>
                  <p className="text-2xl font-bold">{stats.total_properties}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">הכנסות חודשיות</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.total_monthly_revenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">פעילים היום</p>
                  <p className="text-2xl font-bold">{stats.active_owners_today}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">דורש תשומת לב</p>
                  <p className="text-2xl font-bold">{stats.properties_needing_attention}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">הזמנות ממתינות</p>
                  <p className="text-2xl font-bold">{stats.pending_invitations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="owners" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="owners">בעלי נכסים</TabsTrigger>
          <TabsTrigger value="activity">פעילות אחרונה</TabsTrigger>
          <TabsTrigger value="analytics">אנליטיקה</TabsTrigger>
        </TabsList>

        {/* Owners Overview */}
        <TabsContent value="owners" className="space-y-4">
          <div className="grid gap-4">
            {ownersActivity.map((ownerData) => (
              <Card key={ownerData.owner.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getOwnerStatusColor(ownerData)}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {ownerData.owner.full_name || ownerData.owner.email}
                          </h3>
                          <Badge variant="outline">{ownerData.properties.length} נכסים</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {ownerData.owner.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            כניסה אחרונה: {formatDate(ownerData.last_login)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">רווח חודשי</p>
                        <p className={`font-bold ${
                          ownerData.financial_summary.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(ownerData.financial_summary.net_profit)}
                        </p>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOwner(
                          selectedOwner === ownerData.owner.id ? null : ownerData.owner.id
                        )}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {selectedOwner === ownerData.owner.id ? 'הסתר' : 'צפה'}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Owner Details */}
                  {selectedOwner === ownerData.owner.id && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Properties */}
                        <div>
                          <h4 className="font-medium mb-2">הנכסים ({ownerData.properties.length})</h4>
                          <div className="space-y-2">
                            {ownerData.properties.map((property) => (
                              <div key={property.id} className="bg-muted/50 p-3 rounded">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{property.address}</p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {property.city}
                                    </p>
                                  </div>
                                  <Badge variant={
                                    property.status === 'occupied' ? 'default' :
                                    property.status === 'vacant' ? 'destructive' : 'secondary'
                                  }>
                                    {property.status === 'occupied' ? 'מושכר' :
                                     property.status === 'vacant' ? 'פנוי' : 'תחזוקה'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Financial Summary */}
                        <div>
                          <h4 className="font-medium mb-2">סיכום פיננסי</h4>
                          <div className="bg-muted/50 p-3 rounded space-y-2">
                            <div className="flex justify-between">
                              <span>הכנסות:</span>
                              <span className="text-green-600 font-medium">
                                {formatCurrency(ownerData.financial_summary.total_income)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>הוצאות:</span>
                              <span className="text-red-600 font-medium">
                                {formatCurrency(ownerData.financial_summary.total_expenses)}
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="font-medium">רווח נקי:</span>
                              <span className={`font-bold ${
                                ownerData.financial_summary.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(ownerData.financial_summary.net_profit)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {ownersActivity.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">אין בעלי נכסים במערכת</h3>
                  <p className="text-muted-foreground">
                    התחל על ידי הזמנת בעלי נכסים חדשים
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>פעילות אחרונה במערכת</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">בקרוב - יוצג כאן לוג מפורט של כל הפעילויות במערכת</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  אנליטיקה עסקית
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">בקרוב - גרפים ודוחות מתקדמים</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};