import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  FileText,
  Download,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getOwnerProperties, getPropertyFinancials, createFinancialRecord } from '@/lib/owner-portal';
import { useToast } from '@/hooks/use-toast';
import type { PropertyWithTenant, FinancialRecord } from '@/types/owner-portal';

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  transactions: FinancialRecord[];
  monthlyBreakdown: {
    month: string;
    income: number;
    expenses: number;
    profit: number;
  }[];
}

export const FinancialReports: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<PropertyWithTenant[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    to: new Date().toISOString().split('T')[0] // Today
  });

  // New transaction form
  const [newTransaction, setNewTransaction] = useState({
    property_id: '',
    type: 'income' as 'income' | 'expense',
    category: '',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  const incomeCategories = [
    'שכירות',
    'פיקדון',
    'דמי ניהול',
    'הכנסה אחרת'
  ];

  const expenseCategories = [
    'תחזוקה',
    'ביטוח',
    'ארנונה',
    'דמי ניהול',
    'שיפוצים',
    'חשמל',
    'מים',
    'גז',
    'הוצאה אחרת'
  ];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedProperty, dateRange]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load user's properties
      const propertiesData = await getOwnerProperties(user.id);
      setProperties(propertiesData);

      // Load financial data
      let allTransactions: FinancialRecord[] = [];
      
      if (selectedProperty === 'all') {
        // Get all properties' financials
        const allFinancials = await Promise.all(
          propertiesData.map(property => getPropertyFinancials(property.id))
        );
        allTransactions = allFinancials.flat();
      } else {
        // Get specific property's financials
        allTransactions = await getPropertyFinancials(selectedProperty);
      }

      // Filter by date range
      const filteredTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.transaction_date);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        return transactionDate >= fromDate && transactionDate <= toDate;
      });

      // Calculate summary
      const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Create monthly breakdown
      const monthlyData = new Map<string, { income: number; expenses: number }>();
      
      filteredTransactions.forEach(transaction => {
        const monthKey = new Date(transaction.transaction_date).toISOString().slice(0, 7); // YYYY-MM
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { income: 0, expenses: 0 });
        }
        
        const monthData = monthlyData.get(monthKey)!;
        if (transaction.type === 'income') {
          monthData.income += transaction.amount;
        } else {
          monthData.expenses += transaction.amount;
        }
      });

      const monthlyBreakdown = Array.from(monthlyData.entries())
        .map(([month, data]) => ({
          month,
          income: data.income,
          expenses: data.expenses,
          profit: data.income - data.expenses,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setFinancialSummary({
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        transactions: filteredTransactions,
        monthlyBreakdown,
      });

    } catch (error) {
      console.error('Error loading financial data:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת הנתונים הפיננסיים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!user || !newTransaction.property_id || !newTransaction.amount) {
      toast({
        title: "שגיאה",
        description: "נא למלא את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await createFinancialRecord({
        property_id: newTransaction.property_id,
        type: newTransaction.type,
        category: newTransaction.category,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        transaction_date: newTransaction.transaction_date,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "רשומה נוספה",
        description: "הרשומה הפיננסית נוספה בהצלחה",
      });

      // Reset form
      setNewTransaction({
        property_id: '',
        type: 'income',
        category: '',
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
      setShowAddTransaction(false);
      
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בהוספת הרשומה",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  const formatMonth = (monthString: string) => {
    const date = new Date(monthString + '-01');
    return date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' });
  };

  const exportToCSV = () => {
    if (!financialSummary) return;

    const headers = ['תאריך', 'נכס', 'סוג', 'קטגוריה', 'סכום', 'תיאור'];
    const rows = financialSummary.transactions.map(transaction => {
      const property = properties.find(p => p.id === transaction.property_id);
      return [
        new Date(transaction.transaction_date).toLocaleDateString('he-IL'),
        property?.address || 'לא זמין',
        transaction.type === 'income' ? 'הכנסה' : 'הוצאה',
        transaction.category,
        transaction.amount.toString(),
        transaction.description || ''
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `financial-report-${dateRange.from}-${dateRange.to}.csv`;
    link.click();
  };

  if (loading && !financialSummary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען דוח פיננסי...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">דוחות פיננסיים</h1>
          <p className="text-muted-foreground">
            מעקב אחר הכנסות והוצאות הנכסים שלך
          </p>
        </div>
        <Button onClick={() => setShowAddTransaction(true)}>
          <Plus className="h-4 w-4 mr-2" />
          הוסף רשומה
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="property-filter">נכס</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue />
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
            </div>
            
            <div>
              <Label htmlFor="date-from">מתאריך</Label>
              <Input
                id="date-from"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="date-to">עד תאריך</Label>
              <Input
                id="date-to"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={exportToCSV} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                ייצא CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {financialSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">סה"כ הכנסות</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(financialSummary.totalIncome)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">סה"כ הוצאות</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(financialSummary.totalExpenses)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                  financialSummary.netProfit >= 0 ? 'bg-blue-100' : 'bg-red-100'
                }`}>
                  <DollarSign className={`h-6 w-6 ${
                    financialSummary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">רווח נקי</p>
                  <p className={`text-2xl font-bold ${
                    financialSummary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(financialSummary.netProfit)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Breakdown */}
      {financialSummary && financialSummary.monthlyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>פירוט חודשי</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financialSummary.monthlyBreakdown.map((month) => (
                <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="font-medium">{formatMonth(month.month)}</div>
                  <div className="flex gap-6 text-sm">
                    <div className="text-green-600">
                      הכנסות: {formatCurrency(month.income)}
                    </div>
                    <div className="text-red-600">
                      הוצאות: {formatCurrency(month.expenses)}
                    </div>
                    <div className={`font-medium ${
                      month.profit >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      רווח: {formatCurrency(month.profit)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      {financialSummary && (
        <Card>
          <CardHeader>
            <CardTitle>רשומות אחרונות ({financialSummary.transactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {financialSummary.transactions
                .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
                .slice(0, 20)
                .map((transaction) => {
                  const property = properties.find(p => p.id === transaction.property_id);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                          {transaction.type === 'income' ? 'הכנסה' : 'הוצאה'}
                        </Badge>
                        <div>
                          <p className="font-medium">{transaction.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {property?.address} • {new Date(transaction.transaction_date).toLocaleDateString('he-IL')}
                          </p>
                          {transaction.description && (
                            <p className="text-xs text-muted-foreground">{transaction.description}</p>
                          )}
                        </div>
                      </div>
                      <div className={`font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  );
                })}
              
              {financialSummary.transactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p>אין רשומות פיננסיות בטווח התאריכים הנבחר</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>הוסף רשומה פיננסית</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="transaction-property">נכס</Label>
                <Select 
                  value={newTransaction.property_id} 
                  onValueChange={(value) => setNewTransaction(prev => ({ ...prev, property_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר נכס" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="transaction-type">סוג</Label>
                <Select 
                  value={newTransaction.type} 
                  onValueChange={(value: 'income' | 'expense') => setNewTransaction(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">הכנסה</SelectItem>
                    <SelectItem value="expense">הוצאה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="transaction-category">קטגוריה</Label>
                <Select 
                  value={newTransaction.category} 
                  onValueChange={(value) => setNewTransaction(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    {(newTransaction.type === 'income' ? incomeCategories : expenseCategories).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="transaction-amount">סכום</Label>
                <Input
                  id="transaction-amount"
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="transaction-date">תאריך</Label>
                <Input
                  id="transaction-date"
                  type="date"
                  value={newTransaction.transaction_date}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, transaction_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="transaction-description">תיאור (אופציונלי)</Label>
                <Input
                  id="transaction-description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="תיאור הרשומה"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddTransaction} className="flex-1">
                  הוסף רשומה
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddTransaction(false)}
                  className="flex-1"
                >
                  בטל
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};