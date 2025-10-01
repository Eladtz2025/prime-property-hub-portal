import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Receipt, Wrench, Home, Car, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { AddExpenseModal } from './AddExpenseModal';
import { useExpenseData } from '@/hooks/useExpenseData';

interface ExpenseTrackerProps {
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  properties: any[];
}

const expenseCategories = [
  { value: 'maintenance', label: 'תחזוקה', icon: Wrench, color: 'bg-orange-500' },
  { value: 'utilities', label: 'חשמל ומים', icon: Home, color: 'bg-blue-500' },
  { value: 'insurance', label: 'ביטוח', icon: Receipt, color: 'bg-green-500' },
  { value: 'taxes', label: 'מיסים', icon: Calculator, color: 'bg-purple-500' },
  { value: 'management', label: 'ניהול', icon: Car, color: 'bg-gray-500' },
  { value: 'other', label: 'אחר', icon: Receipt, color: 'bg-gray-400' }
];

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ dateRangeStart, dateRangeEnd, properties }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');

  const { expenses, expenseSummary, isLoading, refetch } = useExpenseData(dateRangeStart, dateRangeEnd);

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  const getCategoryInfo = (category: string) => {
    return expenseCategories.find(cat => cat.value === category) || expenseCategories[5];
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    const matchesProperty = selectedProperty === 'all' || expense.property_id === selectedProperty;
    
    return matchesSearch && matchesCategory && matchesProperty;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען נתוני הוצאות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">סה"כ הוצאות החודש</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(expenseSummary.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenseSummary.expenseCount} הוצאות
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">קטגוריית הוצאה מובילה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {expenseSummary.topCategory ? getCategoryInfo(expenseSummary.topCategory).label : 'אין נתונים'}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenseSummary.topCategoryAmount ? formatCurrency(expenseSummary.topCategoryAmount) : '₪0'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ממוצע הוצאה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {formatCurrency(expenseSummary.averageExpense)}
            </div>
            <p className="text-xs text-muted-foreground">
              לפי הוצאה
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="חיפוש הוצאות..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 w-full sm:w-[200px]"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הקטגוריות</SelectItem>
              {expenseCategories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="נכס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הנכסים</SelectItem>
              {properties.map(property => (
                <SelectItem key={property.id} value={property.id}>
                  {property.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          הוספת הוצאה
        </Button>
      </div>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>רשימת הוצאות</CardTitle>
          <CardDescription>
            {expenseSummary.totalExpenses > 0 
              ? `סה"כ ${expenseSummary.expenseCount} הוצאות`
              : 'אין הוצאות להצגה'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">אין הוצאות</h3>
              <p className="text-muted-foreground mb-4">
                {expenses.length === 0 
                  ? 'לא נמצאו הוצאות לחודש זה'
                  : 'לא נמצאו הוצאות התואמות את הסינון'
                }
              </p>
              <Button onClick={() => setIsAddModalOpen(true)} variant="outline">
                הוסף הוצאה ראשונה
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => {
                const categoryInfo = getCategoryInfo(expense.category);
                const property = properties.find(p => p.id === expense.property_id);
                const Icon = categoryInfo.icon;

                return (
                  <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${categoryInfo.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">{expense.description || categoryInfo.label}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{property?.address}</span>
                          <span>•</span>
                          <span>{format(new Date(expense.transaction_date), 'dd/MM/yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-semibold text-red-600">
                        -{formatCurrency(expense.amount)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {categoryInfo.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        properties={properties}
        onSuccess={() => {
          refetch();
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
};