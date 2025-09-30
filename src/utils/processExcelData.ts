interface ExcelProperty {
  address: string;
  owner_name: string;
  owner_phone: string;
  tenant_name?: string;
  tenant_phone?: string;
  city: string;
  notes?: string;
  rooms?: number;
  monthly_rent?: number;
  status?: string;
}

const cleanPhoneNumber = (phone: string): string => {
  if (!phone || phone === 'nan' || phone === '—' || phone === '-') return '';
  
  // Handle multiple phone numbers separated by " / " or ","
  const phoneNumbers = phone.split(/[\/,]/).map(num => {
    const cleaned = num.trim().replace(/[^\d]/g, '');
    
    // Handle different Israeli phone number formats
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
  
  // Clean and normalize address
  return address
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\u0590-\u05FF\u0020-\u007F\d]/g, '') // Keep Hebrew, English, numbers, spaces
    .trim();
};

const parseRooms = (roomsStr: string): number | undefined => {
  if (!roomsStr || roomsStr === '-' || roomsStr === 'nan') return undefined;
  
  const match = roomsStr.toString().match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : undefined;
};

const parseRent = (rentStr: string): number | undefined => {
  if (!rentStr || rentStr === '-' || rentStr === 'nan') return undefined;
  
  const cleanRent = rentStr.toString().replace(/[^\d]/g, '');
  const rent = parseInt(cleanRent);
  
  return rent && rent > 0 ? rent : undefined;
};

export const processExcelToUnified = (excelData: any[]): ExcelProperty[] => {
  const properties: ExcelProperty[] = [];
  
  excelData.forEach(row => {
    // Skip empty rows
    if (!row.address && !row.owner_name) return;
    
    const property: ExcelProperty = {
      address: normalizeAddress(row.address || row['כתובת'] || row['רחוב'] || ''),
      owner_name: (row.owner_name || row['בעל הנכס'] || row['שם בעלים'] || row['בעלים'] || '').trim(),
      owner_phone: cleanPhoneNumber(row.owner_phone || row['טלפון בעלים'] || row['טלפון'] || ''),
      tenant_name: (row.tenant_name || row['שוכר'] || row['דייר'] || '').trim() || undefined,
      tenant_phone: cleanPhoneNumber(row.tenant_phone || row['טלפון דייר'] || row['טלפון שוכר'] || '') || undefined,
      city: 'תל אביב-יפו', // Default city based on the data pattern
      notes: (row.notes || row['הערות'] || '').trim() || undefined,
      rooms: parseRooms(row.rooms || row['חדרים'] || row['מס חדרים'] || ''),
      monthly_rent: parseRent(row.rent || row['שכירות'] || row['מחיר'] || ''),
      status: 'unknown'
    };
    
    // Only add if we have at least address or owner name
    if (property.address || property.owner_name) {
      properties.push(property);
    }
  });
  
  return properties;
};