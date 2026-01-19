import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface PriorityTask {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  is_completed: boolean;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  created_by: string | null;
}

export const usePriorityTasks = () => {
  const [tasks, setTasks] = useState<PriorityTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('priority_tasks')
        .select('*')
        .order('is_completed', { ascending: true })
        .order('priority', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (title: string, priority: number, dueDate?: string, description?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('priority_tasks')
        .insert({
          title,
          priority,
          due_date: dueDate || null,
          description: description || null,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => [...prev, data].sort((a, b) => {
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        return a.priority - b.priority;
      }));
      
      toast({ title: 'משימה נוספה בהצלחה' });
      return data;
    } catch (error) {
      console.error('Error adding task:', error);
      toast({ title: 'שגיאה בהוספת משימה', variant: 'destructive' });
    }
  };

  const updateTask = async (id: string, updates: Partial<PriorityTask>) => {
    try {
      const { error } = await supabase
        .from('priority_tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ).sort((a, b) => {
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        return a.priority - b.priority;
      }));
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'שגיאה בעדכון משימה', variant: 'destructive' });
    }
  };

  const toggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const updates = {
      is_completed: !task.is_completed,
      completed_at: !task.is_completed ? new Date().toISOString() : null
    };

    await updateTask(id, updates);
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('priority_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTasks(prev => prev.filter(task => task.id !== id));
      toast({ title: 'משימה נמחקה' });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({ title: 'שגיאה במחיקת משימה', variant: 'destructive' });
    }
  };

  const reorderTasks = async (taskId: string, newPriority: number) => {
    await updateTask(taskId, { priority: newPriority });
  };

  return {
    tasks,
    isLoading,
    addTask,
    updateTask,
    toggleComplete,
    deleteTask,
    reorderTasks,
    refetch: fetchTasks
  };
};
