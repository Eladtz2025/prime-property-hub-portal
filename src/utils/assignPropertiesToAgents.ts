import { supabase } from '@/integrations/supabase/client';

export async function assignPropertiesToAgents() {
  try {
    // Assign vacant properties to Tali
    const { data: vacantData, error: vacantError } = await supabase
      .from('properties')
      .update({ assigned_user_id: '30300ca7-6c59-41e4-99dd-ef59ea3ea349' })
      .eq('status', 'vacant')
      .select();

    if (vacantError) {
      console.error('Error assigning vacant properties to Tali:', vacantError);
      return { success: false, error: vacantError };
    }

    // Assign all other properties to Elad
    const { data: otherData, error: otherError } = await supabase
      .from('properties')
      .update({ assigned_user_id: 'bfd1625c-7bb5-424f-8969-966cbbdd00ef' })
      .neq('status', 'vacant')
      .select();

    if (otherError) {
      console.error('Error assigning other properties to Elad:', otherError);
      return { success: false, error: otherError };
    }

    console.log(`✅ הוקצו ${vacantData?.length || 0} נכסים פנויים לטלי`);
    console.log(`✅ הוקצו ${otherData?.length || 0} נכסים לאלעד`);

    return {
      success: true,
      vacantCount: vacantData?.length || 0,
      otherCount: otherData?.length || 0,
      total: (vacantData?.length || 0) + (otherData?.length || 0)
    };
  } catch (error) {
    console.error('Failed to assign properties:', error);
    return { success: false, error };
  }
}
