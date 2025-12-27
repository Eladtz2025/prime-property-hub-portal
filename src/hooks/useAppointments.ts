import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Appointment {
  id: string;
  property_id: string | null;
  title: string | null;
  client_name: string;
  client_phone: string | null;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  notes: string | null;
  assigned_to: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  properties?: {
    address: string;
    city: string;
  } | null;
}

export const useAppointments = (propertyId?: string) => {
  const queryClient = useQueryClient();

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['appointments', propertyId],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          properties (
            address,
            city
          )
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Appointment[];
    }
  });

  const addAppointment = useMutation({
    mutationFn: async (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'properties'>) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointment as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-appointments'] });
      toast.success('הפגישה נוספה בהצלחה');
    },
    onError: (error) => {
      console.error('Error adding appointment:', error);
      toast.error('שגיאה בהוספת הפגישה');
    }
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-appointments'] });
      toast.success('הפגישה עודכנה בהצלחה');
    },
    onError: (error) => {
      console.error('Error updating appointment:', error);
      toast.error('שגיאה בעדכון הפגישה');
    }
  });

  const cancelAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-appointments'] });
      toast.success('הפגישה בוטלה');
    },
    onError: (error) => {
      console.error('Error cancelling appointment:', error);
      toast.error('שגיאה בביטול הפגישה');
    }
  });

  return {
    appointments,
    isLoading,
    error,
    addAppointment,
    updateAppointment,
    cancelAppointment
  };
};
