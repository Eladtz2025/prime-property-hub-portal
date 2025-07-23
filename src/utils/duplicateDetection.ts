
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
      if (normalizedPhone) {
        if (!phoneGroups[normalizedPhone]) {
          phoneGroups[normalizedPhone] = [];
        }
        phoneGroups[normalizedPhone].push(property);
      }
    }
  });
  
  // Return only groups with duplicates
  return Object.entries(phoneGroups)
    .filter(([_, properties]) => properties.length > 1)
    .map(([phoneNumber, properties]) => ({
      phoneNumber,
      properties
    }));
};

export const normalizePhoneNumber = (phone: string): string => {
  if (!phone || phone === 'nan' || phone === '—') return '';
  
  // Handle multiple phone numbers - take the first one
  const firstPhone = phone.split(' / ')[0];
  
  // Remove all non-digit characters
  const digitsOnly = firstPhone.replace(/[^\d]/g, '');
  
  // Handle different formats
  if (digitsOnly.length === 8) {
    return '0' + digitsOnly; // Add leading 0 for landline
  } else if (digitsOnly.length === 9) {
    return '0' + digitsOnly; // Add leading 0 for mobile
  } else if (digitsOnly.length === 10) {
    return digitsOnly; // Already correct format
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('972')) {
    return '0' + digitsOnly.slice(3); // Remove country code +972
  }
  
  return digitsOnly; // Return as is for unclear formats
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
    property.address,
    property.city,
    property.ownerName,
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
    .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  return csvContent;
};

export const downloadCSV = (csvContent: string, filename: string = 'נכסים') => {
  const BOM = '\uFEFF'; // Add BOM for proper Hebrew encoding
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};
