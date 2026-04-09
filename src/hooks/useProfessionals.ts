import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface Professional {
  id: string;
  name: string;
  profession: string;
  phone: string | null;
  area: string | null;
  notes: string | null;
  website: string | null;
  coupon_code: string | null;
  name_en: string | null;
  area_en: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type NewProfessional = Omit<Professional, 'id' | 'created_at' | 'updated_at' | 'created_by'>;

export const useProfessionals = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('professionals_list')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProfessionals((data as Professional[]) || []);
    } catch (error) {
      logger.error('Error fetching professionals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfessionals(); }, []);

  const addProfessional = async (professional: NewProfessional) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('professionals_list')
        .insert({ ...professional, created_by: user?.id } as any);
      if (error) throw error;
      toast.success('איש המקצוע נוסף בהצלחה');
      fetchProfessionals();
    } catch (error) {
      logger.error('Error adding professional:', error);
      toast.error('שגיאה בהוספה');
    }
  };

  const updateProfessional = async (id: string, updates: Partial<NewProfessional>) => {
    try {
      const { error } = await supabase
        .from('professionals_list')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
      toast.success('הפרטים עודכנו');
      fetchProfessionals();
    } catch (error) {
      logger.error('Error updating professional:', error);
      toast.error('שגיאה בעדכון');
    }
  };

  const deleteProfessional = async (id: string) => {
    try {
      const { error } = await supabase
        .from('professionals_list')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('איש המקצוע נמחק');
      fetchProfessionals();
    } catch (error) {
      logger.error('Error deleting professional:', error);
      toast.error('שגיאה במחיקה');
    }
  };

  return { professionals, loading, addProfessional, updateProfessional, deleteProfessional, refetch: fetchProfessionals };
};
