import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Home, Plus, Building } from 'lucide-react';
import { useOwnerFinancialData, type DateRangeType } from '@/hooks/useOwnerFinancialData';
import { AddExpenseModalOwner } from './AddExpenseModalOwner';
import type { OwnerDashboardStats, PropertyWithTenant } from '@/types/owner-portal';

interface OwnerFinancialDashboardProps {
  statsData: OwnerDashboardStats;
  properties: PropertyWithTenant[];
}

export const OwnerFinancialDashboard: React.FC<OwnerFinancialDashboardProps> = ({ statsData, properties: propertiesData }) => {
  const [dateRange, setDateRange] = useState<DateRangeType>('current-month');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const { financialSummary, properties, expenses, payments, isLoading, refetch } = useOwnerFinancialData(dateRange);

  // Filter data by selected property
  const filteredProperties = selectedPropertyId === 'all' 
    ? properties 
    : properties.filter(p => p.property_id === selectedPropertyId);
  
  const filteredExpenses = selectedPropertyId === 'all'
    ? expenses
    : expenses.filter(e => e.property_id === selectedPropertyId);

  const filteredPayments = selectedPropertyId === 'all'
    ? payments
    : payments.filter(p => p.property_id === selectedPropertyId);

  const filteredSummary = selectedPropertyId === 'all' ? financialSummary : {
    totalExpectedIncome: filteredProperties.reduce((sum, p) => sum + (p.monthly_rent || 0), 0),
    totalActualIncome: filteredPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0),
    totalExpenses: filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    netProfit: 0,
    propertyCount: filteredProperties.length
  };
  filteredSummary.netProfit = filteredSummary.totalActualIncome - filteredSummary.totalExpenses;

  const filteredStats = selectedPropertyId === 'all' ? statsData : {
    total_properties: filteredProperties.length,
    occupied_properties: filteredProperties.filter(p => 
      propertiesData.find(pd => pd.id === p.property_id)?.tenant?.is_active
    ).length,
    vacant_properties: filteredProperties.filter(p => 
      !propertiesData.find(pd => pd.id === p.property_id)?.tenant?.is_active
    ).length,
    total_monthly_income: statsData.total_monthly_income,
    total_monthly_expenses: statsData.total_monthly_expenses,
    net_monthly_profit: statsData.net_monthly_profit,
    properties_needing_attention: statsData.properties_needing_attention
  };

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  const getDateRangeLabel = () => {
    const nextYear = new Date().getFullYear() + 1;
    switch (dateRange) {
      case 'current-month': return 'החודש הנוכחי';
      case 'from-contract': return 'מתחילת החוזה';
      case 'next-year': return `צפי הכנסה לשנת ${nextYear}`;
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
    <div dir="rtl" className="space-y-4 md:space-y-6">
      {/* Date Range Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <label className="text-sm font-medium">טווח תאריכים:</label>
        <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRangeType)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current-month">החודש הנוכחי</SelectItem>
            <SelectItem value="from-contract">מתחילת החוזה</SelectItem>
            <SelectItem value="next-year">צפי הכנסה לשנת {new Date().getFullYear() + 1}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">סה"כ נכסים</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xl md:text-2xl font-bold">{filteredStats.total_properties}</div>
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-green-500 text-white text-xs">
                {filteredStats.occupied_properties} מושכרים
              </Badge>
              <Badge className="bg-red-500 text-white text-xs">
                {filteredStats.vacant_properties} פנויים
              </Badge>
            </div>
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="כל הנכסים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הנכסים</SelectItem>
                {propertiesData.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">הכנסה צפויה</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-blue-600">
              {formatCurrency(filteredSummary.totalExpectedIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getDateRangeLabel()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">הכנסות בפועל</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-green-600">
              {formatCurrency(filteredSummary.totalActualIncome)}
            </div>
            <p className="text-xs text-muted-foreground">{getDateRangeLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">סה"כ הוצאות</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-red-600">
              {formatCurrency(filteredSummary.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">{getDateRangeLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">רווח נקי</CardTitle>
            {filteredSummary.netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-xl md:text-2xl font-bold ${
              filteredSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(filteredSummary.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">הכנסות בפועל - הוצאות</p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base md:text-lg">הוצאות</CardTitle>
              <CardDescription className="text-sm">{getDateRangeLabel()}</CardDescription>
            </div>
            <Button onClick={() => setIsAddExpenseOpen(true)} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 ml-2" />
              הוסף הוצאה
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 md:py-8 text-sm md:text-base">
              אין הוצאות לתקופה זו
            </p>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-2 md:p-3 border rounded text-sm md:text-base">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{expense.category}</p>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.transaction_date).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <p className="font-bold text-red-600 text-sm md:text-base ml-2 flex-shrink-0">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      <AddExpenseModalOwner
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
        properties={properties.map(p => ({
          property_id: p.property_id,
          property_address: p.property_address,
        }))}
        onSuccess={refetch}
      />
    </div>
  );
};
