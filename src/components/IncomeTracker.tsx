import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { he } from 'date-fns/locale';

interface RentPayment {
  id: string;
  tenant_id: string;
  property_id: string;
  amount: number;
  payment_date: string;
  due_date: string;
  status: string;
  payment_method: string;
  notes?: string;
}

interface Property {
  id: string;
  address: string;
  city: string;
}

interface Tenant {
  id: string;
  name: string;
  monthly_rent?: number;
  property_id: string;
  is_active: boolean;
}

interface IncomeTrackerProps {
  payments: RentPayment[];
  properties: Property[];
  tenants: Tenant[];
  dateRangeType?: string;
}

export const IncomeTracker: React.FC<IncomeTrackerProps> = ({
  payments,
  properties,
  tenants,
  dateRangeType = 'current-month'
}) => {
  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  // All payments are already filtered by the hook based on date range
  const monthlyPayments = payments;

  // Calculate income statistics
  const totalIncome = monthlyPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingIncome = monthlyPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const overdueIncome = monthlyPayments
    .filter(p => p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const expectedIncome = tenants
    .filter(t => t.is_active && t.monthly_rent)
    .reduce((sum, t) => sum + (t.monthly_rent || 0), 0);

  const collectionRate = expectedIncome > 0 ? (totalIncome / expectedIncome) * 100 : 0;

  // Group payments by property
  const incomeByProperty = properties.map(property => {
    const propertyPayments = monthlyPayments.filter(p => p.property_id === property.id);
    const propertyTenants = tenants.filter(t => t.property_id === property.id && t.is_active);
    
    const collected = propertyPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const pending = propertyPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const overdue = propertyPayments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const expected = propertyTenants
      .reduce((sum, t) => sum + (t.monthly_rent || 0), 0);

    return {
      property,
      collected,
      pending,
      overdue,
      expected,
      tenantCount: propertyTenants.length,
      collectionRate: expected > 0 ? (collected / expected) * 100 : 0
    };
  }).filter(item => item.expected > 0); // Only show properties with expected income

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-right">
        <h2 className="text-2xl font-bold mb-2">מעקב הכנסות</h2>
        <p className="text-muted-foreground">
          {dateRangeType === 'current-month' && 'החודש הנוכחי'}
          {dateRangeType === 'current-year' && 'השנה הנוכחית'}
          {dateRangeType === 'from-contract' && 'מתחילת החוזה'}
          {dateRangeType === 'all-time' && 'כל התקופה'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הכנסות שנגבו</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={collectionRate} className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {collectionRate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ממתין לגבייה</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(pendingIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {monthlyPayments.filter(p => p.status === 'pending').length} תשלומים
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">איחורים</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(overdueIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {monthlyPayments.filter(p => p.status === 'overdue').length} תשלומים
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הכנסה צפויה</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(expectedIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {tenants.filter(t => t.is_active).length} דיירים פעילים
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income by Property */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <Building className="w-5 h-5" />
            הכנסות לפי נכס
          </CardTitle>
          <CardDescription className="text-right">
            פירוט הכנסות עבור כל נכס בחודש הנוכחי
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incomeByProperty.map(({ property, collected, pending, overdue, expected, tenantCount, collectionRate }) => (
              <div key={property.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {tenantCount} דיירים
                    </Badge>
                    <Badge 
                      variant={collectionRate >= 100 ? "default" : collectionRate >= 75 ? "secondary" : "destructive"}
                    >
                      {collectionRate.toFixed(0)}% נגבה
                    </Badge>
                  </div>
                  <div className="text-right">
                    <h3 className="font-medium">{property.address}</h3>
                    <p className="text-sm text-muted-foreground">{property.city}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">נגבה</div>
                    <div className="font-medium text-green-600">
                      {formatCurrency(collected)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">ממתין</div>
                    <div className="font-medium text-yellow-600">
                      {formatCurrency(pending)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">איחור</div>
                    <div className="font-medium text-red-600">
                      {formatCurrency(overdue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">צפוי</div>
                    <div className="font-medium">
                      {formatCurrency(expected)}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <Progress value={collectionRate} className="h-2" />
                </div>
              </div>
            ))}

            {incomeByProperty.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>אין נתוני הכנסות לחודש זה</p>
                <p className="text-sm">הוסף דיירים ותשלומי שכירות כדי לראות את ההכנסות</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">תשלומים אחרונים</CardTitle>
          <CardDescription className="text-right">
            התשלומים הגבוהים ביותר בחודש זה
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {monthlyPayments
              .filter(p => p.status === 'paid')
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5)
              .map(payment => {
                const tenant = tenants.find(t => t.id === payment.tenant_id);
                const property = properties.find(p => p.id === payment.property_id);
                
                return (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(payment.payment_date), "dd/MM", { locale: he })}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {payment.payment_method === 'cash' && 'מזומן'}
                        {payment.payment_method === 'bank_transfer' && 'העברה'}
                        {payment.payment_method === 'check' && 'המחאה'}
                        {payment.payment_method === 'credit_card' && 'אשראי'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(payment.amount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {tenant?.name} • {property?.address}
                      </div>
                    </div>
                  </div>
                );
              })}

            {monthlyPayments.filter(p => p.status === 'paid').length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>אין תשלומים שנרשמו לחודש זה</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};