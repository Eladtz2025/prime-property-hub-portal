import { supabase } from '@/integrations/supabase/client';
import { enhancedToast } from '@/components/ui/toast-enhanced';

/**
 * Triggers an automatic scan for a project with a tracking URL.
 * Runs in the background — does not block the UI.
 */
export async function triggerAutoScan(propertyId: string) {
  try {
    enhancedToast.info('סריקה אוטומטית הופעלה...', {
      title: 'סריקת פרויקט',
    });

    const { data, error } = await supabase.functions.invoke('scout-project', {
      body: { property_id: propertyId },
    });

    if (error) throw error;

    const totalFound = data?.results?.[0]?.units_found ?? data?.summary?.totalFound ?? 0;

    enhancedToast.success(`סריקה הושלמה — נמצאו ${totalFound} יחידות`, {
      title: 'סריקת פרויקט',
    });
  } catch (err: any) {
    console.error('Auto scan failed:', err);
    enhancedToast.error('הסריקה נכשלה, ניתן להפעיל ידנית מאוחר יותר', {
      title: 'שגיאה בסריקה',
    });
  }
}
