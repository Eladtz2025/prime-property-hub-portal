import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin contact info
const ADMINS = [
  { 
    id: 'a3915bf9-1f7a-410d-a555-79875e8de3f4', 
    name: 'אלעד',
    phone: '972549882809' 
  },
  { 
    id: '0c79f27c-bd27-4bf5-8f47-7e1b5e12c9b9', 
    name: 'אלעד',
    phone: '972545503055' 
  }
];

const ALERT_THRESHOLDS = [60, 30]; // Days before lease end

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for options
    let testMode = false;
    let forceCheck = false;
    let sendTest = false;
    
    try {
      const body = await req.json();
      testMode = body?.test_mode === true;
      forceCheck = body?.force === true;
      sendTest = body?.send_test === true;
    } catch {
      // No body or invalid JSON, use defaults
    }

    // If send_test is true, send immediate test message and return
    if (sendTest) {
      console.log('📧 Sending test message to admins...');
      
      const testMessage = `🧪 הודעת בדיקה - מערכת התראות

זוהי הודעת בדיקה לוודא שמערכת ההתראות פועלת כשורה.

תאריך: ${new Date().toLocaleDateString('he-IL')}
שעה: ${new Date().toLocaleTimeString('he-IL')}

אם קיבלת הודעה זו, המערכת עובדת! ✅`;

      const testResults = {
        success: true,
        testMode: false,
        sendTest: true,
        messagesSent: 0,
        errors: [] as string[]
      };

      for (const admin of ADMINS) {
        try {
          const { error: whatsappError } = await supabase.functions.invoke('whatsapp-send', {
            body: {
              phone: admin.phone,
              message: testMessage,
              type: 'single'
            }
          });

          if (whatsappError) {
            console.error(`Error sending test to ${admin.name}:`, whatsappError);
            testResults.errors.push(`${admin.name}: ${whatsappError.message}`);
          } else {
            console.log(`✅ Test message sent to ${admin.name}`);
            testResults.messagesSent++;
          }
        } catch (e) {
          console.error(`Exception sending test to ${admin.name}:`, e);
          testResults.errors.push(`${admin.name}: ${e.message}`);
        }
      }

      return new Response(JSON.stringify(testResults), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 Starting lease expiry check. Test mode: ${testMode}, Force: ${forceCheck}`);

    // Get all active tenants with lease end dates
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select(`
        id,
        name,
        phone,
        lease_end_date,
        property_id,
        properties:property_id (
          id,
          address,
          city,
          owner_name,
          owner_phone
        )
      `)
      .eq('is_active', true)
      .not('lease_end_date', 'is', null);

    if (tenantsError) {
      console.error('Error fetching tenants:', tenantsError);
      throw tenantsError;
    }

    console.log(`📋 Found ${tenants?.length || 0} active tenants with lease dates`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const alertsToSend: Array<{
      tenant: any;
      daysRemaining: number;
      threshold: number;
    }> = [];

    // Check each tenant
    for (const tenant of tenants || []) {
      const leaseEndDate = new Date(tenant.lease_end_date);
      leaseEndDate.setHours(0, 0, 0, 0);
      
      const daysRemaining = Math.ceil((leaseEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`  - ${tenant.name}: ${daysRemaining} days remaining (ends ${tenant.lease_end_date})`);

      // Check each threshold
      for (const threshold of ALERT_THRESHOLDS) {
        // For normal mode: alert when days remaining equals or is slightly past the threshold
        // For force mode: alert for any tenant regardless of threshold
        const shouldAlert = forceCheck || (daysRemaining <= threshold && daysRemaining > 0);
        
        if (!shouldAlert) continue;

        // Check if alert was already sent for this threshold
        const { data: existingAlert } = await supabase
          .from('lease_expiry_alerts')
          .select('id')
          .eq('property_id', tenant.property_id)
          .eq('tenant_id', tenant.id)
          .eq('days_before', threshold)
          .eq('lease_end_date', tenant.lease_end_date)
          .single();

        if (existingAlert && !forceCheck) {
          console.log(`    ⏭️ Alert for ${threshold} days already sent for ${tenant.name}`);
          continue;
        }

        // For force mode with existing alert, skip
        if (existingAlert && forceCheck) {
          console.log(`    ⏭️ Force mode but alert already exists for ${tenant.name} at ${threshold} days`);
          continue;
        }

        alertsToSend.push({
          tenant,
          daysRemaining,
          threshold
        });
      }
    }

    console.log(`📤 ${alertsToSend.length} alerts to send`);

    const results = {
      checked: tenants?.length || 0,
      alertsSent: 0,
      notificationsSent: 0,
      whatsappSent: 0,
      errors: [] as string[],
      details: [] as any[]
    };

    // Process alerts
    for (const alertData of alertsToSend) {
      const { tenant, daysRemaining, threshold } = alertData;
      const property = tenant.properties;
      
      const alertDetail = {
        tenant: tenant.name,
        property: property?.address || 'לא ידוע',
        daysRemaining,
        threshold,
        notifications: false,
        whatsapp: false
      };

      try {
        // Record the alert in tracking table
        const { error: insertError } = await supabase
          .from('lease_expiry_alerts')
          .insert({
            property_id: tenant.property_id,
            tenant_id: tenant.id,
            days_before: threshold,
            lease_end_date: tenant.lease_end_date,
            whatsapp_sent: !testMode,
            notification_sent: !testMode
          });

        if (insertError && !insertError.message.includes('duplicate')) {
          console.error('Error inserting alert record:', insertError);
        }

        // Create notifications for admins
        const notificationMessage = `חוזה השכירות של ${tenant.name} בנכס ${property?.address || ''}, ${property?.city || ''} מסתיים בעוד ${daysRemaining} ימים (${tenant.lease_end_date}). יש ליצור קשר עם בעל הנכס ${property?.owner_name || ''} ${property?.owner_phone ? `(${property.owner_phone})` : ''} להמשך.`;
        
        const priority = daysRemaining <= 30 ? 'high' : 'medium';

        if (!testMode) {
          for (const admin of ADMINS) {
            const { error: notifError } = await supabase
              .from('notifications')
              .insert({
                recipient_id: admin.id,
                type: 'lease_expiry',
                title: `🏠 התראת סיום חוזה - ${daysRemaining} ימים`,
                message: notificationMessage,
                priority,
                property_id: tenant.property_id
              });

            if (notifError) {
              console.error(`Error creating notification for ${admin.name}:`, notifError);
              results.errors.push(`Notification error for ${admin.name}: ${notifError.message}`);
            } else {
              results.notificationsSent++;
            }
          }
          alertDetail.notifications = true;
        }

        // Send WhatsApp messages to admins
        const whatsappMessage = `🏠 התראת סיום חוזה

הנכס: ${property?.address || 'לא ידוע'}, ${property?.city || ''}
דייר: ${tenant.name}${tenant.phone ? ` (${tenant.phone})` : ''}
תאריך סיום: ${tenant.lease_end_date}
נותרו: ${daysRemaining} ימים

בעל הנכס: ${property?.owner_name || 'לא ידוע'}${property?.owner_phone ? ` (${property.owner_phone})` : ''}

יש ליצור קשר עם בעל הנכס להמשך.`;

        if (!testMode) {
          // Call existing whatsapp-send function for each admin
          for (const admin of ADMINS) {
            try {
              const { error: whatsappError } = await supabase.functions.invoke('whatsapp-send', {
                body: {
                  phone: admin.phone,
                  message: whatsappMessage,
                  propertyId: tenant.property_id,
                  type: 'single'
                }
              });

              if (whatsappError) {
                console.error(`Error sending WhatsApp to ${admin.name}:`, whatsappError);
                results.errors.push(`WhatsApp error for ${admin.name}: ${whatsappError.message}`);
              } else {
                console.log(`✅ WhatsApp sent to ${admin.name}`);
                results.whatsappSent++;
              }
            } catch (e) {
              console.error(`Exception sending WhatsApp to ${admin.name}:`, e);
              results.errors.push(`WhatsApp exception for ${admin.name}: ${e.message}`);
            }
          }
          alertDetail.whatsapp = true;
        }

        results.alertsSent++;
        results.details.push(alertDetail);

      } catch (error) {
        console.error('Error processing alert:', error);
        results.errors.push(`Processing error: ${error.message}`);
      }
    }

    console.log('📊 Final results:', results);

    return new Response(JSON.stringify({
      success: true,
      testMode,
      forceCheck,
      ...results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in check-lease-expiry:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
