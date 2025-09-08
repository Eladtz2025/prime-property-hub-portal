import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  collectionRate: number;
  activeProperties: number;
  activeTenants: number;
}

export interface RentPaymentData {
  id: string;
  tenant_id: string;
  property_id: string;
  amount: number;
  payment_date: string;
  due_date: string;
  status: string;
  payment_method: string;
  notes?: string;
}

export interface PropertyIncomeData {
  property_id: string;
  property_address: string;
  property_city: string;
  expected_income: number;
  collected_income: number;
  pending_income: number;
  overdue_income: number;
  tenant_count: number;
}

export const useFinancialData = (selectedMonth?: Date) => {
  const { user } = useAuth();
  const currentMonth = selectedMonth || new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Fetch rent payments for the selected month
  const rentPaymentsQuery = useQuery({
    queryKey: ['rent-payments', user?.id, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('rent_payments')
        .select(`
          id,
          tenant_id,
          property_id,
          amount,
          payment_date,
          due_date,
          status,
          payment_method,
          notes,
          tenants (
            name,
            property_id
          ),
          properties (
            id,
            address,
            city
          )
        `)
        .gte('payment_date', monthStart.toISOString().split('T')[0])
        .lte('payment_date', monthEnd.toISOString().split('T')[0])
        .order('payment_date', { ascending: false });

      if (error) {
        logger.error('Failed to fetch rent payments', error, 'useFinancialData');
        throw error;
      }

      return data as RentPaymentData[];
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  // Fetch owner's properties with tenant information
  const propertiesQuery = useQuery({
    queryKey: ['owner-properties-financial', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          address,
          city,
          tenants (
            id,
            name,
            monthly_rent,
            is_active,
            property_id
          )
        `)
        .order('address');

      if (error) {
        logger.error('Failed to fetch properties for financial data', error, 'useFinancialData');
        throw error;
      }

      return data;
    },
    enabled: !!user,
    staleTime: 60000, // 1 minute
  });

  // Calculate financial summary
  const financialSummary: FinancialSummary = {
    totalIncome: rentPaymentsQuery.data
      ?.filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0) || 0,
    
    totalExpenses: 0, // Will be implemented in Step 2
    
    netProfit: 0, // Will be calculated after expenses are implemented
    
    collectionRate: (() => {
      const payments = rentPaymentsQuery.data || [];
      const properties = propertiesQuery.data || [];
      
      const expectedIncome = properties
        .flatMap(p => p.tenants)
        .filter(t => t.is_active && t.monthly_rent)
        .reduce((sum, t) => sum + (t.monthly_rent || 0), 0);
      
      const collectedIncome = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      
      return expectedIncome > 0 ? (collectedIncome / expectedIncome) * 100 : 0;
    })(),
    
    activeProperties: propertiesQuery.data
      ?.filter(p => p.tenants.some(t => t.is_active)).length || 0,
    
    activeTenants: propertiesQuery.data
      ?.flatMap(p => p.tenants)
      .filter(t => t.is_active).length || 0
  };

  // Calculate income by property
  const incomeByProperty: PropertyIncomeData[] = (propertiesQuery.data || []).map(property => {
    const activeTenants = property.tenants.filter(t => t.is_active);
    const expectedIncome = activeTenants.reduce((sum, t) => sum + (t.monthly_rent || 0), 0);
    
    const propertyPayments = (rentPaymentsQuery.data || []).filter(p => p.property_id === property.id);
    
    const collectedIncome = propertyPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const pendingIncome = propertyPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const overdueIncome = propertyPayments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      property_id: property.id,
      property_address: property.address,
      property_city: property.city,
      expected_income: expectedIncome,
      collected_income: collectedIncome,
      pending_income: pendingIncome,
      overdue_income: overdueIncome,
      tenant_count: activeTenants.length
    };
  }).filter(item => item.expected_income > 0);

  return {
    // Data
    rentPayments: rentPaymentsQuery.data || [],
    properties: propertiesQuery.data || [],
    financialSummary,
    incomeByProperty,
    
    // Loading states
    isLoading: rentPaymentsQuery.isLoading || propertiesQuery.isLoading,
    isError: rentPaymentsQuery.isError || propertiesQuery.isError,
    error: rentPaymentsQuery.error || propertiesQuery.error,
    
    // Actions
    refetch: () => {
      rentPaymentsQuery.refetch();
      propertiesQuery.refetch();
    }
  };
};