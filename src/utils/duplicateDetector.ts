import { Property } from '../types/property';

interface DuplicateGroup {
  key: string;
  properties: Property[];
  duplicateType: 'address' | 'owner' | 'both';
}

// Helper function to normalize strings for comparison
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[״"׳']/g, '') // Remove Hebrew quotation marks
    .replace(/[,.\-]/g, ''); // Remove punctuation
};

// Helper function to check if two addresses are similar
const areAddressesSimilar = (addr1: string, addr2: string): boolean => {
  const norm1 = normalizeString(addr1);
  const norm2 = normalizeString(addr2);
  
  // Exact match after normalization
  if (norm1 === norm2) return true;
  
  // Check if one is contained in the other (for cases like "רחוב הרצל 5" vs "הרצל 5")
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return true;
  }
  
  // Split by spaces and check for significant overlap
  const words1 = norm1.split(' ').filter(w => w.length > 1);
  const words2 = norm2.split(' ').filter(w => w.length > 1);
  
  if (words1.length === 0 || words2.length === 0) return false;
  
  const commonWords = words1.filter(word => words2.includes(word));
  const similarity = commonWords.length / Math.max(words1.length, words2.length);
  
  return similarity >= 0.7; // 70% word overlap
};

// Helper function to check if two owner names are similar
const areOwnerNamesSimilar = (name1: string, name2: string): boolean => {
  const norm1 = normalizeString(name1);
  const norm2 = normalizeString(name2);
  
  // Exact match
  if (norm1 === norm2) return true;
  
  // Check if names contain each other (for cases like "יוסי כהן" vs "יוסף כהן")
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  
  // At least one word should match exactly
  const hasExactWordMatch = words1.some(w1 => 
    words2.some(w2 => w1 === w2 && w1.length > 2)
  );
  
  if (!hasExactWordMatch) return false;
  
  // Check for abbreviations or similar names
  const similarity = words1.filter(word => 
    words2.some(w2 => w2.includes(word) || word.includes(w2))
  ).length / Math.max(words1.length, words2.length);
  
  return similarity >= 0.6; // 60% similarity
};

export const detectDuplicates = (properties: Property[]): DuplicateGroup[] => {
  const duplicateGroups: DuplicateGroup[] = [];
  const processedIds = new Set<string>();
  
  for (let i = 0; i < properties.length; i++) {
    if (processedIds.has(properties[i].id)) continue;
    
    const currentProperty = properties[i];
    const duplicates: Property[] = [currentProperty];
    let duplicateType: 'address' | 'owner' | 'both' = 'address';
    
    for (let j = i + 1; j < properties.length; j++) {
      if (processedIds.has(properties[j].id)) continue;
      
      const compareProperty = properties[j];
      
      const addressMatch = areAddressesSimilar(currentProperty.address, compareProperty.address);
      const ownerMatch = areOwnerNamesSimilar(currentProperty.ownerName, compareProperty.ownerName);
      
      if (addressMatch && ownerMatch) {
        duplicates.push(compareProperty);
        processedIds.add(compareProperty.id);
        duplicateType = 'both';
      } else if (addressMatch) {
        duplicates.push(compareProperty);
        processedIds.add(compareProperty.id);
        if (duplicateType !== 'both') {
          duplicateType = 'address';
        }
      } else if (ownerMatch) {
        // Only consider owner duplicates if they have multiple properties
        // This helps avoid false positives for landlords with multiple properties
        const ownerProperties = properties.filter(p => 
          areOwnerNamesSimilar(p.ownerName, currentProperty.ownerName)
        );
        
        if (ownerProperties.length > 2) { // If owner has more than 2 properties, it's likely legitimate
          continue;
        }
        
        duplicates.push(compareProperty);
        processedIds.add(compareProperty.id);
        if (duplicateType !== 'both' && duplicateType !== 'address') {
          duplicateType = 'owner';
        }
      }
    }
    
    if (duplicates.length > 1) {
      processedIds.add(currentProperty.id);
      
      // Sort duplicates by creation date (oldest first) or by completeness of data
      duplicates.sort((a, b) => {
        // Primary property should be the one with more complete data
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
        
        // If completeness is equal, sort by creation date
        const aDate = new Date(a.createdAt || '').getTime() || 0;
        const bDate = new Date(b.createdAt || '').getTime() || 0;
        
        return aDate - bDate; // Older first
      });
      
      duplicateGroups.push({
        key: `${duplicateType}-${currentProperty.id}`,
        properties: duplicates,
        duplicateType
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
    addressDuplicates: groups.filter(g => g.duplicateType === 'address').length,
    ownerDuplicates: groups.filter(g => g.duplicateType === 'owner').length,
    bothDuplicates: groups.filter(g => g.duplicateType === 'both').length
  };
};