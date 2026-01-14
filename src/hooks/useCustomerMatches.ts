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
}

export const useCustomerMatches = (customerId: string) => {
  return useQuery({
    queryKey: ['customer-matches', customerId],
    queryFn: async (): Promise<CustomerMatch[]> => {
      // Use the optimized database function instead of fetching all properties
      const { data, error } = await supabase
        .rpc('get_customer_matches', { customer_uuid: customerId });

      if (error) {
        console.error('Error fetching customer matches:', error);
        throw error;
      }
      
      if (!data) return [];

      // Map the database function result to our interface
      return data.map((row: {
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
      }));
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
