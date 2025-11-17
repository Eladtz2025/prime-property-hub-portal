import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

const log = logger.component('usePublicProperties');

export interface PublicProperty {
  id: string;
  title?: string;
  address: string;
  city: string;
  description?: string;
  property_type: 'rental' | 'sale' | 'management';
  rooms?: number;
  property_size?: number;
  bathrooms?: number;
  floor?: number;
  parking?: boolean;
  elevator?: boolean;
  balcony?: boolean;
  yard?: boolean;
  balcony_yard_size?: number;
  show_management_badge?: boolean;
  monthly_rent?: number;
  price?: number;
  featured?: boolean;
  agent?: {
    id: string;
    name: string | null;
    phone: string | null;
  } | null;
  images: {
    id: string;
    image_url: string;
    alt_text?: string;
    is_main: boolean;
  }[];
}

interface UsePublicPropertiesOptions {
  propertyType: 'rental' | 'sale' | 'management';
}

export const usePublicProperties = ({ propertyType }: UsePublicPropertiesOptions) => {
  return useQuery({
    queryKey: ['public-properties', propertyType],
    queryFn: async (): Promise<PublicProperty[]> => {
      try {
        log.info(`Loading public ${propertyType} properties`);

        // Get properties with images count
        const { data: propertiesWithImages, error: propertiesError } = await supabase
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
            parking,
            elevator,
            balcony,
            yard,
            balcony_yard_size,
            show_management_badge,
            monthly_rent,
            featured,
            available,
            status,
            property_images!inner (
              id,
              image_url,
              alt_text,
              is_main,
              order_index
            )
          `)
          .eq('property_type', propertyType)
          .eq('available', true)
          .eq('status', 'vacant')
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false });

        if (propertiesError) {
          log.error('Failed to load public properties:', propertiesError);
          throw propertiesError;
        }

        // Transform data to match the interface
        const transformedProperties: PublicProperty[] = (propertiesWithImages || []).map(property => ({
          id: property.id,
          title: property.title || `${property.rooms} חדרים ${property.address}`,
          address: property.address,
          city: property.city,
          description: property.description,
          property_type: property.property_type as 'rental' | 'sale' | 'management',
          rooms: property.rooms,
          property_size: property.property_size,
          bathrooms: property.bathrooms,
          floor: property.floor,
          parking: property.parking,
          elevator: property.elevator,
          balcony: property.balcony,
          yard: property.yard,
          balcony_yard_size: property.balcony_yard_size,
          show_management_badge: property.show_management_badge,
          monthly_rent: property.monthly_rent,
          featured: property.featured,
          images: (property.property_images || [])
            .sort((a, b) => {
              // Sort by is_main first, then by order_index
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
        }));

        // Filter out properties without images (extra safety)
        const propertiesWithValidImages = transformedProperties.filter(
          property => property.images && property.images.length > 0
        );

        log.info(`Successfully loaded ${propertiesWithValidImages.length} public ${propertyType} properties`);
        return propertiesWithValidImages;

      } catch (error) {
        log.error('Failed to load public properties:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
