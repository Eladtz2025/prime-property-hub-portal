import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CustomerMatch {
  id: string;
  title: string | null;
  city: string | null;
  price: number | null;
  rooms: number | null;
  size: number | null;
  source: string;
  source_url: string;
  is_private: boolean | null;
  matchScore: number;
  matchReasons: string[];
  duplicateGroupId: string | null;
  address: string | null;
  neighborhood: string | null;
  propertyType: string | null;
  isDismissed: boolean;
}

export interface GroupedMatch {
  groupId: string | null;
  matches: CustomerMatch[];
}

export const useCustomerMatches = (customerId: string, includeDismissed: boolean = false) => {
  return useQuery({
    queryKey: ['customer-matches', customerId, includeDismissed],
    queryFn: async (): Promise<GroupedMatch[]> => {
      // Use the optimized database function instead of fetching all properties
      const { data, error } = await supabase
        .rpc('get_customer_matches', { 
          customer_uuid: customerId,
          include_dismissed: includeDismissed 
        });

      if (error) {
        console.error('Error fetching customer matches:', error);
        throw error;
      }
      
      if (!data) return [];

      // Map the database function result to our interface
      const matches: CustomerMatch[] = data.map((row: {
        id: string;
        title: string | null;
        city: string | null;
        price: number | null;
        rooms: number | null;
        size: number | null;
        source: string;
        source_url: string;
        is_private: boolean | null;
        match_score: number;
        match_reasons: string[] | null;
        duplicate_group_id: string | null;
        address: string | null;
        neighborhood: string | null;
        property_type: string | null;
        is_dismissed?: boolean;
      }) => ({
        id: row.id,
        title: row.title,
        city: row.city,
        price: row.price,
        rooms: row.rooms,
        size: row.size,
        source: row.source,
        source_url: row.source_url,
        is_private: row.is_private,
        matchScore: row.match_score || 0,
        matchReasons: row.match_reasons || [],
        duplicateGroupId: row.duplicate_group_id,
        address: row.address,
        neighborhood: row.neighborhood,
        propertyType: row.property_type,
        isDismissed: row.is_dismissed || false,
      }));

      // Group matches by duplicate_group_id
      const groupedMap = new Map<string, CustomerMatch[]>();
      
      matches.forEach(match => {
        const groupKey = match.duplicateGroupId || match.id; // Use ID if no duplicate group
        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, []);
        }
        groupedMap.get(groupKey)!.push(match);
      });

      // Convert to GroupedMatch array, sorted by best score in each group
      const grouped: GroupedMatch[] = Array.from(groupedMap.entries()).map(([groupId, groupMatches]) => ({
        groupId: groupMatches[0].duplicateGroupId,
        matches: groupMatches.sort((a, b) => b.matchScore - a.matchScore),
      }));

      // Sort groups by best match score
      grouped.sort((a, b) => {
        const aScore = Math.max(...a.matches.map(m => m.matchScore));
        const bScore = Math.max(...b.matches.map(m => m.matchScore));
        return bScore - aScore;
      });

      return grouped;
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
