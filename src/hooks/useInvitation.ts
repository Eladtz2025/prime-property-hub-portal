import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface InvitationData {
  id: string;
  email: string;
  property_ids: string[];
  expires_at: string;
  invited_by: string;
}

export const useInvitation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInvitationByToken = async (token: string): Promise<InvitationData | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('property_invitations')
        .select('*')
        .eq('invitation_token', token)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .single();

      if (error) {
        logger.error('Error fetching invitation:', error);
        setError('הזמנה לא נמצאה או פגה תוקפה');
        return null;
      }

      return data as InvitationData;
    } catch (err) {
      logger.error('Unexpected error fetching invitation:', err);
      setError('שגיאה בטעינת ההזמנה');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (token: string) => {
    try {
      setLoading(true);
      setError(null);

      // Call the database function to accept the invitation
      const { data, error } = await supabase.rpc('accept_property_invitation', {
        invitation_token: token
      });

      if (error) {
        logger.error('Error accepting invitation:', error);
        setError('שגיאה בקבלת ההזמנה');
        return { success: false };
      }

      const result = data as { success: boolean; error?: string; properties_assigned?: number };
      
      if (!result.success) {
        setError(result.error || 'שגיאה בקבלת ההזמנה');
        return { success: false };
      }

      logger.info('Invitation accepted successfully', data);
      return { success: true, data };
    } catch (err) {
      logger.error('Unexpected error accepting invitation:', err);
      setError('שגיאה בקבלת ההזמנה');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getInvitationByToken,
    acceptInvitation
  };
};