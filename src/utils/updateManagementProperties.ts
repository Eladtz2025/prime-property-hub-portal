import { supabase } from '@/integrations/supabase/client';

export async function updateManagementPropertiesToElad() {
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({ 
        owner_name: 'אלעד צברי',
        owner_phone: '0545503055'
      })
      .eq('property_type', 'management')
      .is('owner_name', null)
      .select();

    if (error) {
      console.error('Error updating management properties:', error);
      return { success: false, error };
    }

    console.log(`Updated ${data?.length || 0} management properties`);
    return { success: true, updated: data?.length || 0, properties: data };
  } catch (error) {
    console.error('Failed to update:', error);
    return { success: false, error };
  }
}
