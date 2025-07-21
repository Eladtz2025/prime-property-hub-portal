
import { Property } from '../types/property';

export const fixPhoneNumber = (phone: string): string => {
  if (!phone || phone === 'nan' || phone === '—') return '';
  
  // Handle multiple phone numbers separated by " / "
  const phoneNumbers = phone.split(' / ').map(num => {
    const cleaned = num.trim().replace(/[^\d]/g, '');
    
    // If it's 8 digits (landline), add 0 at the beginning
    if (cleaned.length === 8) {
      return '0' + cleaned;
    }
    
    // If it's 9 digits (mobile without leading 0), add 0 at the beginning
    if (cleaned.length === 9) {
      return '0' + cleaned;
    }
    
    // If it's already 10 digits, return as is
    if (cleaned.length === 10) {
      return cleaned;
    }
    
    // Return original if format is unclear
    return num.trim();
  });
  
  return phoneNumbers.join(' / ');
};

export const processPropertyData = (rawData: any[]): Property[] => {
  return rawData.map((item, index) => ({
    id: `property-${index + 1}`,
    address: item.address || '',
    city: extractCityFromAddress(item.address || ''),
    ownerName: item.owner_name || '',
    ownerPhone: fixPhoneNumber(String(item.owner_phone || '')),
    ownerEmail: '',
    tenantName: (item.tenant_name && item.tenant_name !== 'nan' && item.tenant_name !== '') ? item.tenant_name : undefined,
    tenantPhone: fixPhoneNumber(String(item.tenant_phone || '')),
    tenantEmail: '',
    monthlyRent: 0,
    leaseStartDate: item.entry_date && item.entry_date !== 'nan' ? item.entry_date : '',
    leaseEndDate: '',
    status: (item.tenant_name && item.tenant_name !== 'nan' && item.tenant_name !== '') ? 'occupied' : 'vacant'
  }));
};

export const calculatePropertyStats = (properties: Property[]): any => {
  const stats = {
    totalProperties: properties.length,
    occupiedProperties: properties.filter(p => p.status === 'occupied').length,
    vacantProperties: properties.filter(p => p.status === 'vacant').length,
    upcomingRenewals: 0,
  };

  return stats;
};

export const processPropertiesData = async (): Promise<Property[]> => {
  try {
    const response = await fetch('/כל הנכסים - JSON ל-AI.json');
    const rawData = await response.json();
    
    return rawData.map((item: any, index: number) => ({
      id: `property-${index + 1}`,
      address: item.address || '',
      city: extractCityFromAddress(item.address || ''),
      ownerName: item.owner_name || '',
      ownerPhone: fixPhoneNumber(String(item.owner_phone || '')),
      ownerEmail: '',
      tenantName: (item.tenant_name && item.tenant_name !== 'nan' && item.tenant_name !== '') ? item.tenant_name : undefined,
      tenantPhone: fixPhoneNumber(String(item.tenant_phone || '')),
      tenantEmail: '',
      monthlyRent: 0,
      leaseStartDate: item.entry_date && item.entry_date !== 'nan' ? item.entry_date : '',
      leaseEndDate: '',
      status: (item.tenant_name && item.tenant_name !== 'nan' && item.tenant_name !== '') ? 'occupied' : 'vacant'
    }));
  } catch (error) {
    console.error('Error loading properties:', error);
    return [];
  }
};

const extractCityFromAddress = (address: string): string => {
  if (!address) return 'לא צוין';
  
  // Extract city from address patterns
  if (address.includes('בן יהודה') || address.includes('דיזנגוף') || address.includes('הירקון')) {
    return 'תל אביב';
  }
  if (address.includes('רמב"ם') || address.includes('ארלוזרוב')) {
    return 'תל אביב';
  }
  
  return 'תל אביב'; // Default for most properties
};
