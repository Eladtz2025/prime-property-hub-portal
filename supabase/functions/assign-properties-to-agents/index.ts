import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This is a one-time assignment function - no auth required
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    // Assign vacant properties to Tali
    const { data: vacantData, error: vacantError } = await supabaseClient
      .from('properties')
      .update({ assigned_user_id: '30300ca7-6c59-41e4-99dd-ef59ea3ea349' })
      .eq('status', 'vacant')
      .select('id');

    if (vacantError) throw vacantError;

    // Assign all other properties to Elad
    const { data: otherData, error: otherError } = await supabaseClient
      .from('properties')
      .update({ assigned_user_id: 'bfd1625c-7bb5-424f-8969-966cbbdd00ef' })
      .neq('status', 'vacant')
      .select('id');

    if (otherError) throw otherError;

    return new Response(
      JSON.stringify({
        success: true,
        vacantCount: vacantData?.length || 0,
        otherCount: otherData?.length || 0,
        total: (vacantData?.length || 0) + (otherData?.length || 0),
        message: `✅ הוקצו ${vacantData?.length || 0} נכסים פנויים לטלי ו-${otherData?.length || 0} נכסים לאלעד`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
