import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/utils/logger";

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export const useActivityLogs = (limit = 50) => {
  const { user, hasPermission } = useAuth();

  const {
    data: activities = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['activity-logs', user?.id, limit],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const canViewAll = hasPermission('users', 'read');
      
      let query = supabase
        .from('activity_logs')
        .select(`
          id,
          user_id,
          action,
          resource_type,
          resource_id,
          details,
          ip_address,
          user_agent,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      // If user can't view all logs, only show their own
      if (!canViewAll) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch activity logs', error, 'useActivityLogs');
        throw error;
      }

      return data as ActivityLog[];
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  return {
    activities,
    isLoading,
    error,
    refetch
  };
};