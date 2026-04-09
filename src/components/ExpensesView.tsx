import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Receipt, 
  TrendingDown, 
  Calendar,
  DollarSign,
  PieChart,
  Trash2
} from 'lucide-react';
import type { PropertyWithTenant } from '@/types/owner-portal';
import { format } from 'date-fns';
import { logger } from '@/utils/logger';

interface ExpensesViewProps {
  properties: PropertyWithTenant[];
}

interface Expense {
  id: string;
  property_id: string;
  category: string;
  amount: number;
  description: string;
  transaction_date: string;
  receipt_url?: string;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ properties }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'month' | 'year' | 'all'>('month');

  useEffect(() => {
    loadExpenses();
  }, [selectedProperty, dateRange, user]);

  const loadExpenses = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('financial_records')
        .select('*')
        .eq('type', 'expense')
        .order('transaction_date', { ascending: false });

      // Filter by property
      if (selectedProperty !== 'all') {
        query = query.eq('property_id', selectedProperty);
      } else {
        const propertyIds = properties.map(p => p.id);
        query = query.in('property_id', propertyIds);
      }

      // Filter by date range
      const now = new Date();
      if (dateRange === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        query = query.gte('transaction_date', startOfMonth.toISOString());
      } else if (dateRange === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        query = query.gte('transaction_date', startOfYear.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      logger.error('Error loading expenses:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את ההוצאות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('financial_records')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      toast({
        title: 'הצלחה',
        description: 'ההוצאה נמחקה בהצלחה',
      });
      
      loadExpenses();
    } catch (error) {
      logger.error('Error deleting expense:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה במחיקת ההוצאה',
        variant: 'destructive',
      });
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
    return acc;
  }, {} as Record<string, number>);

  const categoryColors: Record<string, string> = {
    'תחזוקה': 'bg-blue-500',
    'ארנונה': 'bg-purple-500',
    'ביטוח': 'bg-green-500',
    'שיפוצים': 'bg-orange-500',
    'ניהול': 'bg-pink-500',
    'אחר': 'bg-gray-500',
  };

  const getCategoryTranslation = (category: string) => {
    const translations: Record<string, string> = {
      'maintenance': 'תחזוקה',
      'tax': 'ארנונה',
      'insurance': 'ביטוח',
      'renovation': 'שיפוצים',
      'management': 'ניהול',
      'other': 'אחר',
    };
    return translations[category] || category;
  };

  const selectedPropertyData = properties.find(p => p.id === selectedProperty);

  return (
    <div dir="rtl" className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            תצוגת הוצאות
          </CardTitle>
          <CardDescription>
            ניהול והצגת הוצאות הנכסים שלך
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="בחר נכס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הנכסים</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="תקופה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">חודש נוכחי</SelectItem>
                <SelectItem value="year">שנה נוכחית</SelectItem>
                <SelectItem value="all">כל התקופה</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-500" />
              סך הכל הוצאות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              ₪{totalExpenses.toLocaleString('he-IL')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {expenses.length} הוצאות
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              ממוצע חודשי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ₪{dateRange === 'year' 
                ? Math.round(totalExpenses / 12).toLocaleString('he-IL')
                : totalExpenses.toLocaleString('he-IL')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              לפי {dateRange === 'month' ? 'חודש נוכחי' : dateRange === 'year' ? 'שנה נוכחית' : 'כל התקופה'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              קטגוריה מובילה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Object.entries(expensesByCategory).length > 0
                ? getCategoryTranslation(
                    Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0][0]
                  )
                : 'אין נתונים'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {Object.entries(expensesByCategory).length > 0
                ? `₪${Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0][1].toLocaleString('he-IL')}`
                : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            פילוח לפי קטגוריות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(expensesByCategory).map(([category, amount]) => {
              const percentage = (amount / totalExpenses) * 100;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{getCategoryTranslation(category)}</span>
                    <span className="text-sm text-muted-foreground">
                      ₪{amount.toLocaleString('he-IL')} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`${categoryColors[getCategoryTranslation(category)] || 'bg-gray-500'} h-2 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>הוצאות אחרונות</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">טוען הוצאות...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">אין הוצאות להצגה</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => {
                const property = properties.find(p => p.id === expense.property_id);
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{getCategoryTranslation(expense.category)}</span>
                        {selectedProperty === 'all' && (
                          <span className="text-xs text-muted-foreground">
                            • {property?.address}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{expense.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(expense.transaction_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-left">
                        <p className="text-lg font-bold text-red-600">
                          -₪{Number(expense.amount).toLocaleString('he-IL')}
                        </p>
                        {expense.receipt_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(expense.receipt_url, '_blank')}
                            className="mt-1"
                          >
                            צפה בקבלה
                          </Button>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
