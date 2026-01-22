import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, sentry-trace, baggage',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user ID from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get all management properties
    const { data: managementProperties, error: propertiesError } = await supabaseClient
      .from('properties')
      .select('id')
      .eq('property_type', 'management');

    if (propertiesError) throw propertiesError;

    // Get existing property_owners for this user
    const { data: existingOwners, error: ownersError } = await supabaseClient
      .from('property_owners')
      .select('property_id')
      .eq('owner_id', user.id);

    if (ownersError) throw ownersError;

    const existingPropertyIds = new Set(existingOwners?.map(o => o.property_id) || []);

    // Filter out properties that are already assigned
    const propertiesToAssign = managementProperties?.filter(
      p => !existingPropertyIds.has(p.id)
    ) || [];

    if (propertiesToAssign.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'All management properties already assigned', assigned: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign management properties to the user
    const { data, error } = await supabaseClient
      .from('property_owners')
      .insert(
        propertiesToAssign.map(p => ({
          property_id: p.id,
          owner_id: user.id,
          ownership_percentage: 100
        }))
      )
      .select();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, assigned: data?.length || 0, properties: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
