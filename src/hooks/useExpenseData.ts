import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface ExpenseData {
  id: string;
  property_id: string;
  type: string;
  category: string;
  amount: number;
  transaction_date: string;
  description?: string;
  created_by: string;
  created_at: string;
}

export interface ExpenseSummary {
  totalExpenses: number;
  expenseCount: number;
  topCategory: string;
  topCategoryAmount: number;
  averageExpense: number;
  categorySummary: Record<string, number>;
}

export const useExpenseData = (selectedMonth?: Date) => {
  const { user } = useAuth();
  const currentMonth = selectedMonth || new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Fetch expenses for the selected month
  const expensesQuery = useQuery({
    queryKey: ['expenses', user?.id, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('financial_records')
        .select(`
          id,
          property_id,
          type,
          category,
          amount,
          transaction_date,
          description,
          created_by,
          created_at,
          properties (
            id,
            address,
            city
          )
        `)
        .eq('type', 'expense')
        .gte('transaction_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('transaction_date', format(monthEnd, 'yyyy-MM-dd'))
        .order('transaction_date', { ascending: false });

      if (error) {
        logger.error('Failed to fetch expenses', error, 'useExpenseData');
        throw error;
      }

      return data as ExpenseData[];
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  // Calculate expense summary
  const expenseSummary: ExpenseSummary = (() => {
    const expenses = expensesQuery.data || [];
    
    if (expenses.length === 0) {
      return {
        totalExpenses: 0,
        expenseCount: 0,
        topCategory: '',
        topCategoryAmount: 0,
        averageExpense: 0,
        categorySummary: {}
      };
    }

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expenseCount = expenses.length;
    
    // Calculate category summary
    const categorySummary = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Find top category
    const topCategoryEntry = Object.entries(categorySummary)
      .sort(([,a], [,b]) => b - a)[0];
    
    const topCategory = topCategoryEntry?.[0] || '';
    const topCategoryAmount = topCategoryEntry?.[1] || 0;

    return {
      totalExpenses,
      expenseCount,
      topCategory,
      topCategoryAmount,
      averageExpense: totalExpenses / expenseCount,
      categorySummary
    };
  })();

  return {
    // Data
    expenses: expensesQuery.data || [],
    expenseSummary,
    
    // Loading states
    isLoading: expensesQuery.isLoading,
    isError: expensesQuery.isError,
    error: expensesQuery.error,
    
    // Actions
    refetch: expensesQuery.refetch
  };
};