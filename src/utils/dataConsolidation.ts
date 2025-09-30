import { supabase } from "@/integrations/supabase/client";
import { propertiesRawData } from "@/data/propertiesData";

// Types for consolidated data
export interface ConsolidatedProperty {
  id: string;
  address: string;
  city: string;
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  tenantName?: string;
  tenantPhone?: string;
  tenantEmail?: string;
  monthlyRent?: number;
  leaseStartDate?: string;
  leaseEndDate?: string;
  status: 'unknown' | 'occupied' | 'vacant' | 'maintenance';
  contactStatus: 'not_contacted' | 'called_no_answer' | 'called_answered' | 'needs_callback';
  lastContactDate?: string;
  contactNotes?: string;
  contactAttempts: number;
  propertySize?: number;
  floor?: number;
  rooms?: number;
  notes?: string;
  lastUpdated?: string;
  createdAt?: string;
  // Metadata for tracking origin
  dataSource: 'json_main' | 'typescript_data' | 'owners_json' | 'supabase' | 'consolidated';
  originalRecord?: any;
  duplicateMarkers?: string[];
}

export interface ConsolidatedOwner {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  properties: string[]; // Property IDs
  dataSource: 'json_main' | 'typescript_data' | 'owners_json' | 'supabase';
  originalRecord?: any;
}

export interface ConsolidationResult {
  properties: ConsolidatedProperty[];
  owners: ConsolidatedOwner[];
  statistics: {
    totalRecords: number;
    sourceBreakdown: Record<string, number>;
    potentialDuplicates: number;
  };
  duplicateAnalysis: {
    byPhone: Record<string, ConsolidatedProperty[]>;
    byOwnerName: Record<string, ConsolidatedProperty[]>;
    byAddress: Record<string, ConsolidatedProperty[]>;
  };
}

// Utility functions
function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Israeli phone numbers
  if (cleaned.length === 9 && cleaned.startsWith('5')) {
    cleaned = '0' + cleaned;
  } else if (cleaned.length === 8) {
    cleaned = '0' + cleaned;
  }
  
  // Remove country code if present
  if (cleaned.startsWith('972')) {
    cleaned = '0' + cleaned.substring(3);
  }
  
  return cleaned;
}

function extractCityFromAddress(address: string): string {
  if (!address) return 'תל אביב';
  
  const cities = [
    'תל אביב', 'תל-אביב', 'ת"א', 'יפו',
    'חולון', 'בת ים', 'גבעתיים', 'רמת גן',
    'פתח תקווה', 'ראשון לציון', 'רחובות',
    'נתניה', 'הרצליה', 'רעננה', 'כפר סבא'
  ];
  
  for (const city of cities) {
    if (address.includes(city)) {
      return city.replace('ת"א', 'תל אביב').replace('תל-אביב', 'תל אביב');
    }
  }
  
  return 'תל אביב';
}

function generatePropertyId(address: string, ownerName: string): string {
  const cleanAddress = address.replace(/[^\w\u0590-\u05FF]/g, '');
  const cleanOwner = ownerName.replace(/[^\w\u0590-\u05FF]/g, '');
  return `prop_${cleanAddress}_${cleanOwner}`.substring(0, 50);
}

function generateOwnerId(name: string, phone?: string): string {
  const cleanName = name.replace(/[^\w\u0590-\u05FF]/g, '');
  const cleanPhone = phone ? cleanPhoneNumber(phone) : '';
  return `owner_${cleanName}_${cleanPhone}`.substring(0, 50);
}

// Data loading functions
async function loadMainJsonData(): Promise<any[]> {
  try {
    const response = await fetch('/כל הנכסים - JSON ל-AI.json');
    if (!response.ok) throw new Error('Failed to load main JSON');
    return await response.json();
  } catch (error) {
    console.warn('Could not load main JSON file:', error);
    return [];
  }
}

async function loadOwnersJsonData(): Promise<any[]> {
  try {
    const response = await fetch('/בעלי_דירות_מעודכן.json');
    if (!response.ok) throw new Error('Failed to load owners JSON');
    return await response.json();
  } catch (error) {
    console.warn('Could not load owners JSON file:', error);
    return [];
  }
}

async function loadSupabaseData(): Promise<{ properties: any[], owners: any[] }> {
  try {
    const [propertiesResult, ownersResult] = await Promise.all([
      supabase.from('properties').select('*'),
      supabase.from('property_owners').select(`
        *,
        properties(*),
        profiles(*)
      `)
    ]);

    return {
      properties: propertiesResult.data || [],
      owners: ownersResult.data || []
    };
  } catch (error) {
    console.warn('Could not load Supabase data:', error);
    return { properties: [], owners: [] };
  }
}

