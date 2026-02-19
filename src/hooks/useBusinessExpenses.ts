import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BusinessExpense {
  id: string;
  category: string;
  description: string | null;
  amount: number | null;
  frequency: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type NewBusinessExpense = Omit<BusinessExpense, 'id' | 'created_at' | 'updated_at' | 'created_by'>;

export const useBusinessExpenses = () => {
  const [expenses, setExpenses] = useState<BusinessExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('business_expenses_list')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setExpenses((data as BusinessExpense[]) || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const addExpense = async (expense: NewBusinessExpense) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('business_expenses_list')
        .insert({ ...expense, created_by: user?.id } as any);
      if (error) throw error;
      toast.success('ההוצאה נוספה בהצלחה');
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('שגיאה בהוספת הוצאה');
    }
  };

  const updateExpense = async (id: string, updates: Partial<NewBusinessExpense>) => {
    try {
      const { error } = await supabase
        .from('business_expenses_list')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
      toast.success('ההוצאה עודכנה');
      fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('שגיאה בעדכון');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('business_expenses_list')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('ההוצאה נמחקה');
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('שגיאה במחיקה');
    }
  };

  return { expenses, loading, addExpense, updateExpense, deleteExpense, refetch: fetchExpenses };
};
