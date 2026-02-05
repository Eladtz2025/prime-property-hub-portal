import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OwnPropertyMatch {
  id: string;
  title: string | null;
  address: string;
  city: string;
  neighborhood: string | null;
  monthly_rent: number | null;
  rooms: number | null;
  property_size: number | null;
  property_type: string | null;
  isDismissed: boolean;
}

interface CustomerCriteria {
  id: string;
  budget_min?: number | null;
  budget_max?: number | null;
  rooms_min?: number | null;
  rooms_max?: number | null;
  preferred_cities?: string[] | null;
  preferred_neighborhoods?: string[] | null;
  property_type?: string | null;
}

export const useOwnPropertyMatches = (customer: CustomerCriteria, includeDismissed: boolean = false) => {
  return useQuery({
    queryKey: ['own-property-matches', customer.id, includeDismissed],
    queryFn: async (): Promise<OwnPropertyMatch[]> => {
      // First, get dismissed property IDs for this lead
      const { data: dismissedData } = await supabase
        .from('dismissed_matches')
        .select('property_id')
        .eq('lead_id', customer.id)
        .not('property_id', 'is', null);

      const dismissedPropertyIds = new Set(
        (dismissedData || []).map(d => d.property_id).filter(Boolean)
      );

      let query = supabase
        .from('properties')
        .select('id, title, address, city, neighborhood, monthly_rent, rooms, property_size, property_type')
        .eq('available', true)
        .not('monthly_rent', 'is', null)
        .gt('monthly_rent', 0);

      // Filter by property type (rental vs sale)
      if (customer.property_type === 'rental') {
        query = query.eq('property_type', 'rental');
      } else if (customer.property_type === 'purchase') {
        query = query.eq('property_type', 'sale');
      }

      // Filter by budget
      if (customer.budget_max) {
        query = query.lte('monthly_rent', customer.budget_max);
      }
      if (customer.budget_min) {
        query = query.gte('monthly_rent', customer.budget_min);
      }

      // Filter by rooms
      if (customer.rooms_min) {
        query = query.gte('rooms', customer.rooms_min);
      }
      if (customer.rooms_max) {
        query = query.lte('rooms', customer.rooms_max);
      }

      // Filter by city
      if (customer.preferred_cities && customer.preferred_cities.length > 0) {
        query = query.in('city', customer.preferred_cities);
      }

      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      
      // Post-filter by neighborhood if specified (using partial match)
      let results = data || [];
      
      if (customer.preferred_neighborhoods && customer.preferred_neighborhoods.length > 0) {
        const neighborhoodLower = customer.preferred_neighborhoods.map(n => n.toLowerCase());
        results = results.filter(p => {
          if (!p.neighborhood) return false;
          const propNeighborhood = p.neighborhood.toLowerCase();
          return neighborhoodLower.some(n => propNeighborhood.includes(n) || n.includes(propNeighborhood));
        });
      }
      
      // Add isDismissed flag and filter if needed
      const withDismissedFlag = results.map(p => ({
        ...p,
        isDismissed: dismissedPropertyIds.has(p.id),
      }));

      if (includeDismissed) {
        return withDismissedFlag;
      }
      
      return withDismissedFlag.filter(p => !p.isDismissed);
    },
    enabled: !!customer.id,
    staleTime: 1000 * 60 * 5,
  });
};
