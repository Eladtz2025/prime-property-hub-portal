import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  BarChart3,
} from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { IncomeTracker } from './IncomeTracker';
import { ExpenseTracker } from './ExpenseTracker';
import { startOfMonth, startOfYear } from 'date-fns';

type DateRangeType = 'current-month' | 'current-year' | 'from-contract' | 'all-time';

export const FinancialDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRangeType>('current-month');
  
  // Calculate the date range based on selection
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'current-month':
        return { start: startOfMonth(now), end: now };
      case 'current-year':
        return { start: startOfYear(now), end: now };
      case 'from-contract':
      case 'all-time':
        return { start: undefined, end: undefined }; // Will fetch all data
      default:
        return { start: startOfMonth(now), end: now };
    }
  };
  
  const dateRangeParams = getDateRange();
  
  const { 
    rentPayments, 
    properties, 
    financialSummary, 
    incomeByProperty,
    isLoading, 
    isError 
  } = useFinancialData(dateRangeParams.start, dateRangeParams.end, dateRange === 'from-contract');

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

  if (isError) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-red-500 mb-4">שגיאה בטעינת הנתונים הכספיים</div>
        </CardContent>
      </Card>
    );
  }

  const tenants = properties.flatMap(p => p.tenants || []);

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
            <SelectItem value="current-year">השנה הנוכחית</SelectItem>
            <SelectItem value="from-contract">מתחילת החוזה</SelectItem>
            <SelectItem value="all-time">כל התקופה</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="income" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="income" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            הכנסות
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            הוצאות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="space-y-6">
          <IncomeTracker
            payments={rentPayments}
            properties={properties}
            tenants={tenants}
            dateRangeType={dateRange}
          />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <ExpenseTracker
            dateRangeStart={dateRangeParams.start}
            dateRangeEnd={dateRangeParams.end}
            properties={properties}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};