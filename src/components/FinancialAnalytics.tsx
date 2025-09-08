import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useExpenseData } from '@/hooks/useExpenseData';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieIcon, 
  Calendar,
  Target,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { format, subMonths, addMonths, startOfMonth } from 'date-fns';

interface AnalyticsData {
  month: string;
  income: number;
  expenses: number;
  profit: number;
  rentCollection: number;
  occupancyRate: number;
}

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export const FinancialAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'6months' | '12months' | '24months'>('12months');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  
  const currentDate = new Date();
  const periodMonths = selectedPeriod === '6months' ? 6 : selectedPeriod === '12months' ? 12 : 24;
  
  // Generate data for the selected period
  const analyticsData: AnalyticsData[] = useMemo(() => {
    const data: AnalyticsData[] = [];
    
    for (let i = periodMonths - 1; i >= 0; i--) {
      const date = subMonths(currentDate, i);
      const monthName = format(date, 'MMM yyyy');
      
      // Mock data - in real implementation, this would come from your hooks
      const baseIncome = Math.random() * 5000 + 15000;
      const baseExpenses = Math.random() * 2000 + 3000;
      const seasonalMultiplier = Math.sin((date.getMonth() / 12) * Math.PI * 2) * 0.2 + 1;
      
      data.push({
        month: monthName,
        income: Math.round(baseIncome * seasonalMultiplier),
        expenses: Math.round(baseExpenses * seasonalMultiplier),
        profit: Math.round((baseIncome - baseExpenses) * seasonalMultiplier),
        rentCollection: Math.random() * 20 + 80, // 80-100%
        occupancyRate: Math.random() * 10 + 90, // 90-100%
      });
    }
    
    return data;
  }, [selectedPeriod, currentDate, periodMonths]);

  const expenseCategoryData: CategoryData[] = useMemo(() => {
    const categories = [
      { name: 'תחזוקה', amount: 8500 },
      { name: 'ביטוח', amount: 3200 },
      { name: 'מיסים', amount: 2800 },
      { name: 'ניהול', amount: 1500 },
      { name: 'חשמל ומים', amount: 1200 },
      { name: 'אחר', amount: 800 }
    ];
    
    const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
    
    return categories.map((cat, index) => ({
      category: cat.name,
      amount: cat.amount,
      percentage: Math.round((cat.amount / total) * 100),
      color: COLORS[index % COLORS.length]
    }));
  }, []);

  const currentMonthData = useFinancialData();
  const currentExpenseData = useExpenseData();

  const formatCurrency = (value: number) => `₪${value.toLocaleString('he-IL')}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  // Calculate trends
  const lastMonth = analyticsData[analyticsData.length - 1];
  const previousMonth = analyticsData[analyticsData.length - 2];
  
  const incomeTrend = lastMonth && previousMonth 
    ? ((lastMonth.income - previousMonth.income) / previousMonth.income) * 100 
    : 0;
    
  const expenseTrend = lastMonth && previousMonth 
    ? ((lastMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100 
    : 0;

  const profitTrend = lastMonth && previousMonth 
    ? ((lastMonth.profit - previousMonth.profit) / previousMonth.profit) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">ניתוח כספי מתקדם</h2>
          <p className="text-muted-foreground">תובנות וטרנדים על הביצועים הכספיים</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">6 חודשים</SelectItem>
              <SelectItem value="12months">12 חודשים</SelectItem>
              <SelectItem value="24months">24 חודשים</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">טרנד הכנסות</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(lastMonth?.income || 0)}</div>
            <div className={`text-xs flex items-center gap-1 ${
              incomeTrend >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {incomeTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatPercentage(Math.abs(incomeTrend))} מהחודש הקודם
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">טרנד הוצאות</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(lastMonth?.expenses || 0)}</div>
            <div className={`text-xs flex items-center gap-1 ${
              expenseTrend <= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {expenseTrend <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {formatPercentage(Math.abs(expenseTrend))} מהחודש הקודם
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">אחוז גבייה ממוצע</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(analyticsData.reduce((sum, d) => sum + d.rentCollection, 0) / analyticsData.length)}
            </div>
            <div className="text-xs text-muted-foreground">
              ב-{periodMonths} החודשים האחרונים
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">שיעור תפוסה</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(analyticsData.reduce((sum, d) => sum + d.occupancyRate, 0) / analyticsData.length)}
            </div>
            <div className="text-xs text-muted-foreground">
              ממוצע תקופה
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">טרנדים</TabsTrigger>
          <TabsTrigger value="comparison">השוואה</TabsTrigger>
          <TabsTrigger value="categories">קטגוריות</TabsTrigger>
          <TabsTrigger value="performance">ביצועים</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>טרנד הכנסות וחודש</CardTitle>
              <CardDescription>מעקב שינויי ההכנסות וההוצאות לאורך זמן</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="הכנסות"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    name="הוצאות"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>השוואת רווחיות</CardTitle>
              <CardDescription>ניתוח רווח נקי לאורך התקופה</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    name="רווח נקי"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>פילוח הוצאות לפי קטגוריה</CardTitle>
                <CardDescription>התפלגות ההוצאות החודשיות</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {expenseCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>הוצאות לפי קטגוריה</CardTitle>
                <CardDescription>פירוט כמותי של ההוצאות</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseCategoryData.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm font-medium">{category.category}</span>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold">{formatCurrency(category.amount)}</div>
                        <div className="text-xs text-muted-foreground">{category.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>אחוזי גבייה</CardTitle>
                <CardDescription>מעקב יעילות הגבייה לאורך זמן</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[70, 100]} />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                    <Bar 
                      dataKey="rentCollection" 
                      fill="hsl(var(--primary))"
                      name="אחוז גבייה"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>שיעור תפוסה</CardTitle>
                <CardDescription>מעקב תפוסת הנכסים</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[85, 100]} />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                    <Bar 
                      dataKey="occupancyRate" 
                      fill="hsl(var(--secondary))"
                      name="שיעור תפוסה"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            תובנות אוטומטיות
          </CardTitle>
          <CardDescription>המלצות מבוססות נתונים לשיפור הביצועים</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incomeTrend < -5 && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <TrendingDown className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-medium text-destructive">ירידה בהכנסות</h4>
                  <p className="text-sm text-muted-foreground">
                    ההכנסות ירדו ב-{formatPercentage(Math.abs(incomeTrend))} מהחודש הקודם. 
                    בדוק שיעורי גבייה ותפוסה.
                  </p>
                </div>
              </div>
            )}
            
            {expenseTrend > 10 && (
              <div className="flex items-start gap-3 p-4 bg-orange-100 border border-orange-200 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800">עלייה בהוצאות</h4>
                  <p className="text-sm text-muted-foreground">
                    ההוצאות עלו ב-{formatPercentage(expenseTrend)} מהחודש הקודם. 
                    בדוק הוצאות תחזוקה וניהול.
                  </p>
                </div>
              </div>
            )}
            
            {lastMonth?.rentCollection && lastMonth.rentCollection < 90 && (
              <div className="flex items-start gap-3 p-4 bg-yellow-100 border border-yellow-200 rounded-lg">
                <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">אחוז גבייה נמוך</h4>
                  <p className="text-sm text-muted-foreground">
                    אחוז הגבייה החודשי ({formatPercentage(lastMonth.rentCollection)}) 
                    מתחת לממוצע. שקול שיפור תהליכי הגבייה.
                  </p>
                </div>
              </div>
            )}
            
            {profitTrend > 15 && (
              <div className="flex items-start gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <h4 className="font-medium text-success">ביצועים מצוינים</h4>
                  <p className="text-sm text-muted-foreground">
                    הרווח עלה ב-{formatPercentage(profitTrend)} מהחודש הקודם. 
                    הביצועים הכספיים בשיפור מתמיד.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};