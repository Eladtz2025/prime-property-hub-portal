import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { PublicProperty } from './usePublicProperties';

const log = logger.component('usePublicProperty');

export const usePublicProperty = (propertyId: string | undefined) => {
  return useQuery({
    queryKey: ['public-property', propertyId],
    queryFn: async (): Promise<PublicProperty | null> => {
      if (!propertyId) {
        return null;
      }

      try {
        log.info(`Loading public property: ${propertyId}`);

        const { data: property, error } = await supabase
          .from('properties')
          .select(`
            id,
            title,
            address,
            city,
            description,
            property_type,
            rooms,
            property_size,
            bathrooms,
            floor,
            building_floors,
            parking,
            elevator,
            balcony,
            yard,
            balcony_yard_size,
            monthly_rent,
            current_market_value,
            featured,
            available,
            assigned_user_id,
            assigned_agent:profiles!properties_assigned_user_id_fkey (
              id,
              full_name,
              phone
            ),
            property_images (
              id,
              image_url,
              alt_text,
              is_main,
              order_index
            )
          `)
          .eq('id', propertyId)
          .eq('available', true)
          .in('status', ['vacant', 'unknown'])
          .single();

        if (error) {
          log.error('Failed to load property:', error);
          throw error;
        }

        if (!property) {
          return null;
        }

        // Transform data
        const transformedProperty: PublicProperty = {
          id: property.id,
          title: property.title || `${property.rooms} חדרים ${property.address}`,
          address: property.address,
          city: property.city,
          description: property.description,
          property_type: property.property_type as 'rental' | 'sale',
          rooms: property.rooms,
          property_size: property.property_size,
          bathrooms: property.bathrooms,
          floor: property.floor,
          parking: property.parking,
          elevator: property.elevator,
          balcony: property.balcony,
          yard: property.yard,
          balcony_yard_size: property.balcony_yard_size,
          monthly_rent: property.monthly_rent,
          price: property.current_market_value,
          featured: property.featured,
          agent: property.assigned_agent ? {
            id: property.assigned_agent.id,
            name: property.assigned_agent.full_name,
            phone: property.assigned_agent.phone
          } : null,
          images: (property.property_images || [])
            .sort((a, b) => {
              if (a.is_main && !b.is_main) return -1;
              if (!a.is_main && b.is_main) return 1;
              return (a.order_index || 0) - (b.order_index || 0);
            })
            .map(img => ({
              id: img.id,
              image_url: img.image_url,
              alt_text: img.alt_text,
              is_main: img.is_main || false
            }))
        };

        log.info(`Successfully loaded property: ${property.title}`);
        return transformedProperty;

      } catch (error) {
        log.error('Failed to load property:', error);
        throw error;
      }
    },
    enabled: !!propertyId,
    staleTime: 30 * 1000, // 30 seconds - faster refresh for admin edits
    gcTime: 10 * 60 * 1000,
  });
};
