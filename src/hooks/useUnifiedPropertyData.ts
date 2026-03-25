import { useQuery } from '@tanstack/react-query';
import { Property } from '@/types/property';

interface UnifiedProperty {
  address: string;
  owner_name: string;
  owner_phone: string;
  tenant_name?: string;
  tenant_phone?: string;
  city: string;
  notes?: string;
}

interface UnifiedDataFile {
  metadata: {
    created_at: string;
    total_properties: number;
    source_breakdown: {
      main_file_records: number;
      owners_file_records: number;
      total_before_dedup: number;
      duplicates_removed: number;
    };
  };
  properties: UnifiedProperty[];
}

function transformToProperty(data: UnifiedProperty, index: number): Property {
  return {
    id: `property-${index}`,
    address: data.address,
    city: data.city,
    ownerName: data.owner_name,
    ownerPhone: data.owner_phone,
    tenantName: data.tenant_name || '',
    tenantPhone: data.tenant_phone || '',
    status: 'unknown' as const,
    contactStatus: 'not_contacted' as const,
    contactAttempts: 0,
    notes: data.notes
  };
}

export const useUnifiedPropertyData = () => {
  const propertiesQuery = useQuery({
    queryKey: ['unified-properties'],
    queryFn: async (): Promise<Property[]> => {
      try {
        const response = await fetch('/properties-unified.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: UnifiedDataFile = await response.json();
        
        return data.properties.map((property, index) => 
          transformToProperty(property, index)
        );
      } catch (error) {
        console.error('Error loading unified properties:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateProperty = async (updatedProperty: Property) => {
    // For now, this will just log - in future can integrate with Supabase
    return updatedProperty;
  };

  const addProperty = async (newProperty: Omit<Property, 'id'>) => {
    // For now, this will just log - in future can integrate with Supabase
    const property = {
      ...newProperty,
      id: `property-${Date.now()}`
    };
    return property;
  };

  return {
    properties: propertiesQuery.data || [],
    isLoading: propertiesQuery.isLoading,
    error: propertiesQuery.error,
    refetch: propertiesQuery.refetch,
    updateProperty,
    addProperty,
    isAddingProperty: false,
    isUpdatingProperty: false
  };
};