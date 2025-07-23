import { Property } from '../types/property';

interface DuplicateGroup {
  key: string;
  properties: Property[];
  duplicateType: 'phone';
}

// Helper function to normalize phone numbers for comparison
const normalizePhoneNumber = (phone: string): string => {
  return phone
    .replace(/\D/g, '') // Remove all non-digits
    .replace(/^972/, '') // Remove country code 972
    .replace(/^0/, ''); // Remove leading zero
};

// Helper function to check if two phone numbers are the same
const arePhoneNumbersSame = (phone1: string, phone2: string): boolean => {
  if (!phone1 || !phone2) return false;
  
  const norm1 = normalizePhoneNumber(phone1);
  const norm2 = normalizePhoneNumber(phone2);
  
  return norm1 === norm2 && norm1.length >= 8; // Israeli phone numbers are at least 8 digits
};

export const detectDuplicates = (properties: Property[]): DuplicateGroup[] => {
  const duplicateGroups: DuplicateGroup[] = [];
  const processedIds = new Set<string>();
  
  for (let i = 0; i < properties.length; i++) {
    if (processedIds.has(properties[i].id)) continue;
    
    const currentProperty = properties[i];
    
    // Skip properties without phone numbers
    if (!currentProperty.ownerPhone) continue;
    
    const duplicates: Property[] = [currentProperty];
    
    for (let j = i + 1; j < properties.length; j++) {
      if (processedIds.has(properties[j].id)) continue;
      
      const compareProperty = properties[j];
      
      // Check if owner phone numbers match
      if (arePhoneNumbersSame(currentProperty.ownerPhone!, compareProperty.ownerPhone!)) {
        duplicates.push(compareProperty);
        processedIds.add(compareProperty.id);
      }
      
      // Also check if owner phone matches tenant phone (common mistake)
      if (compareProperty.tenantPhone && 
          arePhoneNumbersSame(currentProperty.ownerPhone!, compareProperty.tenantPhone)) {
        duplicates.push(compareProperty);
        processedIds.add(compareProperty.id);
      }
      
      // Check if tenant phone matches owner phone
      if (currentProperty.tenantPhone && 
          arePhoneNumbersSame(currentProperty.tenantPhone, compareProperty.ownerPhone!)) {
        duplicates.push(compareProperty);
        processedIds.add(compareProperty.id);
      }
    }
    
    if (duplicates.length > 1) {
      processedIds.add(currentProperty.id);
      
      // Sort duplicates by completeness of data (most complete first)
      duplicates.sort((a, b) => {
        const aCompleteness = [
          a.ownerPhone,
          a.ownerEmail,
          a.tenantName,
          a.tenantPhone,
          a.leaseEndDate,
          a.monthlyRent,
          a.notes
        ].filter(Boolean).length;
        
        const bCompleteness = [
          b.ownerPhone,
          b.ownerEmail,
          b.tenantName,
          b.tenantPhone,
          b.leaseEndDate,
          b.monthlyRent,
          b.notes
        ].filter(Boolean).length;
        
        if (aCompleteness !== bCompleteness) {
          return bCompleteness - aCompleteness; // More complete first
        }
        
        // If completeness is equal, sort by creation date (older first)
        const aDate = new Date(a.createdAt || '').getTime() || 0;
        const bDate = new Date(b.createdAt || '').getTime() || 0;
        
        return aDate - bDate;
      });
      
      duplicateGroups.push({
        key: `phone-${currentProperty.id}`,
        properties: duplicates,
        duplicateType: 'phone'
      });
    }
  }
  
  return duplicateGroups;
};

export const getDuplicateStats = (properties: Property[]) => {
  const groups = detectDuplicates(properties);
  const totalDuplicates = groups.reduce((sum, group) => sum + group.properties.length, 0);
  
  return {
    groups: groups.length,
    totalDuplicates,
    phoneDuplicates: groups.length // All duplicates are now phone-based
  };
};