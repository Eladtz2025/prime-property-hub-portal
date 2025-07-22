import { Property } from '../types/property';
import { loadPropertiesFromStorage, mergePropertyWithStorage } from './propertyStorage';
import { propertiesRawData } from '../data/propertiesData';

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
  return rawData.map((item, index) => {
    const baseProperty: Property = {
      id: `property-${index + 1}`,
      address: item.address || '',
      city: extractCityFromAddress(item.address || ''),
      ownerName: item.owner_name || '',
      ownerPhone: fixPhoneNumber(String(item.owner_phone || '')),
      ownerEmail: '',
      tenantName: (item.tenant_name && item.tenant_name !== 'nan' && item.tenant_name !== '') ? item.tenant_name : undefined,
      tenantPhone: fixPhoneNumber(String(item.tenant_phone || '')),
      tenantEmail: '',
      monthlyRent: generateRealisticRent(item.address || ''),
      leaseStartDate: item.entry_date && item.entry_date !== 'nan' ? item.entry_date : '',
      leaseEndDate: '',
      status: (item.tenant_name && item.tenant_name !== 'nan' && item.tenant_name !== '') ? 'occupied' : 'vacant',
      createdAt: new Date().toISOString()
    };
    
    // Merge with stored updates
    return mergePropertyWithStorage(baseProperty);
  });
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
    console.log('🔄 Starting to fetch properties data...');
    
    let rawData;
    
    // Try to fetch from JSON file first
    try {
      const response = await fetch('/כל הנכסים - JSON ל-AI.json');
      if (response.ok) {
        rawData = await response.json();
        console.log('✅ Raw data loaded from JSON file, items count:', rawData.length);
      } else {
        throw new Error(`Failed to fetch JSON: ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ JSON file not available, using embedded data:', error);
      rawData = propertiesRawData;
      console.log('✅ Using embedded data, items count:', rawData.length);
    }
    
    console.log('📋 First few items:', rawData.slice(0, 3));
    
    const processedProperties = rawData
      .filter((item: any) => {
        // Filter out header row and invalid entries
        const isValid = item.address && 
                       item.address !== 'רחוב' && 
                       item.address !== 'נובמבר 2021' &&
                       item.owner_name &&
                       item.owner_name !== 'שם בעל דירה';
        
        if (!isValid) {
          console.log('⚠️ Filtering out invalid item:', item.address, item.owner_name);
        }
        return isValid;
      })
      .map((item: any, index: number) => {
        const baseProperty: Property = {
          id: `property-${index + 1}`,
          address: item.address || '',
          city: extractCityFromAddress(item.address || ''),
          ownerName: item.owner_name || '',
          ownerPhone: fixPhoneNumber(String(item.owner_phone || '')),
          ownerEmail: '',
          tenantName: (item.tenant_name && item.tenant_name !== 'nan' && item.tenant_name !== '') ? item.tenant_name : undefined,
          tenantPhone: fixPhoneNumber(String(item.tenant_phone || '')),
          tenantEmail: '',
          monthlyRent: generateRealisticRent(item.address || ''),
          leaseStartDate: item.entry_date && item.entry_date !== 'nan' ? item.entry_date : '',
          leaseEndDate: '',
          status: (item.tenant_name && item.tenant_name !== 'nan' && item.tenant_name !== '') ? 'occupied' : 'vacant',
          createdAt: new Date().toISOString()
        };
        
        // Merge with stored updates
        return mergePropertyWithStorage(baseProperty);
      });
    
    // Load additional properties from localStorage (newly added properties)
    const storedProperties = loadPropertiesFromStorage();
    const newlyAddedProperties = Object.values(storedProperties)
      .filter(property => !processedProperties.find(p => p.id === property.id));
    
    console.log('🏠 Processed properties count:', processedProperties.length);
    console.log('📊 Sample processed property:', processedProperties[0]);
    console.log('✨ Newly added properties:', newlyAddedProperties.length);
    
    return [...processedProperties, ...newlyAddedProperties];
  } catch (error) {
    console.error('❌ Error loading properties:', error);
    // Return empty array as final fallback
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

// Generate realistic rent prices based on area and property type
const generateRealisticRent = (address: string): number => {
  if (!address) return 0;
  
  // Main commercial areas - higher rent
  if (address.includes('בן יהודה') || address.includes('דיזנגוף') || address.includes('הירקון')) {
    return Math.floor(Math.random() * (12000 - 7000) + 7000); // 7000-12000
  }
  
  // Residential areas
  if (address.includes('זנגביל') || address.includes('נחלת בנימין')) {
    return Math.floor(Math.random() * (8000 - 5000) + 5000); // 5000-8000
  }
  
  // Other areas
  return Math.floor(Math.random() * (9000 - 4500) + 4500); // 4500-9000
};
