import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DashboardGoal {
  id: string;
  title: string;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useDashboardGoals() {
  const [goals, setGoals] = useState<DashboardGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    const { data, error } = await supabase
      .from('dashboard_goals' as any)
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching goals:', error);
      return;
    }
    setGoals((data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = async (title: string) => {
    const nextPosition = goals.length;
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('dashboard_goals' as any)
      .insert({ title, position: nextPosition, created_by: userData.user?.id } as any);

    if (error) {
      toast.error('שגיאה בהוספת מטרה');
      console.error(error);
      return;
    }
    toast.success('מטרה נוספה');
    fetchGoals();
  };

  const updateGoal = async (id: string, title: string) => {
    const { error } = await supabase
      .from('dashboard_goals' as any)
      .update({ title } as any)
      .eq('id', id);

    if (error) {
      toast.error('שגיאה בעדכון מטרה');
      console.error(error);
      return;
    }
    fetchGoals();
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase
      .from('dashboard_goals' as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('שגיאה במחיקת מטרה');
      console.error(error);
      return;
    }
    toast.success('מטרה נמחקה');
    fetchGoals();
  };

  return { goals, loading, addGoal, updateGoal, deleteGoal };
}
