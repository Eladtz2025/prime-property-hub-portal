import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/utils/logger";

export type ActivityAction = 
  | 'login'
  | 'logout'
  | 'property_created'
  | 'property_updated'
  | 'property_deleted'
  | 'contact_made'
  | 'whatsapp_sent'
  | 'user_approved'
  | 'user_role_changed'
  | 'profile_updated'
  | 'search_performed'
  | 'export_data'
  | 'bulk_action';

export type ResourceType = 
  | 'property'
  | 'user'
  | 'contact'
  | 'search'
  | 'system'
  | 'auth';

interface LogActivityParams {
  action: ActivityAction;
  resourceType: ResourceType;
  resourceId?: string;
  details?: Record<string, any>;
}

export const useActivityLogger = () => {
  const { user } = useAuth();

  const logActivity = async ({
    action,
    resourceType,
    resourceId,
    details = {}
  }: LogActivityParams) => {
    if (!user) {
      logger.warn('Attempted to log activity without authenticated user', { action, resourceType });
      return;
    }

    try {
      // Get client info
      const userAgent = navigator.userAgent;
      
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          user_agent: userAgent
        });

      if (error) {
        logger.error('Failed to log activity', error, 'useActivityLogger');
      } else {
        logger.debug(`Activity logged: ${action} on ${resourceType}`, details, 'useActivityLogger');
      }
    } catch (error) {
      logger.error('Error logging activity', error, 'useActivityLogger');
    }
  };

  return { logActivity };
};