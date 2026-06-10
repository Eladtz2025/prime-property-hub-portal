import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/property';
import { logger } from '@/utils/logger';
import { triggerAutoScan } from '@/hooks/useAutoScanProject';
import { useToast } from '@/hooks/use-toast';

const log = logger.component('useSupabasePropertyData');

const PROPERTIES_KEY = ['supabase-properties'] as const;

// Transform Supabase data to Property interface
function transformSupabaseProperty(dbProperty: any, tenant?: any): Property {
  return {
    id: dbProperty.id,
    address: dbProperty.address,
    city: dbProperty.city,
    ownerName: dbProperty.owner_name || 'Unknown Owner',
    ownerPhone: dbProperty.owner_phone || undefined,
    ownerEmail: dbProperty.owner_email || undefined,
    tenantName: tenant?.name || undefined,
    tenantPhone: tenant?.phone || undefined,
    // Prefer the property's own rent (what the edit form writes); fall back to the tenant row.
    // Use ?? throughout so a legitimate 0 is preserved instead of being coerced away.
    monthlyRent: dbProperty.monthly_rent ?? tenant?.monthly_rent ?? undefined,
    leaseStartDate: tenant?.lease_start_date || undefined,
    leaseEndDate: tenant?.lease_end_date || undefined,
    status: dbProperty.status || 'unknown',
    contactStatus: dbProperty.contact_status || 'not_contacted',
    lastContactDate: dbProperty.last_contact_date || undefined,
    contactNotes: dbProperty.contact_notes || undefined,
    contactAttempts: dbProperty.contact_attempts || 0,
    propertySize: dbProperty.property_size ?? undefined,
    floor: dbProperty.floor ?? undefined,
    rooms: dbProperty.rooms ?? undefined,
    parking: dbProperty.parking || false,
    elevator: dbProperty.elevator || false,
    balcony: dbProperty.balcony || false,
    mamad: dbProperty.mamad || false,
    yard: dbProperty.yard || false,
    roof: dbProperty.roof || false,
    furnished: dbProperty.furnished || false,
    balconyYardSize: dbProperty.balcony_yard_size ?? undefined,
    municipalTax: dbProperty.municipal_tax ?? undefined,
    buildingCommitteeFee: dbProperty.building_committee_fee ?? undefined,
    bathrooms: dbProperty.bathrooms ?? undefined,
    buildingFloors: dbProperty.building_floors ?? undefined,
    title: dbProperty.title || undefined,
    description: dbProperty.description || undefined,
    acquisitionCost: dbProperty.acquisition_cost ?? undefined,
    renovationCosts: dbProperty.renovation_costs ?? undefined,
    currentMarketValue: dbProperty.current_market_value ?? undefined,
    featured: dbProperty.featured || false,
    showManagementBadge: dbProperty.show_management_badge !== false,
    notes: dbProperty.notes || undefined,
    roomsRange: dbProperty.rooms_range || undefined,
    sizeRange: dbProperty.size_range || undefined,
    unitsCount: dbProperty.units_count ?? undefined,
    hasStorage: dbProperty.has_storage || false,
    projectStatus: dbProperty.project_status || undefined,
    lastUpdated: dbProperty.updated_at,
    createdAt: dbProperty.created_at,
    property_type: dbProperty.property_type || 'rental',
    assignedUserId: dbProperty.assigned_user_id || undefined,
    trackingUrl: dbProperty.tracking_url || undefined,
    assignedAgent: dbProperty.assigned_agent ? {
      id: dbProperty.assigned_agent.id,
      full_name: dbProperty.assigned_agent.full_name,
      phone: dbProperty.assigned_agent.phone
    } : undefined,
    images: dbProperty.property_images?.map((img: any) => ({
      id: img.id,
      name: img.alt_text || '',
      url: img.image_url,
      isPrimary: img.is_main || false,
      uploadedAt: dbProperty.created_at,
      mediaType: img.media_type || 'image',
    })).sort((a: any, b: any) => {
      if (a.isPrimary) return -1;
      if (b.isPrimary) return 1;
      return 0;
    }) || [],
  };
}

