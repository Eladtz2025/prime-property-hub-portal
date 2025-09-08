import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Bell, DollarSign, CreditCard, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { logger } from '@/utils/logger';

interface RecurringPayment {
  id: string;
  propertyId: string;
  propertyAddress: string;
  tenantName: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  daysUntilDue: number;
  lastPaymentDate?: string;
}

export const AutomatedRentTracking: React.FC = () => {
  const { profile } = useAuth();
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [stats, setStats] = useState({
    totalExpected: 0,
    totalReceived: 0,
    pendingCount: 0,
    overdueCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadRentTrackingData();
    }
  }, [profile?.id]);

  const loadRentTrackingData = async () => {
    try {
      // Get properties owned by the user
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          id,
          address,
          tenants(
            id,
            name,
            monthly_rent,
            is_active
          )
        `)
        .eq('property_owners.owner_id', profile?.id);

      if (propertiesError) throw propertiesError;

      // Get recent rent payments
      const { data: payments, error: paymentsError } = await supabase
        .from('rent_payments')
        .select('*')
        .gte('due_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      if (paymentsError) throw paymentsError;

      // Process data to create recurring payment tracking
      const currentMonth = new Date();
      const recurringData: RecurringPayment[] = [];
      let totalExpected = 0;
      let totalReceived = 0;
      let pendingCount = 0;
      let overdueCount = 0;

      properties?.forEach(property => {
        property.tenants?.forEach(tenant => {
          if (tenant.is_active && tenant.monthly_rent) {
            const dueDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            
            // Find if payment was made for this month
            const payment = payments?.find(p => 
              p.property_id === property.id && 
              p.tenant_id === tenant.id &&
              new Date(p.due_date).getMonth() === currentMonth.getMonth()
            );

            let status: 'paid' | 'pending' | 'overdue' = 'pending';
            if (payment?.status === 'paid') {
              status = 'paid';
              totalReceived += Number(tenant.monthly_rent);
            } else if (daysUntilDue < 0) {
              status = 'overdue';
              overdueCount++;
            } else {
              pendingCount++;
            }

            totalExpected += Number(tenant.monthly_rent);

            recurringData.push({
              id: `${property.id}-${tenant.id}`,
              propertyId: property.id,
              propertyAddress: property.address,
              tenantName: tenant.name,
              amount: Number(tenant.monthly_rent),
              dueDate: dueDate.toISOString(),
              status,
              daysUntilDue,
              lastPaymentDate: payment?.payment_date
            });
          }
        });
      });

      setRecurringPayments(recurringData);
      setStats({
        totalExpected,
        totalReceived,
        pendingCount,
        overdueCount
      });

    } catch (error) {
      logger.error('Error loading rent tracking data:', error, 'AutomatedRentTracking');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'שולם';
      case 'overdue': return 'באיחור';
      default: return 'ממתין';
    }
  };

  const sendPaymentReminder = async (paymentId: string) => {
    // In a real implementation, this would send email/SMS
    logger.info('Sending payment reminder for:', paymentId, 'AutomatedRentTracking');
    
    // Create notification
    const payment = recurringPayments.find(p => p.id === paymentId);
    if (payment) {
      await supabase.from('notifications').insert({
        recipient_id: profile?.id,
        type: 'rent_reminder',
        title: 'תזכורת תשלום שכירות',
        message: `נשלחה תזכורת לשוכר ${payment.tenantName} לתשלום שכירות בסך ₪${payment.amount.toLocaleString()}`,
        priority: 'medium'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>טוען מעקב שכירות...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">צפוי החודש</p>
                <p className="text-lg font-semibold">₪{stats.totalExpected.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">התקבל</p>
                <p className="text-lg font-semibold">₪{stats.totalReceived.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">ממתינים</p>
                <p className="text-lg font-semibold">{stats.pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">באיחור</p>
                <p className="text-lg font-semibold">{stats.overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Progress */}
      <Card>
        <CardHeader>
          <CardTitle>התקדמות גביה חודשית</CardTitle>
          <CardDescription>
            {Math.round((stats.totalReceived / stats.totalExpected) * 100)}% מההכנסות הצפויות נגבו
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress 
            value={(stats.totalReceived / stats.totalExpected) * 100} 
            className="h-3"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>₪{stats.totalReceived.toLocaleString()}</span>
            <span>₪{stats.totalExpected.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Recurring Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            תשלומי שכירות חוזרים
          </CardTitle>
          <CardDescription>מעקב אחר תשלומים חודשיים אוטומטי</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recurringPayments.map((payment) => (
              <div key={payment.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payment.status)}
                    <div>
                      <h4 className="font-medium">{payment.tenantName}</h4>
                      <p className="text-sm text-muted-foreground">{payment.propertyAddress}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">₪{payment.amount.toLocaleString()}</p>
                    <Badge variant={getStatusColor(payment.status)} className="text-xs">
                      {getStatusText(payment.status)}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {payment.daysUntilDue > 0 
                          ? `בעוד ${payment.daysUntilDue} ימים`
                          : payment.daysUntilDue === 0 
                          ? 'היום'
                          : `באיחור ${Math.abs(payment.daysUntilDue)} ימים`
                        }
                      </span>
                    </div>
                    {payment.lastPaymentDate && (
                      <div>
                        <span>תשלום אחרון: {formatDistanceToNow(new Date(payment.lastPaymentDate), { 
                          addSuffix: true, 
                          locale: he 
                        })}</span>
                      </div>
                    )}
                  </div>

                  {(payment.status === 'pending' || payment.status === 'overdue') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendPaymentReminder(payment.id)}
                      className="gap-1"
                    >
                      <Bell className="h-3 w-3" />
                      שלח תזכורת
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {recurringPayments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>אין תשלומים חוזרים להצגה</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};