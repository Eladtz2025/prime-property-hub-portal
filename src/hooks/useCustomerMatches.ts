import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';

interface CustomerMatch {
  id: string;
  source_table: 'scouted' | 'own';
  title: string | null;
  city: string | null;
  price: number | null;
  rooms: number | null;
  size: number | null;
  source: string;
  source_url: string;
  is_private: boolean | null;
  matchScore: number;
  priority: number;
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
      // Unified RPC: returns BOTH scouted_properties matches AND our own properties matches
      const { data, error } = await supabase
        .rpc('get_unified_customer_matches', { 
          customer_uuid: customerId,
          include_dismissed: includeDismissed 
        });

      if (error) {
        logger.error('Error fetching unified customer matches:', error);
        throw error;
      }
      
      if (!data) return [];

      const matches: CustomerMatch[] = data.map((row: {
        id: string;
        source_table: string;
        title: string | null;
        city: string | null;
        price: number | null;
        rooms: number | null;
        size: number | null;
        source: string;
        source_url: string | null;
        is_private: boolean | null;
        match_score: number;
        priority: number | null;
        match_reasons: string[] | null;
        duplicate_group_id: string | null;
        address: string | null;
        neighborhood: string | null;
        property_type: string | null;
        is_dismissed?: boolean;
        duplicates_count?: number;
      }) => ({
        id: row.id,
        source_table: (row.source_table as 'scouted' | 'own') || 'scouted',
        title: row.title,
        city: row.city,
        price: row.price,
        rooms: row.rooms,
        size: row.size,
        source: row.source,
        source_url: row.source_url || '',
        is_private: row.is_private,
        matchScore: row.match_score || 0,
        priority: row.priority || 0,
        matchReasons: row.match_reasons || [],
        duplicateGroupId: row.duplicate_group_id,
        address: row.address,
        neighborhood: row.neighborhood,
        propertyType: row.property_type,
        isDismissed: row.is_dismissed || false,
        duplicatesCount: row.duplicates_count || 1,
      }));

      // Preserve DB order
      const dbOrderMap = new Map<string, number>();
      matches.forEach((match, index) => {
        dbOrderMap.set(match.id, index);
      });

      // Group by duplicate_group_id (own properties have null group → become single-item groups)
      const groupedMap = new Map<string, CustomerMatch[]>();
      matches.forEach(match => {
        const groupKey = match.duplicateGroupId || match.id;
        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, []);
        }
        groupedMap.get(groupKey)!.push(match);
      });

      const grouped: GroupedMatch[] = Array.from(groupedMap.entries()).map(([, groupMatches]) => ({
        groupId: groupMatches[0].duplicateGroupId,
        matches: groupMatches.sort((a, b) => (dbOrderMap.get(a.id) ?? 0) - (dbOrderMap.get(b.id) ?? 0)),
      }));

      grouped.sort((a, b) => {
        const aOrder = Math.min(...a.matches.map(m => dbOrderMap.get(m.id) ?? 0));
        const bOrder = Math.min(...b.matches.map(m => dbOrderMap.get(m.id) ?? 0));
        return aOrder - bOrder;
      });

      return grouped;
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5,
  });
};
