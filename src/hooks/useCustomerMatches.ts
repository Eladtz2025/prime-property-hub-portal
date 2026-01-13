import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MatchedLead {
  lead_id: string;
  matchScore: number;
  matchReasons?: string[];
}

interface ScoutedProperty {
  id: string;
  title: string | null;
  city: string | null;
  price: number | null;
  rooms: number | null;
  size: number | null;
  source: string;
  source_url: string;
  matched_leads: MatchedLead[];
}

interface CustomerMatch {
  id: string;
  title: string | null;
  city: string | null;
  price: number | null;
  rooms: number | null;
  size: number | null;
  source: string;
  source_url: string;
  matchScore: number;
  matchReasons: string[];
}

export const useCustomerMatches = (customerId: string) => {
  return useQuery({
    queryKey: ['customer-matches', customerId],
    queryFn: async (): Promise<CustomerMatch[]> => {
      const { data, error } = await supabase
        .from('scouted_properties')
        .select('id, title, city, price, rooms, size, source, source_url, matched_leads')
        .not('matched_leads', 'is', null);

      if (error) throw error;
      if (!data) return [];

      // Filter properties where the customerId is in matched_leads
      const matches: CustomerMatch[] = [];
      
      for (const property of data) {
        const matchedLeads = property.matched_leads as unknown as MatchedLead[] | null;
        if (!matchedLeads || !Array.isArray(matchedLeads)) continue;
        
        const leadMatch = matchedLeads.find(m => m.lead_id === customerId);
        if (leadMatch) {
          matches.push({
            id: property.id,
            title: property.title,
            city: property.city,
            price: property.price,
            rooms: property.rooms,
            size: property.size,
            source: property.source,
            source_url: property.source_url,
            matchScore: leadMatch.matchScore || 0,
            matchReasons: leadMatch.matchReasons || [],
          });
        }
      }

      // Sort by match score descending
      return matches.sort((a, b) => b.matchScore - a.matchScore);
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
