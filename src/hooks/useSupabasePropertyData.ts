import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/property';
import { logger } from '@/utils/logger';

const log = logger.component('useSupabasePropertyData');

// Transform Supabase data to Property interface
function transformSupabaseProperty(dbProperty: any, tenant?: any): Property {
  return {
    id: dbProperty.id,
    address: dbProperty.address,
    city: dbProperty.city,
    ownerName: dbProperty.owner_name || 'Unknown Owner',
    ownerPhone: dbProperty.owner_phone || undefined,
    ownerEmail: undefined, // Not stored in properties table yet
    tenantName: tenant?.name || undefined,
    tenantPhone: tenant?.phone || undefined,
    tenantEmail: tenant?.email || undefined,
    monthlyRent: tenant?.monthly_rent || undefined,
    leaseStartDate: tenant?.lease_start_date || undefined,
    leaseEndDate: tenant?.lease_end_date || undefined,
    status: dbProperty.status || 'unknown',
    contactStatus: dbProperty.contact_status || 'not_contacted',
    lastContactDate: dbProperty.last_contact_date || undefined,
    contactNotes: dbProperty.contact_notes || undefined,
    contactAttempts: dbProperty.contact_attempts || 0,
    propertySize: dbProperty.property_size || undefined,
    floor: dbProperty.floor || undefined,
    rooms: dbProperty.rooms || undefined,
    notes: dbProperty.notes || undefined,
    lastUpdated: dbProperty.updated_at,
    createdAt: dbProperty.created_at,
  };
}

export const useSupabasePropertyData = () => {
  const queryClient = useQueryClient();

  // Fetch all properties with their tenants
  const propertiesQuery = useQuery({
    queryKey: ['supabase-properties'],
    queryFn: async (): Promise<Property[]> => {
      try {
        log.info('Loading properties from Supabase');

        // Get all properties (owner data is now stored directly in properties table)
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('*');

        if (propertiesError) {
          log.error('Failed to load properties:', propertiesError);
          throw propertiesError;
        }

        // Get tenants for properties
        const { data: tenants, error: tenantsError } = await supabase
          .from('tenants')
          .select('*')
          .eq('is_active', true);

        if (tenantsError) {
          log.error('Failed to load tenants:', tenantsError);
          throw tenantsError;
        }

        // Transform and combine data
        const transformedProperties: Property[] = [];

        for (const property of properties || []) {
          const tenant = tenants?.find(t => t.property_id === property.id);
          transformedProperties.push(transformSupabaseProperty(property, tenant));
        }

        log.info(`Successfully loaded ${transformedProperties.length} properties from Supabase`);
        return transformedProperties;

      } catch (error) {
        log.error('Failed to load properties from Supabase:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: async (updatedProperty: Property): Promise<Property> => {
      try {
        log.info('Updating property in Supabase', { id: updatedProperty.id });

        const { error } = await supabase
          .from('properties')
          .update({
            address: updatedProperty.address,
            city: updatedProperty.city,
            owner_name: updatedProperty.ownerName,
            owner_phone: updatedProperty.ownerPhone,
            status: updatedProperty.status,
            contact_status: updatedProperty.contactStatus,
            contact_attempts: updatedProperty.contactAttempts,
            last_contact_date: updatedProperty.lastContactDate ? new Date(updatedProperty.lastContactDate).toISOString() : null,
            contact_notes: updatedProperty.contactNotes,
            property_size: updatedProperty.propertySize,
            floor: updatedProperty.floor,
            rooms: updatedProperty.rooms,
            notes: updatedProperty.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', updatedProperty.id);

        if (error) {
          log.error('Failed to update property:', error);
          throw error;
        }

        return updatedProperty;
      } catch (error) {
        log.error('Failed to update property:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase-properties'] });
      log.info('Property updated successfully');
    },
    onError: (error) => {
      log.error('Property update failed:', error);
    }
  });

  // Add new property mutation
  const addPropertyMutation = useMutation({
    mutationFn: async (newProperty: Omit<Property, 'id'>): Promise<Property> => {
      try {
        log.info('Adding new property to Supabase');

        const propertyId = crypto.randomUUID();
        
        // Insert property with owner data
        const { error: propertyError } = await supabase
          .from('properties')
          .insert({
            id: propertyId,
            address: newProperty.address,
            city: newProperty.city,
            owner_name: newProperty.ownerName,
            owner_phone: newProperty.ownerPhone,
            status: newProperty.status,
            contact_status: newProperty.contactStatus,
            contact_attempts: newProperty.contactAttempts,
            property_size: newProperty.propertySize,
            floor: newProperty.floor,
            rooms: newProperty.rooms,
            notes: newProperty.notes,
          });

        if (propertyError) {
          log.error('Failed to insert property:', propertyError);
          throw propertyError;
        }

        return { ...newProperty, id: propertyId };
      } catch (error) {
        log.error('Failed to add property:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase-properties'] });
      log.info('Property added successfully');
    },
    onError: (error) => {
      log.error('Property addition failed:', error);
    }
  });

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string): Promise<void> => {
      try {
        log.info('Deleting property from Supabase', { id: propertyId });

        const { error } = await supabase
          .from('properties')
          .delete()
          .eq('id', propertyId);

        if (error) {
          log.error('Failed to delete property:', error);
          throw error;
        }
      } catch (error) {
        log.error('Failed to delete property:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase-properties'] });
      log.info('Property deleted successfully');
    },
    onError: (error) => {
      log.error('Property deletion failed:', error);
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
    deleteProperty: deletePropertyMutation.mutate,
    isAddingProperty: addPropertyMutation.isPending,
    isUpdatingProperty: updatePropertyMutation.isPending,
    isDeletingProperty: deletePropertyMutation.isPending,
    
    // Utilities
    refetch: propertiesQuery.refetch,
    invalidateProperties: () => queryClient.invalidateQueries({ queryKey: ['supabase-properties'] }),
  };
};