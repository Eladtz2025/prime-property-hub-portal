import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  BarChart3,
} from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { IncomeTracker } from './IncomeTracker';
import { ExpenseTracker } from './ExpenseTracker';

export const FinancialDashboard: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
  const { 
    rentPayments, 
    properties, 
    financialSummary, 
    incomeByProperty,
    isLoading, 
    isError 
  } = useFinancialData(selectedMonth);

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
            selectedMonth={selectedMonth}
          />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <ExpenseTracker
            selectedMonth={selectedMonth}
            properties={properties}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};