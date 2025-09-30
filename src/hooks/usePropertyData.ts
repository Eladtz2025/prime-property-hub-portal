// Updated to use Supabase as the single source of truth
export { useSupabasePropertyData as usePropertyData } from './useSupabasePropertyData';

// Re-export the stats function for compatibility
import { useQuery } from '@tanstack/react-query';
import { Property } from '@/types/property';

export const usePropertyStats = (properties: Property[]) => {
  return useQuery({
    queryKey: ['property-stats', properties.length],
    queryFn: () => {
      const total = properties.length;
      const occupied = properties.filter(p => p.status === 'occupied').length;
      const vacant = properties.filter(p => p.status === 'vacant').length;
      const unknown = properties.filter(p => p.status === 'unknown').length;
      const contacted = properties.filter(p => p.contactStatus !== 'not_contacted').length;
      const notContacted = properties.filter(p => p.contactStatus === 'not_contacted').length;
      const upcomingRenewals = properties.filter(p => {
        if (!p.leaseEndDate) return false;
        const endDate = new Date(p.leaseEndDate);
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        return endDate <= threeMonthsFromNow;
      }).length;

      return {
        total,
        occupied,
        vacant,
        unknown,
        contacted,
        notContacted,
        upcomingRenewals,
        occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
      };
    },
    enabled: properties.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};