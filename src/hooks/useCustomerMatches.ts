import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';

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
  duplicatesCount: number;
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
        logger.error('Error fetching customer matches:', error);
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
        duplicates_count?: number;
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
        duplicatesCount: row.duplicates_count || 1,
      }));

      // Preserve DB order (already sorted by score → priority → created_at)
      const dbOrderMap = new Map<string, number>();
      matches.forEach((match, index) => {
        dbOrderMap.set(match.id, index);
      });

      // Group matches by duplicate_group_id
      const groupedMap = new Map<string, CustomerMatch[]>();
      
      matches.forEach(match => {
        const groupKey = match.duplicateGroupId || match.id;
        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, []);
        }
        groupedMap.get(groupKey)!.push(match);
      });

      // Convert to GroupedMatch array
      const grouped: GroupedMatch[] = Array.from(groupedMap.entries()).map(([groupId, groupMatches]) => ({
        groupId: groupMatches[0].duplicateGroupId,
        matches: groupMatches.sort((a, b) => (dbOrderMap.get(a.id) ?? 0) - (dbOrderMap.get(b.id) ?? 0)),
      }));

      // Sort groups by best (lowest) DB order index — preserves DB's score+priority+date sorting
      grouped.sort((a, b) => {
        const aOrder = Math.min(...a.matches.map(m => dbOrderMap.get(m.id) ?? 0));
        const bOrder = Math.min(...b.matches.map(m => dbOrderMap.get(m.id) ?? 0));
        return aOrder - bOrder;
      });

      return grouped;
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
