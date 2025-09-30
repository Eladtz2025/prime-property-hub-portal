import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/property';
import { logger } from '@/utils/logger';

const log = logger.component('useSupabasePropertyData');

// Transform Supabase data to Property interface
function transformSupabaseProperty(dbProperty: any, owner?: any, tenant?: any): Property {
  return {
    id: dbProperty.id,
    address: dbProperty.address,
    city: dbProperty.city,
    ownerName: owner?.full_name || 'Unknown Owner',
    ownerPhone: owner?.phone || undefined,
    ownerEmail: owner?.email || undefined,
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

  // Fetch all properties with their owners and tenants
  const propertiesQuery = useQuery({
    queryKey: ['supabase-properties'],
    queryFn: async (): Promise<Property[]> => {
      try {
        log.info('Loading properties from Supabase');

        // Get properties with owner relationships
        const { data: propertyOwnerships, error: ownershipError } = await supabase
          .from('property_owners')
          .select(`
            property_id,
            ownership_percentage,
            properties!inner(*),
            profiles!inner(*)
          `);

        if (ownershipError) {
          log.error('Failed to load property ownerships:', ownershipError);
          throw ownershipError;
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
        const properties: Property[] = [];
        const processedProperties = new Set<string>();

        for (const ownership of propertyOwnerships || []) {
          const propertyId = ownership.property_id;
          
          if (processedProperties.has(propertyId)) continue;
          processedProperties.add(propertyId);

          const property = ownership.properties;
          const owner = ownership.profiles;
          const tenant = tenants?.find(t => t.property_id === propertyId);

          properties.push(transformSupabaseProperty(property, owner, tenant));
        }

        log.info(`Successfully loaded ${properties.length} properties from Supabase`);
        return properties;

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
        
        // Insert property
        const { error: propertyError } = await supabase
          .from('properties')
          .insert({
            id: propertyId,
            address: newProperty.address,
            city: newProperty.city,
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

        // Create owner profile if needed and link to property
        if (newProperty.ownerName) {
          const ownerId = crypto.randomUUID();
          
          const { error: ownerError } = await supabase
            .from('profiles')
            .upsert({
              id: ownerId,
              email: newProperty.ownerEmail || `${newProperty.ownerName.replace(/\s+/g, '').toLowerCase()}@example.com`,
              full_name: newProperty.ownerName,
              phone: newProperty.ownerPhone,
              role: 'property_owner',
              is_approved: true,
            }, { onConflict: 'email' });

          if (ownerError) {
            log.warn('Failed to create owner profile, continuing:', ownerError);
          }

          // Link property to owner
          const { error: linkError } = await supabase
            .from('property_owners')
            .insert({
              property_id: propertyId,
              owner_id: ownerId,
              ownership_percentage: 100,
            });

          if (linkError) {
            log.error('Failed to link property to owner:', linkError);
          }
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
    invalidateProperties: () => queryClient.invalidateQueries({ queryKey: ['supabase-properties'] }),
  };
};