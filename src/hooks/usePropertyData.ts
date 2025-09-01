import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Property } from '@/types/property';
import { processPropertiesData } from '@/utils/dataProcessor';
import { savePropertyToStorage, loadPropertiesFromStorage } from '@/utils/propertyStorage';
import { logger } from '@/utils/logger';

const QUERY_KEYS = {
  properties: ['properties'] as const,
  propertyStats: ['property-stats'] as const,
};

export const usePropertyData = () => {
  const queryClient = useQueryClient();
  const log = logger.component('usePropertyData');

  const propertiesQuery = useQuery({
    queryKey: QUERY_KEYS.properties,
    queryFn: async (): Promise<Property[]> => {
      try {
        log.info('Loading properties data');
        const properties = await processPropertiesData();
        log.info(`Successfully loaded ${properties.length} properties`);
        return properties;
      } catch (error) {
        log.error('Failed to load properties', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const addPropertyMutation = useMutation({
    mutationFn: async (newProperty: Property): Promise<Property> => {
      try {
        log.info('Adding new property', { id: newProperty.id, address: newProperty.address });
        await savePropertyToStorage(newProperty);
        return newProperty;
      } catch (error) {
        log.error('Failed to save property', error);
        throw error;
      }
    },
    onSuccess: (newProperty) => {
      queryClient.setQueryData<Property[]>(QUERY_KEYS.properties, (oldData) => {
        if (!oldData) return [newProperty];
        return [...oldData, newProperty];
      });
      log.info('Property added successfully', { id: newProperty.id });
    },
    onError: (error) => {
      log.error('Property addition failed', error);
    }
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async (updatedProperty: Property): Promise<Property> => {
      try {
        log.info('Updating property', { id: updatedProperty.id });
        await savePropertyToStorage(updatedProperty);
        return updatedProperty;
      } catch (error) {
        log.error('Failed to update property', error);
        throw error;
      }
    },
    onSuccess: (updatedProperty) => {
      queryClient.setQueryData<Property[]>(QUERY_KEYS.properties, (oldData) => {
        if (!oldData) return [updatedProperty];
        return oldData.map(p => p.id === updatedProperty.id ? updatedProperty : p);
      });
      log.info('Property updated successfully', { id: updatedProperty.id });
    },
    onError: (error) => {
      log.error('Property update failed', error);
    }
  });

  return {
    // Query data
    properties: propertiesQuery.data ?? [],
    isLoading: propertiesQuery.isLoading,
    isError: propertiesQuery.isError,
    error: propertiesQuery.error,
    
    // Mutations
    addProperty: addPropertyMutation.mutate,
    updateProperty: updatePropertyMutation.mutate,
    isAddingProperty: addPropertyMutation.isPending,
    isUpdatingProperty: updatePropertyMutation.isPending,
    
    // Utilities
    refetch: propertiesQuery.refetch,
    invalidateProperties: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.properties }),
  };
};

export const usePropertyStats = (properties: Property[]) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.propertyStats, properties.length],
    queryFn: () => {
      const total = properties.length;
      const occupied = properties.filter(p => p.status === 'occupied').length;
      const vacant = properties.filter(p => p.status === 'vacant').length;
      const unknown = properties.filter(p => p.status === 'unknown').length;
      const contacted = properties.filter(p => p.contactStatus !== 'not_contacted').length;
      const notContacted = properties.filter(p => p.contactStatus === 'not_contacted').length;
      const upcomingRenewals = properties.filter(p => {
        if (!p.leaseEndDate) return false;
        const endDate = new Date(p.leaseEndDate);
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        return endDate <= threeMonthsFromNow;
      }).length;

      return {
        total,
        occupied,
        vacant,
        unknown,
        contacted,
        notContacted,
        upcomingRenewals,
        occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
      };
    },
    enabled: properties.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};