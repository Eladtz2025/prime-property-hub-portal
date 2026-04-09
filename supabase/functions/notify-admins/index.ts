import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { getRestrictedCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, title, message, action_url, property_id } = await req.json();

    console.log('Creating notifications for admins:', { type, title, message });

    // Get all users with admin, super_admin, or manager roles
    const { data: adminUsers, error: usersError } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['admin', 'super_admin', 'manager']);

    if (usersError) {
      console.error('Error fetching admin users:', usersError);
      throw usersError;
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log('No admin users found');
      return new Response(
        JSON.stringify({ success: true, message: 'No admin users to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${adminUsers.length} admin users`);

    // Create notifications for all admin users
    const notifications = adminUsers.map(admin => ({
      recipient_id: admin.user_id,
      type,
      title,
      message,
      priority: 'high',
      action_url: action_url || '/admin-dashboard',
      property_id: property_id || null,
      is_read: false,
    }));

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      console.error('Error creating notifications:', notificationError);
      throw notificationError;
    }

    console.log(`Successfully created ${notifications.length} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_created: notifications.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in notify-admins function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
