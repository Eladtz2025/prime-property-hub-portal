import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DismissMatchParams {
  leadId: string;
  propertyId?: string;
  scoutedPropertyId?: string;
  reason?: string;
}

interface RestoreMatchParams {
  leadId: string;
  propertyId?: string;
  scoutedPropertyId?: string;
}

export const useDismissMatch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ leadId, propertyId, scoutedPropertyId, reason }: DismissMatchParams) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('dismissed_matches')
        .insert({
          lead_id: leadId,
          property_id: propertyId || null,
          scouted_property_id: scoutedPropertyId || null,
          dismissed_by: user?.user?.id || null,
          reason: reason || null,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer-matches', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['own-property-matches', variables.leadId] });
      toast({ title: 'הנכס הוסתר', description: 'הנכס לא יופיע יותר בתוצאות' });
    },
    onError: (error) => {
      console.error('Error dismissing match:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן להסתיר את הנכס', variant: 'destructive' });
    },
  });
};

export const useRestoreMatch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ leadId, propertyId, scoutedPropertyId }: RestoreMatchParams) => {
      let query = supabase
        .from('dismissed_matches')
        .delete()
        .eq('lead_id', leadId);

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      } else if (scoutedPropertyId) {
        query = query.eq('scouted_property_id', scoutedPropertyId);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer-matches', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['own-property-matches', variables.leadId] });
      toast({ title: 'הנכס שוחזר', description: 'הנכס יופיע שוב בתוצאות' });
    },
    onError: (error) => {
      console.error('Error restoring match:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לשחזר את הנכס', variant: 'destructive' });
    },
  });
};
