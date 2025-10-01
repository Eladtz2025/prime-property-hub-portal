import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, Home } from 'lucide-react';
import { useOwnerFinancialData, type DateRangeType } from '@/hooks/useOwnerFinancialData';

export const OwnerFinancialDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRangeType>('current-month');
  const { financialSummary, properties, payments, expenses, isLoading } = useOwnerFinancialData(dateRange);

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'current-month': return 'החודש הנוכחי';
      case 'from-contract': return 'מתחילת החוזה';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען נתוני כספים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">טווח תאריכים:</label>
        <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRangeType)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current-month">החודש הנוכחי</SelectItem>
            <SelectItem value="from-contract">מתחילת החוזה</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הכנסה צפויה</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(financialSummary.totalExpectedIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              מ-{financialSummary.propertyCount} נכסים
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הכנסות בפועל</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialSummary.totalActualIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              תשלומים שהתקבלו
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הוצאות</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(financialSummary.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {expenses.length} הוצאות
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">רווח נקי</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(financialSummary.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              הכנסות - הוצאות
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="properties">נכסים</TabsTrigger>
          <TabsTrigger value="payments">תשלומים</TabsTrigger>
          <TabsTrigger value="expenses">הוצאות</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>נכסים פעילים</CardTitle>
              <CardDescription>הכנסה צפויה לפי נכס - {getDateRangeLabel()}</CardDescription>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  אין נכסים פעילים עם דיירים
                </p>
              ) : (
                <div className="space-y-4">
                  {properties.map((prop, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{prop.property_address}</h3>
                        <p className="text-sm text-muted-foreground">דייר: {prop.tenant_name}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(prop.monthly_rent)}
                        </p>
                        <p className="text-xs text-muted-foreground">לחודש</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>תשלומי שכירות</CardTitle>
              <CardDescription>{getDateRangeLabel()}</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  אין רשומות תשלום לתקופה זו
                </p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <p className="text-sm">
                          {new Date(payment.payment_date).toLocaleDateString('he-IL')}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{payment.status}</p>
                      </div>
                      <p className="font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>הוצאות</CardTitle>
              <CardDescription>{getDateRangeLabel()}</CardDescription>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  אין הוצאות לתקופה זו
                </p>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{expense.category}</p>
                        <p className="text-sm text-muted-foreground">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(expense.transaction_date).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                      <p className="font-bold text-red-600">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
