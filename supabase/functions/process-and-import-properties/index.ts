import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExcelProperty {
  address: string;
  owner_name: string;
  owner_phone: string;
  tenant_name?: string;
  tenant_phone?: string;
  city: string;
  notes?: string;
  rooms?: number;
  status?: string;
}

const cleanPhoneNumber = (phone: string): string => {
  if (!phone || phone === 'nan' || phone === '—' || phone === '-') return '';
  
  const phoneNumbers = phone.split(/[\/,]/).map(num => {
    const cleaned = num.trim().replace(/[^\d]/g, '');
    
    if (cleaned.length === 10 && cleaned.startsWith('05')) {
      return cleaned;
    } else if (cleaned.length === 9 && cleaned.startsWith('5')) {
      return `0${cleaned}`;
    } else if (cleaned.length === 10 && cleaned.startsWith('972')) {
      return `0${cleaned.substring(3)}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('972')) {
      return `0${cleaned.substring(3)}`;
    } else if (cleaned.length === 10) {
      return cleaned;
    }
    
    return cleaned;
  }).filter(num => num.length >= 9);
  
  return phoneNumbers[0] || '';
};

const normalizeAddress = (address: string): string => {
  if (!address) return '';
  return address
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\u0590-\u05FF\u0020-\u007F\d]/g, '')
    .trim();
};

const parseRooms = (roomsStr: any): number | undefined => {
  if (!roomsStr || roomsStr === '-' || roomsStr === 'nan') return undefined;
  const match = roomsStr.toString().match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : undefined;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting Excel processing and import...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the Excel file from storage
    console.log('📥 Downloading Excel file from storage...');
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('data-import')
      .download('בעלי_דירות_מעודכן חדש.xlsx');

    if (downloadError) {
      console.error('❌ Error downloading Excel file:', downloadError);
      throw new Error(`Failed to download Excel: ${downloadError.message}`);
    }

    // Read Excel file
    console.log('📖 Reading Excel file...');
    const arrayBuffer = await fileData.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    console.log(`📊 Found ${workbook.SheetNames.length} sheets`);

    const properties: ExcelProperty[] = [];

    // Process all sheets
    for (const sheetName of workbook.SheetNames) {
      console.log(`Processing sheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) continue;

      const headers = jsonData[0] as string[];
      console.log(`Headers: ${headers.join(', ')}`);

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (!row || row.length === 0) continue;

        const rowData: any = {};
        headers.forEach((header, index) => {
          if (header && row[index] !== undefined && row[index] !== null && row[index] !== '') {
            rowData[header] = row[index];
          }
        });

        if (!rowData || Object.keys(rowData).length === 0) continue;

        const property: ExcelProperty = {
          address: normalizeAddress(
            rowData['כתובת'] || 
            rowData['address'] || 
            rowData['רחוב'] || 
            ''
          ),
          owner_name: (
            rowData['בעל הנכס'] || 
            rowData['owner_name'] || 
            rowData['שם בעלים'] || 
            rowData['בעלים'] || 
            ''
          ).toString().trim(),
          owner_phone: cleanPhoneNumber(
            rowData['טלפון בעלים'] || 
            rowData['owner_phone'] || 
            rowData['טלפון'] || 
            ''
          ),
          tenant_name: (
            rowData['שוכר'] || 
            rowData['tenant_name'] || 
            rowData['דייר'] || 
            ''
          ).toString().trim() || undefined,
          tenant_phone: cleanPhoneNumber(
            rowData['טלפון דייר'] || 
            rowData['tenant_phone'] || 
            rowData['טלפון שוכר'] || 
            ''
          ) || undefined,
          city: 'תל אביב-יפו',
          notes: (rowData['הערות'] || rowData['notes'] || '').toString().trim() || undefined,
          rooms: parseRooms(rowData['חדרים'] || rowData['rooms'] || rowData['מס חדרים'] || ''),
          status: 'unknown'
        };

        if (property.address || property.owner_name) {
          properties.push(property);
        }
      }
    }

    console.log(`✅ Processed ${properties.length} properties from Excel`);

    // Create JSON structure
    const unifiedData = {
      metadata: {
        created_at: new Date().toISOString(),
        total_properties: properties.length,
        source: 'בעלי_דירות_מעודכן חדש.xlsx'
      },
      properties: properties
    };

    // Upload JSON to storage
    console.log('📤 Uploading JSON to storage...');
    const jsonBlob = new Blob([JSON.stringify(unifiedData, null, 2)], {
      type: 'application/json'
    });

    const { error: uploadError } = await supabase
      .storage
      .from('data-import')
      .upload('properties-unified-new.json', jsonBlob, {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Error uploading JSON:', uploadError);
      throw new Error(`Failed to upload JSON: ${uploadError.message}`);
    }

    console.log('✅ JSON uploaded successfully');

    // Now import to database
    console.log('💾 Starting database import...');
    const results = {
      total: properties.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const property of properties) {
      try {
        const dbProperty = {
          address: property.address,
          city: property.city,
          owner_name: property.owner_name,
          owner_phone: property.owner_phone,
          notes: property.notes,
          status: property.status || 'unknown',
          contact_status: 'not_contacted',
          contact_attempts: 0,
          rooms: property.rooms
        };

        const { error: insertError } = await supabase
          .from('properties')
          .insert(dbProperty);

        if (insertError) {
          console.error(`❌ Failed to insert ${property.address}:`, insertError);
          results.failed++;
          results.errors.push(`${property.address}: ${insertError.message}`);
        } else {
          results.successful++;
          if (results.successful % 10 === 0) {
            console.log(`✅ Progress: ${results.successful}/${properties.length}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${property.address}:`, error);
        results.failed++;
        results.errors.push(`${property.address}: ${error.message}`);
      }
    }

    console.log(`✅ Import completed: ${results.successful} successful, ${results.failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Excel processed and imported successfully',
        stats: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
