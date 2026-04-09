import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

import { getRestrictedCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';

const TABLES_TO_BACKUP = [
  'profiles',
  'properties',
  'property_images',
  'tenants',
  'contact_leads',
  'brokerage_forms',
  'financial_records',
  'rent_payments',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const backupId = crypto.randomUUID();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `backup-${timestamp}.json`;

  try {
    // Create initial backup record
    await supabase.from('backup_history').insert({
      id: backupId,
      file_name: fileName,
      status: 'in_progress',
      tables_backed_up: [],
    });

    console.log(`Starting backup: ${fileName}`);

    const backupData: Record<string, unknown[]> = {};
    const tablesBackedUp: string[] = [];

    for (const table of TABLES_TO_BACKUP) {
      try {
        const { data, error } = await supabase.from(table).select('*');
        
        if (error) {
          console.error(`Error backing up table ${table}:`, error);
          continue;
        }

        backupData[table] = data || [];
        tablesBackedUp.push(table);
        console.log(`Backed up table ${table}: ${data?.length || 0} rows`);
      } catch (tableError) {
        console.error(`Exception backing up table ${table}:`, tableError);
      }
    }

    const backupJson = JSON.stringify(backupData, null, 2);
    const backupBlob = new Blob([backupJson], { type: 'application/json' });
    const fileSizeKb = Math.round(backupBlob.size / 1024);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('database-backups')
      .upload(fileName, backupBlob, {
        contentType: 'application/json',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload backup: ${uploadError.message}`);
    }

    // Update backup record
    await supabase
      .from('backup_history')
      .update({
        status: 'success',
        file_size_kb: fileSizeKb,
        tables_backed_up: tablesBackedUp,
      })
      .eq('id', backupId);

    console.log(`Backup completed successfully: ${fileName} (${fileSizeKb}KB)`);

    return new Response(
      JSON.stringify({
        success: true,
        file_name: fileName,
        file_size_kb: fileSizeKb,
        tables_backed_up: tablesBackedUp,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Backup error:', error);

    // Update backup record with error
    await supabase
      .from('backup_history')
      .update({
        status: 'failed',
        error_message: error.message,
      })
      .eq('id', backupId);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
