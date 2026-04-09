import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';

interface LeadData {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  source?: string;
}

export const notifyNewLead = async (leadData: LeadData): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke('notify-new-lead', {
      body: {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone || undefined,
        message: leadData.message,
        source: leadData.source || 'אתר האינטרנט',
      },
    });

    if (error) {
      logger.error('Failed to send lead notification:', error);
    } else {
      logger.info('Lead notification sent successfully');
    }
  } catch (error) {
    // Don't throw - notification failure shouldn't break the form submission
    logger.error('Error sending lead notification:', error);
  }
};