export const useSupabasePropertyData = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all properties with their tenants
  const propertiesQuery = useQuery({
    queryKey: ['supabase-properties'],
    queryFn: async (): Promise<Property[]> => {
      try {
        log.info('Loading properties from Supabase');

        // Get all properties with their images
        const PROPERTIES_SELECT = `
        *,
        property_images (
          id,
          image_url,
          is_main,
          order_index,
          alt_text
        ),
        assigned_agent:profiles!assigned_user_id (
          id,
          full_name,
          phone
        )
      `;

        let { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select(PROPERTIES_SELECT)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        // Resilience: if the soft-delete migration hasn't been applied yet, the
        // deleted_at column won't exist. Fall back so the admin page still loads.
        if (propertiesError && /deleted_at/i.test(propertiesError.message || '')) {
          log.warn('deleted_at column missing — falling back (apply the soft-delete migration)');
          ({ data: properties, error: propertiesError } = await supabase
            .from('properties')
            .select(PROPERTIES_SELECT)
            .order('created_at', { ascending: false }));
        }

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
            owner_email: updatedProperty.ownerEmail || null,
            status: updatedProperty.status,
            contact_status: updatedProperty.contactStatus,
            contact_attempts: updatedProperty.contactAttempts,
            last_contact_date: updatedProperty.lastContactDate ? new Date(updatedProperty.lastContactDate).toISOString() : null,
            contact_notes: updatedProperty.contactNotes,
            property_size: updatedProperty.propertySize,
            floor: updatedProperty.floor,
            rooms: updatedProperty.rooms,
            monthly_rent: updatedProperty.monthlyRent,
            parking: updatedProperty.parking || false,
            elevator: updatedProperty.elevator || false,
            balcony: updatedProperty.balcony || false,
            mamad: (updatedProperty as any).mamad || false,
            yard: updatedProperty.yard || false,
            roof: (updatedProperty as any).roof || false,
            furnished: (updatedProperty as any).furnished || false,
            balcony_yard_size: updatedProperty.balconyYardSize ?? null,
            municipal_tax: updatedProperty.municipalTax ?? null,
            building_committee_fee: updatedProperty.buildingCommitteeFee ?? null,
            bathrooms: (updatedProperty as any).bathrooms ?? null,
            building_floors: (updatedProperty as any).buildingFloors ?? null,
            title: (updatedProperty as any).title || null,
            description: (updatedProperty as any).description || null,
            acquisition_cost: (updatedProperty as any).acquisitionCost ?? null,
            renovation_costs: (updatedProperty as any).renovationCosts ?? null,
            current_market_value: (updatedProperty as any).currentMarketValue ?? null,
            featured: (updatedProperty as any).featured || false,
            show_management_badge: (updatedProperty as any).showManagementBadge !== false,
            notes: updatedProperty.notes,
            rooms_range: updatedProperty.roomsRange || null,
            size_range: updatedProperty.sizeRange || null,
            units_count: updatedProperty.unitsCount ?? null,
            has_storage: updatedProperty.hasStorage || false,
            project_status: updatedProperty.projectStatus || null,
            tracking_url: updatedProperty.trackingUrl || null,
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
    onSuccess: (updated) => {
      // Reflect the edit in the cache immediately so it can't visually "revert"
      // in the window before the refetch resolves.
      queryClient.setQueryData<Property[]>(PROPERTIES_KEY, (old) =>
        Array.isArray(old) ? old.map((p) => (p.id === updated.id ? updated : p)) : old
      );
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
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
        
        // Insert property with all data
        const { error: propertyError } = await supabase
          .from('properties')
          .insert({
            id: propertyId,
            address: newProperty.address,
            city: newProperty.city,
            owner_name: newProperty.ownerName,
            owner_phone: newProperty.ownerPhone,
            owner_email: newProperty.ownerEmail || null,
            status: newProperty.status,
            contact_status: newProperty.contactStatus,
            contact_attempts: newProperty.contactAttempts,
            property_size: newProperty.propertySize,
            floor: newProperty.floor,
            rooms: newProperty.rooms,
            notes: newProperty.notes,
            // Missing fields that weren't being saved
            monthly_rent: newProperty.monthlyRent || null,
            property_type: newProperty.property_type || 'rental',
            bathrooms: (newProperty as any).bathrooms || null,
            parking: (newProperty as any).parking || false,
            elevator: (newProperty as any).elevator || false,
            balcony: (newProperty as any).balcony || false,
            mamad: (newProperty as any).mamad || false,
            yard: (newProperty as any).yard || false,
            roof: (newProperty as any).roof || false,
            furnished: (newProperty as any).furnished || false,
            balcony_yard_size: (newProperty as any).balconyYardSize || null,
            building_floors: (newProperty as any).buildingFloors || null,
            municipal_tax: (newProperty as any).municipalTax || null,
            building_committee_fee: (newProperty as any).buildingCommitteeFee || null,
            title: (newProperty as any).title || null,
            description: (newProperty as any).description || null,
            acquisition_cost: (newProperty as any).acquisitionCost || null,
            renovation_costs: (newProperty as any).renovationCosts || null,
            current_market_value: (newProperty as any).currentMarketValue || null,
            featured: (newProperty as any).featured || false,
            assigned_user_id: (newProperty as any).assigned_user_id || (newProperty as any).assignedUserId || null,
            rooms_range: newProperty.roomsRange || null,
            size_range: newProperty.sizeRange || null,
            units_count: newProperty.unitsCount || null,
            has_storage: newProperty.hasStorage || false,
            project_status: newProperty.projectStatus || null,
            tracking_url: (newProperty as any).trackingUrl || null,
          });

        if (propertyError) {
          log.error('Failed to insert property:', propertyError);
          throw propertyError;
        }

        // Persist tenant/lease data whenever ANY of it is provided — not only when
        // both tenant name AND rent exist (previously lease dates entered without a
        // rent were silently dropped).
        let tenantWarning = false;
        const hasTenantOrLease = !!(
          newProperty.tenantName ||
          newProperty.tenantPhone ||
          newProperty.leaseStartDate ||
          newProperty.leaseEndDate
        );
        if (hasTenantOrLease) {
          const { error: tenantError } = await supabase
            .from('tenants')
            .insert({
              property_id: propertyId,
              // tenants.name is NOT NULL — fall back to a placeholder so lease dates
              // entered without a tenant name are still preserved (editable later).
              name: newProperty.tenantName?.trim() || 'דייר',
              phone: newProperty.tenantPhone || null,
              monthly_rent: newProperty.monthlyRent ?? null,
              lease_start_date: newProperty.leaseStartDate || null,
              lease_end_date: newProperty.leaseEndDate || null,
              is_active: true,
            });

          if (tenantError) {
            // Don't swallow it silently — flag so onSuccess can warn the user.
            log.error('Failed to insert tenant:', tenantError);
            tenantWarning = true;
          }
        }

        // Trigger auto-scan if this is a project with a tracking URL
        const trackingUrl = (newProperty as any).trackingUrl;
        if (trackingUrl && newProperty.property_type === 'project') {
          // Fire and forget — don't block the UI
          triggerAutoScan(propertyId);
        }

        return { ...newProperty, id: propertyId, _tenantWarning: tenantWarning } as Property & { _tenantWarning?: boolean };
      } catch (error) {
        log.error('Failed to add property:', error);
        throw error;
      }
    },
    // Never auto-retry a client-keyed INSERT: a retried-but-already-committed insert
    // would fail on a duplicate primary key and report a false "add failed".
    retry: false,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
      if ((created as any)?._tenantWarning) {
        toast({
          variant: 'destructive',
          title: 'הנכס נשמר, אך פרטי הדייר/החוזה לא נשמרו',
          description: 'שמירת פרטי השוכר נכשלה. נסה לערוך את הנכס ולהזין אותם מחדש.',
        });
      }
      log.info('Property added successfully');
    },
    onError: (error) => {
      log.error('Property addition failed:', error);
    }
  });

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string): Promise<string> => {
      try {
        log.info('Soft-deleting property in Supabase', { id: propertyId });

        // Soft delete: mark deleted and hide from the public site, instead of a
        // physical DELETE that cascaded to tenants, rent payments, documents and
        // images. The row stays recoverable (deleted_at can be cleared).
        const { error } = await supabase
          .from('properties')
          .update({
            deleted_at: new Date().toISOString(),
            available: false,
            show_on_website: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', propertyId);

        if (error) {
          log.error('Failed to delete property:', error);
          throw error;
        }
        return propertyId;
      } catch (error) {
        log.error('Failed to delete property:', error);
        throw error;
      }
    },
    onSuccess: (deletedId) => {
      // Remove it from the cache immediately so the row disappears without a full refetch.
      queryClient.setQueryData<Property[]>(PROPERTIES_KEY, (old) =>
        Array.isArray(old) ? old.filter((p) => p.id !== deletedId) : old
      );
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
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
    addPropertyAsync: addPropertyMutation.mutateAsync,
    updateProperty: updatePropertyMutation.mutate,
    deleteProperty: deletePropertyMutation.mutate,
    deletePropertyAsync: deletePropertyMutation.mutateAsync,
    isAddingProperty: addPropertyMutation.isPending,
    isUpdatingProperty: updatePropertyMutation.isPending,
    isDeletingProperty: deletePropertyMutation.isPending,
    
    // Utilities
    refetch: propertiesQuery.refetch,
    invalidateProperties: () => queryClient.invalidateQueries({ queryKey: ['supabase-properties'] }),
  };
};