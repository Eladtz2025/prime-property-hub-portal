import { useState, useMemo, useCallback } from 'react';
import { Property } from '@/types/property';
import { SearchFilters, SavedSearch } from '@/components/AdvancedSearchFilters';

const DEFAULT_FILTERS: SearchFilters = {
  searchTerm: '',
  status: 'all',
  priceRange: [0, 20000],
  ownerPropertyCount: [1, 10],
  hasOwnerPhone: false,
  hasTenantPhone: false,
  hasEmail: false,
  searchOperator: 'AND'
};

export const useAdvancedSearch = (properties: Property[]) => {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => {
    const saved = localStorage.getItem('savedSearches');
    return saved ? JSON.parse(saved) : [];
  });

  // Calculate max values for sliders
  const maxPrice = useMemo(() => {
    const prices = properties
      .map(p => p.monthlyRent || 0)
      .filter(price => price > 0);
    return prices.length > 0 ? Math.max(...prices) : 20000;
  }, [properties]);

  // Calculate owner property counts
  const ownerPropertyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    properties.forEach(property => {
      const ownerKey = `${property.ownerName}-${property.ownerPhone || ''}`;
      counts[ownerKey] = (counts[ownerKey] || 0) + 1;
    });
    return counts;
  }, [properties]);

  const maxOwnerCount = useMemo(() => {
    const counts = Object.values(ownerPropertyCounts);
    return counts.length > 0 ? Math.max(...counts) : 10;
  }, [ownerPropertyCounts]);

  // Initialize filters with actual max values
  const initializeFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      priceRange: [0, maxPrice],
      ownerPropertyCount: [1, maxOwnerCount]
    }));
  }, [maxPrice, maxOwnerCount]);

  // Filter properties based on all criteria
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Text search
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
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

        const matches = searchFields.filter(field => 
          field.toLowerCase().includes(searchLower)
        );

        if (filters.searchOperator === 'AND') {
          if (matches.length === 0) return false;
        } else {
          // OR logic - at least one field should match
          if (matches.length === 0) return false;
        }
      }

      // Status filter
      if (filters.status !== 'all' && property.status !== filters.status) {
        return false;
      }

      // Price range filter
      const price = property.monthlyRent || 0;
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }

      // Owner property count filter
      const ownerKey = `${property.ownerName}-${property.ownerPhone || ''}`;
      const ownerCount = ownerPropertyCounts[ownerKey] || 1;
      if (ownerCount < filters.ownerPropertyCount[0] || ownerCount > filters.ownerPropertyCount[1]) {
        return false;
      }

      // Lease expiry date range
      if (filters.leaseExpiryStart || filters.leaseExpiryEnd) {
        if (!property.leaseEndDate) return false;
        
        const leaseDate = new Date(property.leaseEndDate);
        
        if (filters.leaseExpiryStart && leaseDate < filters.leaseExpiryStart) {
          return false;
        }
        
        if (filters.leaseExpiryEnd && leaseDate > filters.leaseExpiryEnd) {
          return false;
        }
      }

      // Contact information filters
      if (filters.hasOwnerPhone && !property.ownerPhone) {
        return false;
      }

      if (filters.hasTenantPhone && !property.tenantPhone) {
        return false;
      }

      if (filters.hasEmail && !property.ownerEmail && !property.tenantEmail) {
        return false;
      }

      return true;
    });
  }, [properties, filters, ownerPropertyCounts]);

  // Save search
  const saveSearch = useCallback((name: string, searchFilters: SearchFilters) => {
    const newSearch: SavedSearch = {
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      filters: { ...searchFilters },
      createdAt: new Date()
    };

    const updatedSearches = [...savedSearches, newSearch];
    setSavedSearches(updatedSearches);
    localStorage.setItem('savedSearches', JSON.stringify(updatedSearches));
  }, [savedSearches]);

  // Load search
  const loadSearch = useCallback((search: SavedSearch) => {
    setFilters(search.filters);
  }, []);

  // Delete search
  const deleteSearch = useCallback((searchId: string) => {
    const updatedSearches = savedSearches.filter(s => s.id !== searchId);
    setSavedSearches(updatedSearches);
    localStorage.setItem('savedSearches', JSON.stringify(updatedSearches));
  }, [savedSearches]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      ...DEFAULT_FILTERS,
      priceRange: [0, maxPrice],
      ownerPropertyCount: [1, maxOwnerCount]
    });
  }, [maxPrice, maxOwnerCount]);

  return {
    filters,
    setFilters,
    filteredProperties,
    savedSearches,
    saveSearch,
    loadSearch,
    deleteSearch,
    clearFilters,
    initializeFilters,
    maxPrice,
    maxOwnerCount,
    ownerPropertyCounts
  };
};