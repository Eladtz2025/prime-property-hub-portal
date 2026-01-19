import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DevelopmentIdea {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  priority: string;
  created_at: string;
  completed_at: string | null;
  created_by: string | null;
}

export const useDevelopmentIdeas = () => {
  const [ideas, setIdeas] = useState<DevelopmentIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchIdeas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('development_ideas')
        .select('*')
        .order('is_completed', { ascending: true })
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIdeas(data || []);
    } catch (error) {
      console.error('Error fetching ideas:', error);
      toast.error('שגיאה בטעינת רעיונות');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const addIdea = useCallback(async (title: string, priority: string = 'medium') => {
    if (!user) {
      toast.error('יש להתחבר כדי להוסיף רעיון');
      return;
    }

    try {
      const { error } = await supabase
        .from('development_ideas')
        .insert({
          title,
          priority,
          created_by: user.id,
        });

      if (error) throw error;
      toast.success('רעיון נוסף בהצלחה');
      fetchIdeas();
    } catch (error) {
      console.error('Error adding idea:', error);
      toast.error('שגיאה בהוספת רעיון');
    }
  }, [user, fetchIdeas]);

  const updatePriority = useCallback(async (id: string, priority: string) => {
    try {
      const { error } = await supabase
        .from('development_ideas')
        .update({ priority })
        .eq('id', id);

      if (error) throw error;
      
      // Optimistic update
      setIdeas(prev => prev.map(idea => 
        idea.id === id ? { ...idea, priority } : idea
      ));
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('שגיאה בעדכון חשיבות');
      fetchIdeas();
    }
  }, [fetchIdeas]);

  const toggleComplete = useCallback(async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('development_ideas')
        .update({
          is_completed: !currentState,
          completed_at: !currentState ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;
      
      // Optimistic update
      setIdeas(prev => prev.map(idea => 
        idea.id === id 
          ? { 
              ...idea, 
              is_completed: !currentState,
              completed_at: !currentState ? new Date().toISOString() : null
            }
          : idea
      ));
    } catch (error) {
      console.error('Error toggling idea:', error);
      toast.error('שגיאה בעדכון רעיון');
      fetchIdeas();
    }
  }, [fetchIdeas]);

  const deleteIdea = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('development_ideas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Optimistic update
      setIdeas(prev => prev.filter(idea => idea.id !== id));
      toast.success('רעיון נמחק');
    } catch (error) {
      console.error('Error deleting idea:', error);
      toast.error('שגיאה במחיקת רעיון');
      fetchIdeas();
    }
  }, [fetchIdeas]);

  return {
    ideas,
    isLoading,
    addIdea,
    toggleComplete,
    deleteIdea,
    updatePriority,
    refetch: fetchIdeas,
  };
};
