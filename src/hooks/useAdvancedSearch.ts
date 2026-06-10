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
    // When the search term is mostly digits, also do a format-insensitive
    // phone match (strip non-digits from both sides) so "054-228" matches "0542284477".
    const searchDigits = filters.searchTerm.replace(/\D/g, '');
    const digitRatio = filters.searchTerm.length > 0
      ? searchDigits.length / filters.searchTerm.length
      : 0;
    const isPhoneSearch = searchDigits.length >= 3 && digitRatio >= 0.5;

    return properties.filter(property => {
      const searchFields = [
        property.address || '',
        property.ownerName || '',
        property.tenantName || '',
        property.ownerPhone || '',
        property.tenantPhone || '',
        property.ownerEmail || '',
        property.notes || '',
        property.city || '',
        property.title || '',
        property.description || '',
        property.assignedAgent?.full_name || '',
        property.assignedAgent?.phone || ''
      ];

      if (searchFields.some(field => field.toLowerCase().includes(searchLower))) {
        return true;
      }

      if (isPhoneSearch) {
        const phoneFields = [
          property.ownerPhone || '',
          property.tenantPhone || '',
          property.assignedAgent?.phone || ''
        ];
        return phoneFields.some(field => {
          const fieldDigits = field.replace(/\D/g, '');
          return fieldDigits.length > 0 && fieldDigits.includes(searchDigits);
        });
      }

      return false;
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