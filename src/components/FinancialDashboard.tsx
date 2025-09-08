import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar as CalendarIcon,
  BarChart3,
  PieChart,
  Download
} from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useFinancialData } from '@/hooks/useFinancialData';
import { IncomeTracker } from './IncomeTracker';

export const FinancialDashboard: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState<'income' | 'expenses' | 'reports'>('income');
  
  const { 
    rentPayments, 
    properties, 
    financialSummary, 
    incomeByProperty,
    isLoading, 
    isError 
  } = useFinancialData(selectedMonth);

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(current => 
      direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1)
    );
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

  if (isError) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-red-500 mb-4">שגיאה בטעינת הנתונים הכספיים</div>
          <Button variant="outline">
            נסה שוב
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for IncomeTracker
  const tenants = properties.flatMap(p => p.tenants || []);

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            ← חודש קודם
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-center text-center font-normal",
                  !selectedMonth && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedMonth ? (
                  format(selectedMonth, "MMMM yyyy", { locale: he })
                ) : (
                  <span>בחר חודש</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedMonth}
                onSelect={(date) => date && setSelectedMonth(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            חודש הבא →
          </Button>
        </div>

        <div className="text-right">
          <h1 className="text-3xl font-bold">לוח הכספים</h1>
          <p className="text-muted-foreground">מעקב הכנסות והוצאות</p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ הכנסות</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialSummary.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              מ-{financialSummary.activeTenants} דיירים פעילים
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">אחוז גבייה</CardTitle>
            <PieChart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {financialSummary.collectionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {financialSummary.activeProperties} נכסים פעילים
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הוצאות</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(financialSummary.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              יושלם בשלב הבא
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">רווח נקי</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(financialSummary.totalIncome - financialSummary.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              הכנסות - הוצאות
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="income" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            מעקב הכנסות
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2" disabled>
            <BarChart3 className="w-4 h-4" />
            ניהול הוצאות
            <Badge variant="secondary" className="text-xs">בקרוב</Badge>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2" disabled>
            <Download className="w-4 h-4" />
            דוחות
            <Badge variant="secondary" className="text-xs">בקרוב</Badge>
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
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">ניהול הוצאות</h3>
              <p className="text-muted-foreground mb-4">
                תכונה זו תהיה זמינה בשלב הבא
              </p>
              <Badge variant="outline">שלב 2: ניהול הוצאות</Badge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardContent className="text-center py-12">
              <Download className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">דוחות כספיים</h3>
              <p className="text-muted-foreground mb-4">
                דוחות מפורטים יהיו זמינים בשלב הבא
              </p>
              <Badge variant="outline">שלב 3: דוחות</Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};