// Main consolidation function
export async function consolidateAllPropertyData(): Promise<ConsolidationResult> {
  console.log('Starting data consolidation...');
  
  // Load all data sources
  const [mainJsonData, ownersJsonData, supabaseData] = await Promise.all([
    loadMainJsonData(),
    loadOwnersJsonData(),
    loadSupabaseData()
  ]);

  const consolidatedProperties: ConsolidatedProperty[] = [];
  const consolidatedOwners: ConsolidatedOwner[] = [];
  const sourceBreakdown: Record<string, number> = {
    json_main: 0,
    typescript_data: 0,
    owners_json: 0,
    supabase: 0
  };

  // Process main JSON data
  console.log(`Processing ${mainJsonData.length} records from main JSON...`);
  for (const item of mainJsonData) {
    const property: ConsolidatedProperty = {
      id: generatePropertyId(item.address || '', item.owner_name || ''),
      address: item.address || '',
      city: extractCityFromAddress(item.address || ''),
      ownerName: item.owner_name || '',
      ownerPhone: cleanPhoneNumber(item.owner_phone || ''),
      ownerEmail: item.owner_email || '',
      tenantName: item.tenant_name || '',
      tenantPhone: cleanPhoneNumber(item.tenant_phone || ''),
      tenantEmail: item.tenant_email || '',
      monthlyRent: item.monthly_rent || undefined,
      leaseStartDate: item.lease_start_date || item.entry_date || undefined,
      leaseEndDate: item.lease_end_date || undefined,
      status: item.tenant_name ? 'occupied' : 'unknown',
      contactStatus: 'not_contacted',
      contactAttempts: 0,
      dataSource: 'json_main',
      originalRecord: item,
      createdAt: new Date().toISOString()
    };
    
    consolidatedProperties.push(property);
    sourceBreakdown.json_main++;
  }

  // Process TypeScript data
  console.log(`Processing ${propertiesRawData.length} records from TypeScript data...`);
  for (const item of propertiesRawData) {
    const property: ConsolidatedProperty = {
      id: generatePropertyId(item.address || '', item.owner_name || ''),
      address: item.address || '',
      city: extractCityFromAddress(item.address || ''),
      ownerName: item.owner_name || '',
      ownerPhone: cleanPhoneNumber(item.owner_phone || ''),
      tenantName: item.tenant_name || '',
      tenantPhone: cleanPhoneNumber(item.tenant_phone || ''),
      leaseStartDate: item.entry_date || undefined,
      status: item.tenant_name ? 'occupied' : 'unknown',
      contactStatus: 'not_contacted',
      contactAttempts: 0,
      dataSource: 'typescript_data',
      originalRecord: item,
      createdAt: new Date().toISOString()
    };
    
    consolidatedProperties.push(property);
    sourceBreakdown.typescript_data++;
  }

  // Process owners JSON data
  console.log(`Processing ${ownersJsonData.length} records from owners JSON...`);
  for (const item of ownersJsonData) {
    const owner: ConsolidatedOwner = {
      id: generateOwnerId(item['שם'] || '', item['טלפון'] || ''),
      name: item['שם'] || '',
      phone: cleanPhoneNumber(item['טלפון'] || ''),
      address: item['כתובת'] || '',
      properties: [],
      dataSource: 'owners_json',
      originalRecord: item
    };
    
    consolidatedOwners.push(owner);
    sourceBreakdown.owners_json++;
  }

  // Process Supabase data
  console.log(`Processing ${supabaseData.properties.length} properties from Supabase...`);
  for (const item of supabaseData.properties) {
    const property: ConsolidatedProperty = {
      id: item.id,
      address: item.address || '',
      city: item.city || '',
      ownerName: '', // Will be filled from relationships
      status: item.status || 'unknown',
      contactStatus: item.contact_status || 'not_contacted',
      contactAttempts: item.contact_attempts || 0,
      lastContactDate: item.last_contact_date || undefined,
      contactNotes: item.contact_notes || undefined,
      propertySize: item.property_size || undefined,
      floor: item.floor || undefined,
      rooms: item.rooms || undefined,
      notes: item.notes || undefined,
      dataSource: 'supabase',
      originalRecord: item,
      createdAt: item.created_at,
      lastUpdated: item.updated_at
    };
    
    consolidatedProperties.push(property);
    sourceBreakdown.supabase++;
  }

  // Analyze duplicates
  console.log('Analyzing potential duplicates...');
  const duplicateAnalysis = analyzeDuplicates(consolidatedProperties);

  const result: ConsolidationResult = {
    properties: consolidatedProperties,
    owners: consolidatedOwners,
    statistics: {
      totalRecords: consolidatedProperties.length + consolidatedOwners.length,
      sourceBreakdown,
      potentialDuplicates: Object.values(duplicateAnalysis.byPhone).filter(arr => arr.length > 1).length +
                          Object.values(duplicateAnalysis.byOwnerName).filter(arr => arr.length > 1).length
    },
    duplicateAnalysis
  };

  console.log('Consolidation complete:', result.statistics);
  return result;
}

function analyzeDuplicates(properties: ConsolidatedProperty[]) {
  const byPhone: Record<string, ConsolidatedProperty[]> = {};
  const byOwnerName: Record<string, ConsolidatedProperty[]> = {};
  const byAddress: Record<string, ConsolidatedProperty[]> = {};

  for (const property of properties) {
    // Group by phone
    if (property.ownerPhone) {
      const phone = property.ownerPhone;
      if (!byPhone[phone]) byPhone[phone] = [];
      byPhone[phone].push(property);
    }

    // Group by owner name
    if (property.ownerName) {
      const name = property.ownerName.trim();
      if (!byOwnerName[name]) byOwnerName[name] = [];
      byOwnerName[name].push(property);
    }

    // Group by address
    if (property.address) {
      const address = property.address.trim();
      if (!byAddress[address]) byAddress[address] = [];
      byAddress[address].push(property);
    }
  }

  return { byPhone, byOwnerName, byAddress };
}

// Export consolidated data to JSON
export async function exportConsolidatedData(data: ConsolidationResult): Promise<void> {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `consolidated-property-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}