
import { Property } from '../types/property';

export interface DuplicateGroup {
  phoneNumber: string;
  properties: Property[];
}

export const findDuplicatePhoneNumbers = (properties: Property[]): DuplicateGroup[] => {
  const phoneGroups: { [key: string]: Property[] } = {};
  
  properties.forEach(property => {
    if (property.ownerPhone) {
      // Normalize phone number for comparison
      const normalizedPhone = normalizePhoneNumber(property.ownerPhone);
      if (normalizedPhone && normalizedPhone.length >= 9) { // Only valid normalized numbers
        if (!phoneGroups[normalizedPhone]) {
          phoneGroups[normalizedPhone] = [];
        }
        phoneGroups[normalizedPhone].push(property);
      }
    }
  });
  
  // Return only groups with duplicates, sorted by group size (largest first)
  return Object.entries(phoneGroups)
    .filter(([_, properties]) => properties.length > 1)
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([phoneNumber, properties]) => ({
      phoneNumber,
      properties: properties.sort((a, b) => a.address.localeCompare(b.address, 'he'))
    }));
};

export const normalizePhoneNumber = (phone: string): string => {
  if (!phone || phone === 'nan' || phone === '—' || phone.trim() === '') return '';
  
  // Handle multiple phone numbers - take the first one
  const firstPhone = phone.split(/[\/,;]|או/)[0].trim();
  
  // Remove all non-digit characters
  const digitsOnly = firstPhone.replace(/[^\d]/g, '');
  
  // Skip if too short or too long
  if (digitsOnly.length < 8 || digitsOnly.length > 13) return '';
  
  // Handle different formats
  if (digitsOnly.length === 8) {
    // 8 digits - likely landline, add leading 0
    return '0' + digitsOnly;
  } else if (digitsOnly.length === 9) {
    // 9 digits - mobile without leading 0
    return '0' + digitsOnly;
  } else if (digitsOnly.length === 10) {
    // 10 digits - should be correct format
    return digitsOnly;
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('972')) {
    // 12 digits with +972 country code
    return '0' + digitsOnly.slice(3);
  } else if (digitsOnly.length === 13 && digitsOnly.startsWith('972')) {
    // 13 digits with +972 country code
    return '0' + digitsOnly.slice(3);
  }
  
  return ''; // Return empty for unclear formats
};

export const generateCSVData = (properties: Property[], includeAll: boolean = true): string => {
  const headers = [
    'כתובת',
    'עיר',
    'בעל הנכס',
    'טלפון בעל הנכס',
    'אימייל בעל הנכס',
    'שם הדייר',
    'טלפון דייר',
    'אימייל דייר',
    'שכר דירה חודשי',
    'סטטוס נכס',
    'תאריך תחילת חוזה',
    'תאריך סיום חוזה',
    'מספר חדרים',
    'קומה',
    'גודל (מ"ר)',
    'הערות'
  ];
  
  const rows = properties.map(property => [
    property.address || '',
    property.city || '',
    property.ownerName || '',
    property.ownerPhone || '',
    property.ownerEmail || '',
    property.tenantName || '',
    property.tenantPhone || '',
    property.tenantEmail || '',
    property.monthlyRent ? property.monthlyRent.toString() : '',
    property.status === 'occupied' ? 'תפוס' : 
    property.status === 'vacant' ? 'פנוי' : 'תחזוקה',
    property.leaseStartDate || '',
    property.leaseEndDate || '',
    property.rooms?.toString() || '',
    property.floor?.toString() || '',
    property.propertySize?.toString() || '',
    property.notes || ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  return csvContent;
};

export const downloadCSV = (csvContent: string, filename: string = 'נכסים') => {
  const BOM = '\uFEFF'; // Add BOM for proper Hebrew encoding
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
