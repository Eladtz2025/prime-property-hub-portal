import * as XLSX from 'xlsx';
import * as fs from 'fs';

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
  
  const phoneNumbers = phone.toString().split(/[\/,]/).map(num => {
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

async function generateFullJSON() {
  console.log('🚀 Starting full JSON generation...');

  // Read the Excel file
  const workbook = XLSX.readFile('public/בעלי_דירות_מעודכן חדש.xlsx');
  console.log(`📊 Found ${workbook.SheetNames.length} sheets`);

  const properties: ExcelProperty[] = [];

  // Process all sheets
  for (const sheetName of workbook.SheetNames) {
    console.log(`Processing sheet: ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      console.log(`Skipping empty sheet: ${sheetName}`);
      continue;
    }

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

  console.log(`✅ Processed ${properties.length} properties total`);

  // Create the unified JSON structure
  const unifiedData = {
    metadata: {
      created_at: new Date().toISOString(),
      total_properties: properties.length,
      source: 'בעלי_דירות_מעודכן חדש.xlsx',
      version: '2.0'
    },
    properties: properties
  };

  // Write to file
  const outputPath = 'public/properties-unified-full.json';
  fs.writeFileSync(outputPath, JSON.stringify(unifiedData, null, 2));
  
  console.log(`✅ JSON file created: ${outputPath}`);
  console.log(`📊 Total properties: ${properties.length}`);
  console.log(`📄 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
}

generateFullJSON()
  .then(() => console.log('✅ Generation completed successfully!'))
  .catch(error => console.error('❌ Error:', error));
