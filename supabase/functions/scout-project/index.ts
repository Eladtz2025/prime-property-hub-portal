import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Schema for Firecrawl JSON extraction
const UNITS_SCHEMA = {
  type: 'object',
  properties: {
    project_name: { type: 'string', description: 'The name of the real estate project' },
    units: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rooms: { type: 'number', description: 'Number of rooms (e.g. 3, 4, 5)' },
          size_sqm: { type: 'number', description: 'Size in square meters' },
          floor: { type: 'number', description: 'Floor number' },
          price: { type: 'number', description: 'Price in ILS (shekels). Convert from millions if needed (e.g., 2.5 מיליון = 2500000)' },
          unit_type: { type: 'string', description: 'Type of unit: דירה, פנטהאוז, דופלקס, גן, סטודיו, etc.' },
          status: { type: 'string', description: 'Availability: זמין/available, נמכר/sold, שמור/reserved. Default to available if not specified.' },
          description: { type: 'string', description: 'Any additional description or details about this specific unit' }
        }
      },
      description: 'List of all residential units/apartments found on the page. Each row in a table or listing is a separate unit.'
    }
  }
};

function generateUnitIdentifier(unit: any): string {
  const parts = [];
  if (unit.floor != null) parts.push(`f${unit.floor}`);
  if (unit.rooms != null) parts.push(`r${unit.rooms}`);
  if (unit.size_sqm != null) parts.push(`s${unit.size_sqm}`);
  if (unit.unit_type) parts.push(unit.unit_type);
  return parts.join('_') || `unit_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeStatus(status: string | null | undefined): string {
  if (!status) return 'available';
  const s = status.toLowerCase().trim();
  if (s.includes('נמכר') || s.includes('sold')) return 'sold';
  if (s.includes('שמור') || s.includes('reserved') || s.includes('תפוס')) return 'reserved';
  return 'available';
}

async function scrapeProjectPage(url: string): Promise<any> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  console.log(`Scraping project URL: ${url}`);

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['extract', 'markdown'],
      extract: {
        schema: UNITS_SCHEMA,
      },
      onlyMainContent: true,
      waitFor: 3000,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Firecrawl error:', JSON.stringify(data));
    throw new Error(data.error || `Firecrawl request failed: ${response.status}`);
  }

  return data;
}

async function processProject(propertyId: string, trackingUrl: string): Promise<{
  units_found: number;
  units_added: number;
  units_removed: number;
  units_changed: number;
  error?: string;
}> {
  const stats = { units_found: 0, units_added: 0, units_removed: 0, units_changed: 0 };

  try {
    const scrapeResult = await scrapeProjectPage(trackingUrl);
    
    // Extract units from response
    const jsonData = scrapeResult?.data?.extract || scrapeResult?.extract;
    const units = jsonData?.units || [];
    stats.units_found = units.length;

    console.log(`Found ${units.length} units for property ${propertyId}`);

    if (units.length === 0) {
      console.warn(`No units found for ${trackingUrl}`);
      return stats;
    }

    // Get existing units from DB
    const { data: existingUnits, error: fetchError } = await supabase
      .from('project_units')
      .select('*')
      .eq('property_id', propertyId);

    if (fetchError) throw fetchError;

    const existingMap = new Map<string, any>();
    for (const eu of existingUnits || []) {
      existingMap.set(eu.unit_identifier, eu);
    }

    const seenIdentifiers = new Set<string>();

    // Process each scraped unit
    for (const unit of units) {
      const identifier = generateUnitIdentifier(unit);
      seenIdentifiers.add(identifier);
      const status = normalizeStatus(unit.status);
      const price = unit.price ? Math.round(unit.price) : null;

      const existing = existingMap.get(identifier);

      if (!existing) {
        // New unit - insert
        const { error: insertError } = await supabase
          .from('project_units')
          .insert({
            property_id: propertyId,
            unit_identifier: identifier,
            rooms: unit.rooms || null,
            size: unit.size_sqm ? Math.round(unit.size_sqm) : null,
            floor: unit.floor != null ? Math.round(unit.floor) : null,
            price: price,
            unit_type: unit.unit_type || null,
            status: status,
            raw_text: unit.description || null,
            first_seen_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
            price_history: price ? [{ price, date: new Date().toISOString() }] : [],
          });

        if (insertError) {
          // Try upsert on conflict
          console.warn(`Insert conflict for ${identifier}, trying upsert:`, insertError.message);
        } else {
          stats.units_added++;
        }
      } else {
        // Existing unit - check for changes
        const updates: any = {
          last_seen_at: new Date().toISOString(),
          status: status,
        };

        // If it was previously removed, mark as re-appeared
        if (existing.removed_at) {
          updates.removed_at = null;
          stats.units_added++;
        }

        // Check price change
        if (price && existing.price && price !== existing.price) {
          updates.price = price;
          const history = existing.price_history || [];
          history.push({ price, date: new Date().toISOString() });
          updates.price_history = history;
          stats.units_changed++;
        } else if (price && !existing.price) {
          updates.price = price;
          updates.price_history = [{ price, date: new Date().toISOString() }];
        }

        // Update raw text if changed
        if (unit.description && unit.description !== existing.raw_text) {
          updates.raw_text = unit.description;
        }

        const { error: updateError } = await supabase
          .from('project_units')
          .update(updates)
          .eq('id', existing.id);

        if (updateError) {
          console.error(`Failed to update unit ${identifier}:`, updateError.message);
        }
      }
    }

    // Mark missing units as sold/removed
    for (const [identifier, existing] of existingMap) {
      if (!seenIdentifiers.has(identifier) && !existing.removed_at && existing.status !== 'sold') {
        const { error: removeError } = await supabase
          .from('project_units')
          .update({
            status: 'sold',
            removed_at: new Date().toISOString(),
            last_seen_at: existing.last_seen_at, // Keep the last time we saw it
          })
          .eq('id', existing.id);

        if (!removeError) {
          stats.units_removed++;
        }
      }
    }

    // Update units_count on the property (count available only)
    const availableCount = units.filter((u: any) => normalizeStatus(u.status) === 'available').length;
    await supabase
      .from('properties')
      .update({ units_count: availableCount })
      .eq('id', propertyId);

    return stats;

  } catch (error: any) {
    console.error(`Error processing project ${propertyId}:`, error.message);
    return { ...stats, error: error.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let propertyIds: string[] | null = null;

    // Allow targeting specific property IDs
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.property_id) {
          propertyIds = [body.property_id];
        } else if (body.property_ids) {
          propertyIds = body.property_ids;
        }
      } catch {
        // No body or invalid JSON - scan all
      }
    }

    // Fetch projects with tracking URLs
    let query = supabase
      .from('properties')
      .select('id, tracking_url, title, address')
      .eq('property_type', 'project')
      .not('tracking_url', 'is', null)
      .neq('tracking_url', '');

    if (propertyIds && propertyIds.length > 0) {
      query = query.in('id', propertyIds);
    }

    const { data: projects, error: queryError } = await query;

    if (queryError) throw queryError;

    if (!projects || projects.length === 0) {
      console.log('No projects with tracking URLs found');
      return new Response(
        JSON.stringify({ success: true, message: 'No projects to scan', scanned: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting scan for ${projects.length} projects`);

    const results: any[] = [];

    for (const project of projects) {
      console.log(`Processing project: ${project.title || project.address} (${project.tracking_url})`);

      const stats = await processProject(project.id, project.tracking_url!);

      // Save scan log
      await supabase.from('project_scan_logs').insert({
        property_id: project.id,
        units_found: stats.units_found,
        units_added: stats.units_added,
        units_removed: stats.units_removed,
        units_changed: stats.units_changed,
        status: stats.error ? 'failed' : 'completed',
        error: stats.error || null,
      });

      results.push({
        property_id: project.id,
        title: project.title || project.address,
        ...stats,
      });

      // Small delay between projects to avoid rate limiting
      if (projects.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const totalFound = results.reduce((sum, r) => sum + r.units_found, 0);
    const totalAdded = results.reduce((sum, r) => sum + r.units_added, 0);
    const totalRemoved = results.reduce((sum, r) => sum + r.units_removed, 0);
    const totalChanged = results.reduce((sum, r) => sum + r.units_changed, 0);
    const failures = results.filter(r => r.error).length;

    console.log(`Scan complete: ${results.length} projects, ${totalFound} units found, ${totalAdded} new, ${totalRemoved} sold, ${totalChanged} changed, ${failures} failures`);

    return new Response(
      JSON.stringify({
        success: true,
        scanned: results.length,
        summary: { totalFound, totalAdded, totalRemoved, totalChanged, failures },
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Scout project error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
