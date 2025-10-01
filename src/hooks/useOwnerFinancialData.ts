import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInMonths, startOfMonth, startOfYear } from 'date-fns';

export type DateRangeType = 'current-month' | 'from-contract' | 'next-year';

interface PropertyFinancialData {
  property_id: string;
  property_address: string;
  monthly_rent: number;
  tenant_name: string;
  lease_start_date: string;
}

interface ExpenseData {
  id: string;
  property_id: string;
  amount: number;
  transaction_date: string;
  category: string;
  description: string;
}

export interface FinancialSummary {
  totalExpectedIncome: number;
  totalActualIncome: number;
  totalExpenses: number;
  netProfit: number;
  propertyCount: number;
}

export const useOwnerFinancialData = (dateRangeType: DateRangeType = 'current-month') => {
  const { user } = useAuth();

  // Fetch properties with tenants
  const propertiesQuery = useQuery({
    queryKey: ['owner-financial-properties', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // First, get property IDs for this owner
      const { data: ownerProperties, error: ownerError } = await supabase
        .from('property_owners')
        .select('property_id')
        .eq('owner_id', user.id);

      if (ownerError) throw ownerError;
      
      const propertyIds = ownerProperties?.map(p => p.property_id) || [];
      
      if (propertyIds.length === 0) {
        return [];
      }

      // Then fetch properties with tenants
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          address,
          city,
          tenants!inner (
            name,
            monthly_rent,
            lease_start_date,
            is_active
          )
        `)
        .in('id', propertyIds)
        .eq('tenants.is_active', true);

      if (error) throw error;

      return (data || []).flatMap(p => 
        p.tenants.map(t => ({
          property_id: p.id,
          property_address: p.address,
          monthly_rent: t.monthly_rent || 0,
          tenant_name: t.name,
          lease_start_date: t.lease_start_date
        }))
      ) as PropertyFinancialData[];
    },
    enabled: !!user,
    staleTime: 60000,
  });

  // Fetch rent payments
  const paymentsQuery = useQuery({
    queryKey: ['owner-rent-payments', user?.id, dateRangeType],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('rent_payments')
        .select('id, amount, payment_date, status, property_id')
        .eq('created_by', user.id);

      // Apply date filters based on range type
      if (dateRangeType === 'current-month') {
        const monthStart = startOfMonth(new Date()).toISOString().split('T')[0];
        query = query.gte('payment_date', monthStart);
      }
      // For 'from-contract', fetch all payments

      const { data, error } = await query.order('payment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Fetch expenses
  const expensesQuery = useQuery({
    queryKey: ['owner-expenses', user?.id, dateRangeType],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('financial_records')
        .select('id, property_id, amount, transaction_date, category, description')
        .eq('type', 'expense')
        .eq('created_by', user.id);

      // Apply date filters based on range type
      if (dateRangeType === 'current-month') {
        const monthStart = startOfMonth(new Date()).toISOString().split('T')[0];
        query = query.gte('transaction_date', monthStart);
      }
      // For 'from-contract', fetch all expenses

      const { data, error } = await query.order('transaction_date', { ascending: false });

      if (error) throw error;
      return (data || []) as ExpenseData[];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Calculate financial summary
  const financialSummary: FinancialSummary = (() => {
    const properties = propertiesQuery.data || [];
    const payments = paymentsQuery.data || [];
    const expenses = expensesQuery.data || [];

    let totalExpectedIncome = 0;
    const now = new Date();

    // Calculate expected income based on date range
    properties.forEach(prop => {
      if (!prop.monthly_rent || !prop.lease_start_date) return;

      const leaseStart = new Date(prop.lease_start_date);
      
      if (dateRangeType === 'from-contract') {
        // From lease start until today
        const monthsActive = Math.max(0, differenceInMonths(now, leaseStart) + 1);
        totalExpectedIncome += prop.monthly_rent * monthsActive;
      } else if (dateRangeType === 'current-month') {
        // Just this month
        totalExpectedIncome += prop.monthly_rent;
      } else if (dateRangeType === 'next-year') {
        // Next year - 12 months
        totalExpectedIncome += prop.monthly_rent * 12;
      }
    });

    // Calculate actual income from payments
    const totalActualIncome = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Net profit = actual income - expenses
    const netProfit = totalActualIncome - totalExpenses;

    return {
      totalExpectedIncome,
      totalActualIncome,
      totalExpenses,
      netProfit,
      propertyCount: properties.length
    };
  })();

  return {
    properties: propertiesQuery.data || [],
    payments: paymentsQuery.data || [],
    expenses: expensesQuery.data || [],
    financialSummary,
    isLoading: propertiesQuery.isLoading || paymentsQuery.isLoading || expensesQuery.isLoading,
    isError: propertiesQuery.isError || paymentsQuery.isError || expensesQuery.isError,
    refetch: () => {
      propertiesQuery.refetch();
      paymentsQuery.refetch();
      expensesQuery.refetch();
    }
  };
};
