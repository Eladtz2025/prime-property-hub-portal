import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export interface Tenant {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  monthly_rent?: number;
  deposit_amount?: number;
  lease_start_date?: string;
  lease_end_date?: string;
  is_active: boolean;
  property_id: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyWithTenants {
  id: string;
  address: string;
  city: string;
  tenants: Tenant[];
}

export const useTenantData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch properties with their tenants
  const propertiesWithTenantsQuery = useQuery({
    queryKey: ['properties-with-tenants', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          address,
          city,
          tenants (
            id,
            name,
            phone,
            email,
            monthly_rent,
            deposit_amount,
            lease_start_date,
            lease_end_date,
            is_active,
            property_id,
            created_at,
            updated_at
          )
        `)
        .order('address');

      if (error) {
        logger.error('Failed to fetch properties with tenants', error, 'useTenantData');
        throw error;
      }

      return data as PropertyWithTenants[];
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  // Fetch individual tenant details
  const useTenantDetails = (tenantId: string) => {
    return useQuery({
      queryKey: ['tenant-details', tenantId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tenantId)
          .single();

        if (error) {
          logger.error('Failed to fetch tenant details', error, 'useTenantData');
          throw error;
        }

        return data as Tenant;
      },
      enabled: !!tenantId,
    });
  };

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (tenantData: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tenants')
        .insert(tenantData)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create tenant', error, 'useTenantData');
        throw error;
      }

      return data as Tenant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties-with-tenants'] });
      logger.info('Tenant created successfully', {}, 'useTenantData');
    },
  });

  // Update tenant mutation
  const updateTenantMutation = useMutation({
    mutationFn: async ({ 
      tenantId, 
      updates 
    }: { 
      tenantId: string; 
      updates: Partial<Omit<Tenant, 'id' | 'created_at' | 'updated_at'>> 
    }) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenantId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update tenant', error, 'useTenantData');
        throw error;
      }

      return data as Tenant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties-with-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-details'] });
      logger.info('Tenant updated successfully', {}, 'useTenantData');
    },
  });

  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);

      if (error) {
        logger.error('Failed to delete tenant', error, 'useTenantData');
        throw error;
      }

      return tenantId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties-with-tenants'] });
      logger.info('Tenant deleted successfully', {}, 'useTenantData');
    },
  });

  return {
    // Data
    propertiesWithTenants: propertiesWithTenantsQuery.data || [],
    isLoading: propertiesWithTenantsQuery.isLoading,
    isError: propertiesWithTenantsQuery.isError,
    error: propertiesWithTenantsQuery.error,

    // Actions
    createTenant: createTenantMutation.mutate,
    updateTenant: updateTenantMutation.mutate,
    deleteTenant: deleteTenantMutation.mutate,

    // Status
    isCreatingTenant: createTenantMutation.isPending,
    isUpdatingTenant: updateTenantMutation.isPending,
    isDeletingTenant: deleteTenantMutation.isPending,

    // Utilities
    useTenantDetails,
    refetch: propertiesWithTenantsQuery.refetch,
    invalidateData: () => {
      queryClient.invalidateQueries({ queryKey: ['properties-with-tenants'] });
    }
  };
};