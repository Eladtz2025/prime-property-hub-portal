import { useState, useMemo, useCallback } from 'react';
import { Property } from '@/types/property';

interface BasicSearchFilters {
  searchTerm: string;
}

const DEFAULT_FILTERS: BasicSearchFilters = {
  searchTerm: ''
};

export const useAdvancedSearch = (properties: Property[]) => {
  const [filters, setFilters] = useState<BasicSearchFilters>(DEFAULT_FILTERS);

  // Calculate owner property counts for display purposes
  const ownerPropertyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    properties.forEach(property => {
      const ownerKey = `${property.ownerName}-${property.ownerPhone || ''}`;
      counts[ownerKey] = (counts[ownerKey] || 0) + 1;
    });
    return counts;
  }, [properties]);

  // Filter properties based on search term only
  const filteredProperties = useMemo(() => {
    if (!filters.searchTerm) {
      return properties;
    }

    const searchLower = filters.searchTerm.toLowerCase();
    return properties.filter(property => {
      const searchFields = [
        property.address,
        property.ownerName,
        property.tenantName || '',
        property.ownerPhone || '',
        property.tenantPhone || '',
        property.ownerEmail || '',
        property.tenantEmail || '',
        property.notes || ''
      ];

      return searchFields.some(field => 
        field.toLowerCase().includes(searchLower)
      );
    });
  }, [properties, filters.searchTerm]);

  // Clear search
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    filters,
    setFilters,
    filteredProperties,
    clearFilters,
    ownerPropertyCounts
  };
};