import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DealListing {
  id: string;
  title: string | null;
  source: string;
  source_url: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  property_type: string;
  price: number;
  rooms: number | null;
  size: number | null;
  floor: number | null;
  is_private: boolean | null;
  first_seen_at: string;
  created_at: string;
  price_per_sqm: number;
  median_per_sqm: number;
  discount_pct: number;
  deal_tier: 'strong' | 'regular';
  deal_score: number;
}

export const useDealListings = (
  propertyType: 'rent' | 'sale',
  limit: number = 100,
) => {
  return useQuery({
    queryKey: ['deal-listings', propertyType, limit],
    queryFn: async (): Promise<DealListing[]> => {
      const { data, error } = await supabase.rpc('get_deal_listings', {
        p_property_type: propertyType,
        p_limit: limit,
        p_min_discount: 0.15,
        p_max_discount: 0.40,
      });
      if (error) throw error;
      return (data ?? []) as DealListing[];
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};
