import { Property } from '../types/property';

export const fixPhoneNumber = (phone: string): string => {
  if (!phone || phone === 'nan' || phone === '—') return '';
  
  // Handle multiple phone numbers separated by " / "
  const phoneNumbers = phone.split(' / ').map(num => {
    const cleaned = num.trim().replace(/[^\d]/g, '');
    
    // Handle different phone number formats
    if (cleaned.length === 10 && cleaned.startsWith('05')) {
      return `0${cleaned.substring(1)}`;
    } else if (cleaned.length === 9 && cleaned.startsWith('5')) {
      return `0${cleaned}`;
    } else if (cleaned.length === 10) {
      return cleaned;
    }
    
    return cleaned;
  }).filter(num => num.length >= 9);
  
  return phoneNumbers[0] || '';
};

export const processPropertiesData = async (): Promise<Property[]> => {
  try {
    const response = await fetch('/properties-unified.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    return data.properties.map((property: any, index: number) => ({
      id: `property-${index}`,
      address: property.address,
      city: property.city,
      ownerName: property.owner_name,
      ownerPhone: property.owner_phone,
      tenantName: property.tenant_name || '',
      tenantPhone: property.tenant_phone || '',
      status: 'unknown' as const,
      contactStatus: 'not_contacted' as const,
      contactAttempts: 0,
      notes: property.notes
    }));
  } catch (error) {
    console.error('Error loading properties:', error);
    return [];
  }
};