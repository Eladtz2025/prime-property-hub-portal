import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { startOfMonth, endOfMonth, format, differenceInMonths } from 'date-fns';
import { useExpenseData } from './useExpenseData';

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

export const useFinancialData = (startDate?: Date, endDate?: Date, fromContract: boolean = false) => {
  const { user } = useAuth();
  const queryStart = startDate || new Date('2000-01-01'); // Very old date for "all time"
  const queryEnd = endDate || new Date();

  // Get expense data for the range
  const { expenseSummary } = useExpenseData(startDate, endDate);

  // Fetch rent payments for the selected date range
  const rentPaymentsQuery = useQuery({
    queryKey: ['rent-payments', user?.id, queryStart.toISOString(), queryEnd.toISOString()],
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
        .gte('payment_date', queryStart.toISOString().split('T')[0])
        .lte('payment_date', queryEnd.toISOString().split('T')[0])
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
            property_id,
            lease_start_date
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
  const financialSummary: FinancialSummary = (() => {
    const payments = rentPaymentsQuery.data || [];
    const properties = propertiesQuery.data || [];
    
    // Calculate expected income based on date range
    let expectedIncome = 0;
    
    if (fromContract) {
      // Calculate total income from contract start to today
      properties.flatMap(p => p.tenants).filter(t => t.is_active && t.monthly_rent && t.lease_start_date).forEach(tenant => {
        const leaseStart = new Date(tenant.lease_start_date);
        const today = queryEnd;
        const monthsActive = Math.max(0, differenceInMonths(today, leaseStart) + 1);
        expectedIncome += (tenant.monthly_rent || 0) * monthsActive;
      });
    } else {
      // For current month/year, calculate monthly rent * months in range
      const monthsInRange = differenceInMonths(queryEnd, queryStart) + 1;
      properties.flatMap(p => p.tenants).filter(t => t.is_active && t.monthly_rent).forEach(tenant => {
        expectedIncome += (tenant.monthly_rent || 0) * monthsInRange;
      });
    }
    
    // Calculate collected income from paid rent payments
    const collectedIncome = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    // Calculate pending and overdue
    const pendingIncome = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const overdueIncome = payments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + p.amount, 0);
    
    // Total income includes both collected and expected income from active tenants
    // If there are no rent_payments records, we show expected income
    const totalIncome = payments.length > 0 
      ? collectedIncome + pendingIncome + overdueIncome
      : expectedIncome;
    
    const collectionRate = expectedIncome > 0 
      ? (collectedIncome / expectedIncome) * 100 
      : 0;
    
    return {
      totalIncome,
      totalExpenses: expenseSummary.totalExpenses,
      netProfit: totalIncome - expenseSummary.totalExpenses,
      collectionRate,
      activeProperties: properties.filter(p => p.tenants.some(t => t.is_active)).length,
      activeTenants: properties.flatMap(p => p.tenants).filter(t => t.is_active).length
    };
  })();

  // Calculate income by property
  const incomeByProperty: PropertyIncomeData[] = (propertiesQuery.data || []).map(property => {
    const activeTenants = property.tenants.filter(t => t.is_active);
    const expectedIncome = activeTenants.reduce((sum, t) => sum + (t.monthly_rent || 0), 0);
    
    const propertyPayments = (rentPaymentsQuery.data || []).filter(p => p.property_id === property.id);
    
    // If no rent_payments exist but we have active tenants with rent, 
    // show expected income as collected (to display in the UI)
    const collectedIncome = propertyPayments.length > 0
      ? propertyPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
      : expectedIncome; // Show expected as collected if no payments recorded yet
    
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