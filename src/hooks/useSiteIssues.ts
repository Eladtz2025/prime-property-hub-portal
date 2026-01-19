import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SiteIssue {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  status: 'pending' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  reported_by: string | null;
  created_at: string;
  resolved_at: string | null;
  created_by: string | null;
}

export const useSiteIssues = () => {
  const [issues, setIssues] = useState<SiteIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIssues = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('site_issues')
        .select('*')
        .order('status', { ascending: true })
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIssues(data as SiteIssue[]);
    } catch (error) {
      console.error('Error fetching site issues:', error);
      toast.error('שגיאה בטעינת הבעיות');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const addIssue = async (
    title: string, 
    description?: string, 
    imageUrl?: string, 
    reportedBy?: string,
    priority?: 'low' | 'medium' | 'high'
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('site_issues')
        .insert({
          title,
          description: description || null,
          image_url: imageUrl || null,
          reported_by: reportedBy || 'טלי',
          priority: priority || 'medium',
          created_by: userData.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setIssues(prev => [data as SiteIssue, ...prev]);
      toast.success('הבעיה נוספה בהצלחה');
      return data;
    } catch (error) {
      console.error('Error adding issue:', error);
      toast.error('שגיאה בהוספת הבעיה');
      return null;
    }
  };

  const updateStatus = async (id: string, status: 'pending' | 'in_progress' | 'resolved') => {
    try {
      const updates: Partial<SiteIssue> = { status };
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('site_issues')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setIssues(prev => prev.map(issue => 
        issue.id === id ? { ...issue, ...updates } : issue
      ));
      toast.success('הסטטוס עודכן');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('שגיאה בעדכון הסטטוס');
    }
  };

  const deleteIssue = async (id: string) => {
    try {
      const { error } = await supabase
        .from('site_issues')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIssues(prev => prev.filter(issue => issue.id !== id));
      toast.success('הבעיה נמחקה');
    } catch (error) {
      console.error('Error deleting issue:', error);
      toast.error('שגיאה במחיקת הבעיה');
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `site-issues/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('שגיאה בהעלאת התמונה');
      return null;
    }
  };

  return {
    issues,
    isLoading,
    addIssue,
    updateStatus,
    deleteIssue,
    uploadImage,
    refetch: fetchIssues
  };
};
