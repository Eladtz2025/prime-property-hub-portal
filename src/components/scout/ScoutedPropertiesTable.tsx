import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ExternalLink, Users, MessageSquare, Archive, Search, Eye, Download, ChevronRight, ChevronLeft, TrendingUp, TrendingDown, Building2, X, Filter, SlidersHorizontal, CheckCircle2, Loader2, Calculator, Copy, AlertTriangle, Check, RefreshCw, Info, Database, Square } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatDistanceToNow, startOfDay, startOfWeek } from 'date-fns';
import { he } from 'date-fns/locale';
import { useBackfillProgress } from '@/hooks/useBackfillProgress';

interface ScoutedProperty {
  id: string;
  source: string;
  source_url: string;
  title: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  price: number | null;
  rooms: number | null;
  size: number | null;
  floor: number | null;
  property_type: string | null;
  status: string;
  first_seen_at: string;
  matched_leads: any[];
  features: Record<string, boolean> | null;
  images: string[] | null;
  description: string | null;
  is_active?: boolean;
  is_private?: boolean | null;
}

const PAGE_SIZE = 20;

const FEATURE_OPTIONS = [
  { key: 'elevator', label: 'מעלית' },
  { key: 'parking', label: 'חניה' },
  { key: 'balcony', label: 'מרפסת' },
  { key: 'mamad', label: 'ממ"ד' },
  { key: 'storage', label: 'מחסן' },
  { key: 'roof', label: 'גג' },
  { key: 'yard', label: 'חצר' },
];

// Consolidated neighborhood groups for Tel Aviv - expanded to match all DB variations
const NEIGHBORHOOD_GROUPS: Record<string, string[]> = {
  // צפון ישן - כולל את כל הווריאציות
  'צפון ישן': [
    'צפון ישן',              // 716 - הנפוץ ביותר!
    'הצפון הישן',
    'הצפון הישן - צפון',    // 175
    'הצפון הישן - דרום',    // 133  
    'הצפון הישן החלק הצפוני', // 61
    'הצפון הישן החלק המרכזי',
    'הצפון הישן החלק הדרום',
    'צפון הישן',
  ],
  
  // צפון חדש - כולל כיכר המדינה
  'צפון חדש': [
    'צפון חדש',              // 288
    'הצפון החדש',
    'הצפון החדש - צפון',     // 62
    'הצפון החדש - דרום',     // 59
    'הצפון החדש - כיכר המדינה', // 121
    'כיכר המדינה',
    'סביבת כיכר המדינה',
    'הצפון החדש סביבת כיכר המדינה', // 66
    'הצפון החדש החלק הצפוני',
    'הצפון החדש החלק הדרומי',
    'לואי מרשל',
  ],
  
  // לב העיר / מרכז (הסרנו פטרנים עם פסיק - PostgREST משתמש בפסיק כמפריד OR)
  'לב העיר': [
    'לב העיר',
    'מרכז העיר',             // 333
    'לב תל אביב',            // 74 - תופס גם "לב תל אביב, לב העיר"
    'לב העיר צפון',
    'לב העיר דרום',
  ],
  
  // פלורנטין
  'פלורנטין': [
    'פלורנטין',              // 226
    'דרום פלורנטין',
    'נחלת בנימין',
  ],
  
  // נווה צדק
  'נווה צדק': [
    'נווה צדק',              // 144
    'נוה צדק',
  ],
  
  // כרם התימנים
  'כרם התימנים': [
    'כרם התימנים',           // 132
    'הירקון',
  ],
  
  // רוטשילד (חדש!)
  'רוטשילד': [
    'רוטשילד',               // 132
    'דרום רוטשילד',
    'מונטיפיורי',
    'שרונה',
  ],
  
  // יפו
  'יפו': [
    'יפו',                   // 1679 - הכי גדול!
    'יפו ג',
    'יפו ד',
    'יפו העתיקה',
    'צפון יפו',
    'מרכז יפו',
    'עג\'מי',
  ],
  
  // רמת אביב - איחוד עם הגוש הגדול (הסרנו פטרנים עם פסיק)
  'רמת אביב': [
    'רמת אביב',              // 150
    'רמת אביב ג',
    'רמת אביב החדשה',        // תופס גם "הגוש הגדול, רמת אביב החדשה"
    'נופי ים',
    'הגוש הגדול',
  ],
  
  // נווה אביבים (חדש!)
  'נווה אביבים': [
    'נווה אביבים',           // 74
    'נוה אביבים',
  ],
  
  // רמת החייל (חדש!)
  'רמת החייל': [
    'רמת החייל',
    'רמת החיל',
  ],
  
  // בבלי
  'בבלי': [
    'בבלי',                  // 64
    'שיכון בבלי',
  ],
  
  // יד אליהו (חדש!)
  'יד אליהו': [
    'יד אליהו',              // 160
  ],
  
  // נווה שאנן
  'נווה שאנן': [
    'נווה שאנן',             // 109
    'נוה שאנן',
  ],
  
  // שרונה / קרית הממשלה (הסרנו פטרנים עם פסיק)
  'שרונה': [
    'גני שרונה',             // תופס גם "גני שרונה, קרית הממשלה"
    'קרית הממשלה',
  ],
  
  // הדר יוסף (חדש!)
  'הדר יוסף': [
    'הדר יוסף',              // 65
  ],
  
  // נווה שרת (חדש!)
  'נווה שרת': [
    'נווה שרת',              // 64
    'נוה שרת',
  ],
  
  // קרית שלום (חדש!)
  'קרית שלום': [
    'קרית שלום',             // 67
  ],
  
  // שפירא (חדש!)
  'שפירא': [
    'שפירא',                 // 59
  ],
  
  // התקווה (הסרנו פטרנים עם פסיק)
  'התקווה': [
    'התקוה',
    'שכונת התקווה',
    'בית יעקב',              // תופס גם "התקוה, בית יעקב"
    'שוק הפשפשים',
  ],
  
  // נחלת יצחק
  'נחלת יצחק': [
    'נחלת יצחק',             // 57
  ],
  
  // צהלה
  'צהלה': [
    'צהלה',
    'גני צהלה',
    'צהלון',
    'רמות צהלה',
    'כוכב הצפון',
  ],
  
  // נמל תל אביב
  'נמל תל אביב': [
    'נמל תל אביב',
    'יורדי הסירה',
    'התערוכה',
  ],
  
  // תל ברוך
  'תל ברוך': [
    'תל ברוך',
    'תל ברוך צפון',
    'תל ברוך דרום',
  ],
  
  // דרום תל אביב
  'דרום תל אביב': [
    'דרום העיר',
    'כפר שלם',
  ],
  
  // אזורי חן
  'אזורי חן': [
    'אזורי חן',
    'גימל החדשה',
  ],
};

// Normalize search by removing geresh/gershayim variations
const normalizeSearch = (text: string): string => {
  return text.replace(/[''`׳״]/g, '');
};

// Shorten neighborhood names for display
const shortenNeighborhood = (name: string): string => {
  return name
    .replace(/^ה/, '')           // Remove leading ה
    .replace(/ - /g, ' ')        // Replace " - " with space
    .replace(/החלק ה/g, '')      // Remove "החלק ה"
    .trim();
};

export const ScoutedPropertiesTable: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState<ScoutedProperty | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPropertyDetails, setSelectedPropertyDetails] = useState<ScoutedProperty | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // New filter states
  const [roomsMin, setRoomsMin] = useState<string>('');
  const [roomsMax, setRoomsMax] = useState<string>('');
  const [minBudget, setMinBudget] = useState<string>('');
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string[]>([]);
  const [featuresFilter, setFeaturesFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [ownerTypeFilter, setOwnerTypeFilter] = useState<string>('all');
  
  // Applied filters state - starts with default values to show all properties
  const [appliedFilters, setAppliedFilters] = useState<{
    roomsMin: string;
    roomsMax: string;
    minBudget: string;
    maxBudget: string;
    neighborhoods: string[];
    features: string[];
    status: string;
    propertyType: string;
    searchTerm: string;
    source: string;
    ownerType: string;
  }>({
    roomsMin: '',
    roomsMax: '',
    minBudget: '',
    maxBudget: '',
    neighborhoods: [],
    features: [],
    status: 'all',
    propertyType: 'all',
    searchTerm: '',
    source: 'all',
    ownerType: 'all'
  });

  // Statistics query
  const { data: stats } = useQuery({
    queryKey: ['scouted-properties-stats'],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }).toISOString();

      // Total count (active properties only)
      const { count: totalCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Today count (active properties only)
      const { count: todayCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('first_seen_at', today);

      // Today by source (active properties only)
      const { data: todayBySourceData } = await supabase
        .from('scouted_properties')
        .select('source')
        .eq('is_active', true)
        .gte('first_seen_at', today);

      const todayBySources = todayBySourceData?.reduce((acc, item) => {
        acc[item.source] = (acc[item.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // This week count (active properties only)
      const { count: weekCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('first_seen_at', weekStart);

      // By source (total, active only) - use separate count queries to avoid 1000 row limit
      const { count: yad2Count } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('source', 'yad2');

      const { count: homelessCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('source', 'homeless');

      const { count: madlanCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('source', 'madlan');

      const sourceCounts = {
        yad2: yad2Count || 0,
        homeless: homelessCount || 0,
        madlan: madlanCount || 0
      };

      // Last scan results - aggregate all runs from the last batch (within 5 minutes of each other)
      const { data: lastRuns } = await supabase
        .from('scout_runs')
        .select('source, properties_found, new_properties, completed_at')
        .eq('status', 'completed')
  .order('completed_at', { ascending: false })
  .limit(100); // Increased to cover full batch (~72 runs per scan)

      let lastScanBySources: Record<string, number> = { yad2: 0, homeless: 0, madlan: 0 };
      
      if (lastRuns && lastRuns.length > 0) {
        // Find the latest completion time
        const latestCompletedAt = new Date(lastRuns[0].completed_at);
        
        // Get all runs that completed within 5 minutes of the latest
        const batchWindowStart = new Date(latestCompletedAt.getTime() - 5 * 60 * 1000);
        
        const batchRuns = lastRuns.filter(run => 
          new Date(run.completed_at) >= batchWindowStart
        );
        
        // Aggregate by source
        lastScanBySources = batchRuns.reduce((acc, run) => {
          const source = run.source || 'other';
          acc[source] = (acc[source] || 0) + (run.properties_found || 0);
          return acc;
        }, { yad2: 0, homeless: 0, madlan: 0 } as Record<string, number>);
      }

      // Inactive count
      const { count: inactiveCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      return {
        total: totalCount || 0,
        today: todayCount || 0,
        todayBySources,
        week: weekCount || 0,
        bySources: sourceCounts,
        lastScanBySources,
        inactive: inactiveCount || 0
      };
    }
  });

  // Duplicate stats query - simplified, just count groups
  const { data: duplicateStats } = useQuery({
    queryKey: ['duplicate-stats'],
    queryFn: async () => {
      const { data: duplicateGroups } = await supabase
        .from('scouted_properties')
        .select('duplicate_group_id')
        .not('duplicate_group_id', 'is', null)
        .eq('is_active', true);

      const uniqueGroups = new Set(duplicateGroups?.map(d => d.duplicate_group_id)).size;
      const totalInGroups = duplicateGroups?.length || 0;

      return {
        groups: uniqueGroups,
        total: totalInGroups
      };
    }
  });

  // Run duplicate detection mutation - uses new strict RPC
  const runDuplicateDetectionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('detect_duplicates_batch', {
        batch_size: 1000
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['duplicate-stats'] });
      queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
      if (data && data[0]) {
        toast.success(`נבדקו ${data[0].properties_processed} נכסים, נמצאו ${data[0].duplicates_found} כפילויות`);
      } else {
        toast.success('סריקת כפילויות הושלמה');
      }
    },
    onError: (error) => {
      console.error('Duplicate detection error:', error);
      toast.error('שגיאה בסריקת כפילויות');
    }
  });

  // State for duplicates sheet
  const [duplicatesSheetOpen, setDuplicatesSheetOpen] = useState(false);

  // Format price helper
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Get source color helper
  const getSourceColorClass = (source: string) => {
    switch (source) {
      case 'yad2': return 'bg-orange-500';
      case 'madlan': return 'bg-blue-500';
      case 'homeless': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Fetch neighborhoods - only Tel Aviv, active properties only
  const { data: neighborhoods } = useQuery({
    queryKey: ['scouted-properties-neighborhoods-tel-aviv'],
    queryFn: async () => {
      const { data } = await supabase
        .from('scouted_properties')
        .select('neighborhood')
        .eq('is_active', true)
        .not('neighborhood', 'is', null)
        .ilike('city', '%תל אביב%');
      
      const uniqueNeighborhoods = [...new Set(data?.map(d => d.neighborhood).filter(Boolean))].sort() as string[];
      return uniqueNeighborhoods;
    }
  });

  // Build query filters helper - uses appliedFilters
  const applyFilters = (query: any, filters: NonNullable<typeof appliedFilters>) => {
    // Always filter for active properties only
    query = query.eq('is_active', true);
    
    // Always filter for Tel Aviv
    query = query.ilike('city', '%תל אביב%');
    
    // Safety net: Exclude known broken URL patterns (projects, search pages)
    // These lead to 404 errors when clicked
    query = query
      .not('source_url', 'ilike', '%/yad1/%')
      .not('source_url', 'ilike', '%/projects/%')
      .not('source_url', 'ilike', '%forsale?%')
      .not('source_url', 'ilike', '%forrent?%')
      .not('source_url', 'ilike', '%/for-rent/%')
      .not('source_url', 'ilike', '%/for-sale/%');
    
    if (filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.propertyType !== 'all') {
      query = query.eq('property_type', filters.propertyType);
    }
    if (filters.source !== 'all') {
      // Handle yad2_private as part of yad2
      if (filters.source === 'yad2') {
        query = query.or('source.eq.yad2,source.eq.yad2_private');
      } else {
        query = query.eq('source', filters.source);
      }
    }
    // Owner type filter (private vs broker)
    if (filters.ownerType !== 'all') {
      if (filters.ownerType === 'private') {
        query = query.eq('is_private', true);
      } else if (filters.ownerType === 'broker') {
        query = query.or('is_private.eq.false,is_private.is.null');
      }
    }
    if (filters.roomsMin) {
      query = query.gte('rooms', parseFloat(filters.roomsMin));
    }
    if (filters.roomsMax) {
      query = query.lte('rooms', parseFloat(filters.roomsMax));
    }
    if (filters.minBudget) {
      query = query.gte('price', parseInt(filters.minBudget));
    }
    if (filters.maxBudget) {
      query = query.lte('price', parseInt(filters.maxBudget));
    }
    // SEPARATE .or() calls for neighborhoods and features
    // PostgREST ANDs multiple .or() calls together, which is what we want:
    // (neighborhood1 OR neighborhood2) AND (feature1 OR feature2)
    
    // Neighborhoods - internal OR between all patterns
    if (filters.neighborhoods.length > 0) {
      const neighborhoodParts: string[] = [];
      filters.neighborhoods.forEach(n => {
        const patterns = NEIGHBORHOOD_GROUPS[n] || [n];
        patterns.forEach(p => {
          // Skip patterns with commas - PostgREST uses comma as OR separator
          if (!p.includes(',')) {
            neighborhoodParts.push(`neighborhood.ilike.%${p}%`);
          }
        });
      });
      if (neighborhoodParts.length > 0) {
        query = query.or(neighborhoodParts.join(','));
      }
    }
    
    // Features - separate OR (will be ANDed with neighborhoods by PostgREST)
    if (filters.features.length > 0) {
      const featureParts = filters.features.map(f => `features->>${f}.eq.true`);
      query = query.or(featureParts.join(','));
    }
    
    // Text search - yet another separate OR
    if (filters.searchTerm) {
      const term = filters.searchTerm;
      const normalizedTerm = normalizeSearch(term);
      query = query.or(
        `title.ilike.%${term}%,` +
        `address.ilike.%${term}%,` +
        `neighborhood.ilike.%${term}%,` +
        `title.ilike.%${normalizedTerm}%,` +
        `address.ilike.%${normalizedTerm}%,` +
        `neighborhood.ilike.%${normalizedTerm}%`
      );
    }
    return query;
  };

  // Total count for pagination
  const { data: totalCount } = useQuery({
    queryKey: ['scouted-properties-count', appliedFilters],
    queryFn: async () => {
      let query = supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true });

      query = applyFilters(query, appliedFilters);

      const { count } = await query;
      return count || 0;
    }
  });
  
  // Query for running scans - for the status card
  const { data: runningScans } = useQuery({
    queryKey: ['running-scans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_runs')
        .select('id, source, status, properties_found, new_properties, started_at')
        .eq('status', 'running')
        .order('started_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 3000,
  });
  
  // Get matching progress (separate from scanning)
  const matchingRun = runningScans?.find(r => r.source === 'matching');
  const matchingProgress = matchingRun ? {
    processed: matchingRun.properties_found || 0,
    total: matchingRun.new_properties || 0
  } : null;
  
  // Detect stuck scans - 30 minutes for all scans (single-page mode: 8 pages × 90 sec = ~12 min max)
  // Note: Backend handles actual cleanup via checkAndFinalizeRun - this is just for UI warning
  const stuckScans = runningScans?.filter(r => {
    if (!r.started_at) return false;
    const runningTime = Date.now() - new Date(r.started_at).getTime();
    const timeout = 30 * 60 * 1000; // 30 minutes for all scan types
    return runningTime > timeout;
  }) || [];
  
  // Show warning for stuck scans but don't auto-cleanup from frontend
  // Backend handles cleanup via checkAndFinalizeRun in run-helpers.ts
  useEffect(() => {
    if (stuckScans.length > 0) {
      console.warn(`Detected ${stuckScans.length} potentially stuck scans:`, stuckScans.map(s => ({ id: s.id, source: s.source })));
    }
  }, [stuckScans.length]);
  
  // Track when matching completes to refresh data
  const wasMatchingRef = useRef(false);
  
  useEffect(() => {
    if (matchingProgress && matchingProgress.total > 0) {
      wasMatchingRef.current = true;
    } else if (wasMatchingRef.current && !matchingProgress) {
      // Matching just completed - refresh the data
      wasMatchingRef.current = false;
      queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
      queryClient.invalidateQueries({ queryKey: ['scouted-properties-stats'] });
      toast.success('חישוב ההתאמות הסתיים!');
    }
  }, [matchingProgress, queryClient]);
  
  // Calculate scan progress (non-matching scans only - for scan status card)
  const nonMatchingScans = runningScans?.filter(r => r.source !== 'matching') || [];
  const hasActiveScans = nonMatchingScans.length > 0;
  const scanTotalFound = nonMatchingScans.reduce((sum, r) => sum + (r.properties_found || 0), 0);
  
  // Check if matching run is stuck (for UI display - actual cleanup handled by useEffect above)
  const isMatchingStuck = matchingRun && stuckScans.some(s => s.id === matchingRun.id);

  const { data: properties, isLoading } = useQuery({
    queryKey: ['scouted-properties', appliedFilters, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('scouted_properties')
        .select('*')
        .order('first_seen_at', { ascending: false })
        .range(from, to);

      query = applyFilters(query, appliedFilters);

      const { data, error } = await query;
      if (error) throw error;
      
      return data as ScoutedProperty[];
    }
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scouted_properties')
        .update({ status: 'archived' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
      queryClient.invalidateQueries({ queryKey: ['scouted-properties-stats'] });
      toast.success('הנכס הועבר לארכיון');
    },
    onError: () => {
      toast.error('שגיאה בעדכון הנכס');
    }
  });

  const matchLeadsMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      // Single property re-matching - runs trigger-matching with force
      // This matches all leads against the property 
      const { data, error } = await supabase.functions.invoke('trigger-matching', {
        body: { force: true, send_whatsapp: true }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
      queryClient.invalidateQueries({ queryKey: ['scouted-properties-stats'] });
      toast.success(`ההתאמות עודכנו: ${data.batches_triggered || 0} batches`);
    },
    onError: () => {
      toast.error('שגיאה בהתאמת לקוחות');
    }
  });

  // Match all properties mutation - using distributed architecture
  const matchAllMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('trigger-matching', {
        body: { send_whatsapp: false, force: true }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`הופעל חישוב התאמות ל-${data.total_properties || 0} נכסים ב-${data.batches_triggered || 0} batches`);
      // Don't invalidate immediately - let the polling pick up the progress
    },
    onError: (error) => {
      console.error('Match error:', error);
      toast.error('שגיאה בהפעלת חישוב התאמות');
    }
  });

  // Backfill progress hook
  const backfill = useBackfillProgress();

  const importMutation = useMutation({
    mutationFn: async (scoutedProperty: ScoutedProperty) => {
      // 1. Create property in properties table
      const { data: newProperty, error: insertError } = await supabase
        .from('properties')
        .insert({
          title: scoutedProperty.title || 'נכס מיובא',
          address: scoutedProperty.address || `${scoutedProperty.city || ''} ${scoutedProperty.neighborhood || ''}`.trim() || 'לא ידוע',
          city: scoutedProperty.city || 'לא ידוע',
          neighborhood: scoutedProperty.neighborhood,
          property_size: scoutedProperty.size,
          rooms: scoutedProperty.rooms,
          floor: scoutedProperty.floor,
          monthly_rent: scoutedProperty.price,
          description: scoutedProperty.description,
          status: 'unknown',
          contact_status: 'not_contacted',
          contact_attempts: 0,
          property_type: scoutedProperty.property_type || 'rental',
          parking: scoutedProperty.features?.parking || false,
          elevator: scoutedProperty.features?.elevator || false,
          balcony: scoutedProperty.features?.balcony || false,
          mamad: scoutedProperty.features?.mamad || false,
          available: true,
          show_on_website: false,
          notes: `יובא מ-${scoutedProperty.source}: ${scoutedProperty.source_url}`
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // 2. Import images if available
      if (scoutedProperty.images?.length && newProperty) {
        const imageInserts = scoutedProperty.images.slice(0, 10).map((url, idx) => ({
          property_id: newProperty.id,
          image_url: url,
          order_index: idx,
          is_main: idx === 0
        }));
        
        await supabase.from('property_images').insert(imageInserts);
      }
      
      // 3. Update scouted property status to imported
      await supabase
        .from('scouted_properties')
        .update({ status: 'imported' })
        .eq('id', scoutedProperty.id);
      
      return newProperty;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
      queryClient.invalidateQueries({ queryKey: ['scouted-properties-stats'] });
      toast.success('הנכס יובא בהצלחה למערכת!', {
        action: {
          label: 'צפה בנכס',
          onClick: () => window.open(`/admin/properties/${data.id}`, '_blank')
        }
      });
      setDetailsDialogOpen(false);
    },
    onError: (error) => {
      console.error('Import error:', error);
      toast.error('שגיאה בייבוא הנכס');
    }
  });

  const handleImportProperty = (property: ScoutedProperty | null) => {
    if (!property) return;
    importMutation.mutate(property);
  };

  // No more client-side filtering - DB handles search via applyFilters
  const filteredProperties = properties;

  const totalPages = Math.ceil((totalCount || 0) / PAGE_SIZE);

  const getStatusBadge = (status: string, isActive?: boolean) => {
    if (isActive === false) {
      return <Badge variant="outline" className="text-red-600 border-red-600">לא פעיל</Badge>;
    }
    switch (status) {
      case 'new':
        return <Badge variant="default" className="bg-green-500">חדש</Badge>;
      case 'matched':
        return <Badge variant="secondary">עבר התאמה</Badge>;
      case 'archived':
        return <Badge variant="outline">ארכיון</Badge>;
      case 'imported':
        return <Badge className="bg-blue-500">יובא למערכת</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-red-600 border-red-600">לא פעיל</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'yad2':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">יד2</Badge>;
      case 'yad2_private':
        return <Badge variant="outline" className="text-orange-400 border-orange-400">יד2 פרטי</Badge>;
      case 'madlan':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">מדלן</Badge>;
      case 'homeless':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">הומלס</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  // Handle search button click
  const handleSearch = () => {
    setCurrentPage(1);
    setAppliedFilters({
      roomsMin,
      roomsMax,
      minBudget,
      maxBudget,
      neighborhoods: neighborhoodFilter,
      features: featuresFilter,
      status: statusFilter,
      propertyType: propertyTypeFilter,
      searchTerm,
      source: sourceFilter,
      ownerType: ownerTypeFilter
    });
  };

  // Toggle neighborhood filter (multi-select)
  const toggleNeighborhood = (neighborhood: string) => {
    setNeighborhoodFilter(prev => 
      prev.includes(neighborhood) 
        ? prev.filter(n => n !== neighborhood)
        : [...prev, neighborhood]
    );
  };

  // Toggle feature filter
  const toggleFeature = (feature: string) => {
    setCurrentPage(1);
    setFeaturesFilter(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  // Clear all filters
  const clearAllFilters = () => {
    setCurrentPage(1);
    setSearchTerm('');
    setStatusFilter('all');
    setPropertyTypeFilter('all');
    setSourceFilter('all');
    setOwnerTypeFilter('all');
    setRoomsMin('');
    setRoomsMax('');
    setMinBudget('');
    setMaxBudget('');
    setNeighborhoodFilter([]);
    setFeaturesFilter([]);
    setAppliedFilters({
      roomsMin: '',
      roomsMax: '',
      minBudget: '',
      maxBudget: '',
      neighborhoods: [],
      features: [],
      status: 'all',
      propertyType: 'all',
      searchTerm: '',
      source: 'all',
      ownerType: 'all'
    });
  };

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || propertyTypeFilter !== 'all' || sourceFilter !== 'all' ||
    ownerTypeFilter !== 'all' || roomsMin !== '' || roomsMax !== '' || minBudget !== '' || maxBudget !== '' ||
    neighborhoodFilter.length > 0 || featuresFilter.length > 0;

  return (
    <>
      {/* Statistics Cards - Mobile: 2 combined cards, Desktop: 4 separate */}
      {/* Mobile View - 2 Combined Cards */}
      <div className="grid grid-cols-2 gap-2 mb-4 md:hidden">
        <Card className="overflow-hidden">
          <CardContent className="p-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 rounded bg-primary/10 shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">סה"כ</p>
                <p className="text-lg font-bold leading-none">{stats?.total || 0}</p>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap text-[10px] text-muted-foreground">
              <span className="text-orange-600">יד2:{stats?.bySources?.yad2 || 0}</span>
              <span className="text-purple-600">הומלס:{stats?.bySources?.homeless || 0}</span>
              <span className="text-blue-600">מדלן:{stats?.bySources?.madlan || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 rounded bg-green-500/10 shrink-0">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">היום</p>
                <p className="text-lg font-bold leading-none">{stats?.today || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>כפילויות: {duplicateStats?.groups || 0} קבוצות</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop View - Compact Horizontal Stats Bar */}
      <div className="hidden md:flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5 mb-4 border border-border/50">
        <div className="flex items-center gap-6">
          {/* Total */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">סה"כ:</span>
            <span className="font-bold text-lg">{stats?.total || 0}</span>
          </div>
          
          <div className="h-5 w-px bg-border" />
          
          {/* By Source - Color coded */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-orange-600 font-medium">יד2: {stats?.bySources?.yad2 || 0}</span>
            <span className="text-purple-600 font-medium">הומלס: {stats?.bySources?.homeless || 0}</span>
            <span className="text-blue-600 font-medium">מדלן: {stats?.bySources?.madlan || 0}</span>
          </div>
          
          <div className="h-5 w-px bg-border" />
          
          {/* Today + Week */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              <span className="text-muted-foreground">היום:</span>
              <span className="font-bold text-green-600">{stats?.today || 0}</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">השבוע: <span className="font-semibold">{stats?.week || 0}</span></span>
          </div>
          
          {/* Active Scan Indicator */}
          {hasActiveScans && (
            <>
              <div className="h-5 w-px bg-border" />
              <div className="flex items-center gap-2 text-sm">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping bg-red-500 rounded-full opacity-75" />
                  <div className="relative w-2 h-2 bg-red-500 rounded-full" />
                </div>
                <span className="text-muted-foreground">סריקה: {scanTotalFound}</span>
              </div>
            </>
          )}
        </div>
        
        {/* Action Buttons + Duplicates */}
        <div className="flex items-center gap-2">
          {/* Backfill Button with Progress */}
          {backfill.isRunning ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1 min-w-[160px]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {backfill.progress?.processed_items || 0}/{backfill.progress?.total_items || 0}
                  </span>
                  <span className="font-medium">{backfill.percentComplete}%</span>
                </div>
                <Progress value={backfill.percentComplete} className="h-2" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={backfill.stop}
                disabled={backfill.isStopping}
                className="h-8 text-sm gap-1.5 text-destructive border-destructive/50 hover:bg-destructive/10"
              >
                {backfill.isStopping ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Square className="h-3.5 w-3.5" />
                )}
                עצור
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={backfill.start}
              disabled={backfill.isStarting}
              className="h-8 text-sm gap-1.5"
            >
              {backfill.isStarting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Database className="h-3.5 w-3.5" />
              )}
              השלמת נתונים
            </Button>
          )}
          
          {/* Duplicates - Simplified Sheet */}
          <Sheet open={duplicatesSheetOpen} onOpenChange={setDuplicatesSheetOpen}>
            <SheetTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-yellow-500/10 border border-transparent hover:border-yellow-500/30 transition-colors cursor-pointer">
                <Copy className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">כפילויות: <strong>{duplicateStats?.groups || 0}</strong> קבוצות</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader className="pb-4">
                <SheetTitle className="flex items-center gap-2">
                  <Copy className="h-5 w-5 text-yellow-500" />
                  זיהוי כפילויות
                </SheetTitle>
              </SheetHeader>
              
              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{duplicateStats?.groups || 0}</p>
                  <p className="text-xs text-muted-foreground">קבוצות כפילויות</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{duplicateStats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">נכסים בקבוצות</p>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>לוגיקת זיהוי:</strong> נכסים מזוהים ככפילויות רק כאשר יש להם:
                </p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside">
                  <li>כתובת מדויקת עם מספר בית</li>
                  <li>אותה עיר</li>
                  <li>אותו מספר חדרים</li>
                  <li>אותה קומה</li>
                  <li>גודל דומה (עד 15% הפרש)</li>
                </ul>
              </div>

              {/* Scan Button */}
              <Button 
                onClick={() => runDuplicateDetectionMutation.mutate()}
                disabled={runDuplicateDetectionMutation.isPending}
                variant="outline"
                className="w-full mb-4"
              >
                {runDuplicateDetectionMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 ml-2" />
                )}
                סרוק כפילויות חדשות
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                הסריקה מזהה כפילויות בין מקורות שונים (יד2, מדלן, הומלס)
              </p>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-end">
          {/* Mobile: Compact header with filters button */}
          <div className="flex md:hidden items-center justify-between gap-2">
            <CardTitle className="text-lg whitespace-nowrap">
              דירות ({totalCount || 0})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1">
                    <SlidersHorizontal className="h-4 w-4" />
                    פילטרים
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {(roomsMin ? 1 : 0) + (roomsMax ? 1 : 0) + (minBudget ? 1 : 0) + (maxBudget ? 1 : 0) + neighborhoodFilter.length + featuresFilter.length + (statusFilter !== 'all' ? 1 : 0) + (propertyTypeFilter !== 'all' ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                  <SheetHeader className="pb-4">
                    <SheetTitle>פילטרים</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4">
                    {/* Free text search - Mobile */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">חיפוש חופשי</label>
                      <Input
                        type="text"
                        placeholder="חיפוש לפי כתובת, שכונה..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    {/* Rooms Range */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">חדרים</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="מ-"
                          value={roomsMin}
                          onChange={(e) => setRoomsMin(e.target.value)}
                          className="flex-1 h-10"
                          step="0.5"
                          min="1"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="number"
                          placeholder="עד"
                          value={roomsMax}
                          onChange={(e) => setRoomsMax(e.target.value)}
                          className="flex-1 h-10"
                          step="0.5"
                        />
                      </div>
                    </div>

                    {/* Budget Range */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">תקציב</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="ממחיר"
                          value={minBudget}
                          onChange={(e) => setMinBudget(e.target.value)}
                          className="flex-1 h-10"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="number"
                          placeholder="עד"
                          value={maxBudget}
                          onChange={(e) => setMaxBudget(e.target.value)}
                          className="flex-1 h-10"
                        />
                      </div>
                    </div>

                    {/* Neighborhood - Multi-select with Checkboxes */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">שכונות</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-10 justify-between">
                            <span className="text-sm">
                              {neighborhoodFilter.length === 0 
                                ? 'כל השכונות' 
                                : `${neighborhoodFilter.length} שכונות נבחרו`}
                            </span>
                            {neighborhoodFilter.length > 0 && (
                              <Badge className="h-5 px-1.5">{neighborhoodFilter.length}</Badge>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 max-h-64 overflow-y-auto" align="start">
                          <div className="space-y-2">
                            {Object.keys(NEIGHBORHOOD_GROUPS).map(group => (
                              <div key={group} className="flex items-center gap-2">
                                <Checkbox
                                  id={`mobile-neighborhood-${group}`}
                                  checked={neighborhoodFilter.includes(group)}
                                  onCheckedChange={() => toggleNeighborhood(group)}
                                />
                                <label htmlFor={`mobile-neighborhood-${group}`} className="text-sm cursor-pointer flex-1">
                                  {group}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">סטטוס</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="כל הסטטוסים" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">כל הסטטוסים</SelectItem>
                          <SelectItem value="new">חדש</SelectItem>
                          <SelectItem value="matched">עבר התאמה</SelectItem>
                          <SelectItem value="imported">יובא</SelectItem>
                          <SelectItem value="archived">ארכיון</SelectItem>
                          <SelectItem value="inactive">לא פעיל</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Source Filter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">מקור</label>
                      <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="כל המקורות" />
                        </SelectTrigger>
                        <SelectContent>
                <SelectItem value="all">מקורות</SelectItem>
                          <SelectItem value="yad2">יד2</SelectItem>
                          <SelectItem value="madlan">מדלן</SelectItem>
                          <SelectItem value="homeless">הומלס</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Owner Type (Private/Broker) - Mobile */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">סוג מפרסם</label>
                      <Select value={ownerTypeFilter} onValueChange={setOwnerTypeFilter}>
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="כולם" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">מפרסמים</SelectItem>
                          <SelectItem value="private">פרטי</SelectItem>
                          <SelectItem value="broker">תיווך</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Property Type (Rent/Sale) */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">סוג עסקה</label>
                      <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="כל הנכסים" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">כל הנכסים</SelectItem>
                          <SelectItem value="rent">השכרה</SelectItem>
                          <SelectItem value="sale">מכירה</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Features */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">תוספות</label>
                      <div className="grid grid-cols-2 gap-2">
                        {FEATURE_OPTIONS.map(feature => (
                          <div key={feature.key} className="flex items-center gap-2 p-2 border rounded">
                            <Checkbox
                              id={`mobile-${feature.key}`}
                              checked={featuresFilter.includes(feature.key)}
                              onCheckedChange={() => toggleFeature(feature.key)}
                            />
                            <label htmlFor={`mobile-${feature.key}`} className="text-sm cursor-pointer">
                              {feature.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button 
                        onClick={() => {
                          handleSearch();
                          setMobileFiltersOpen(false);
                        }} 
                        className="flex-1"
                      >
                        <Search className="h-4 w-4 ml-2" />
                        חפש
                      </Button>
                      {hasActiveFilters && (
                        <Button variant="outline" onClick={clearAllFilters}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <Button onClick={handleSearch} size="sm" className="h-9">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Desktop: Dense Filter Bar */}
          <div className="hidden md:flex items-center gap-2 flex-wrap" dir="rtl">
            {/* Title integrated */}
            <span className="font-semibold text-sm whitespace-nowrap">
              דירות ({totalCount || 0})
            </span>
            
            <div className="h-5 w-px bg-border mx-1" />
            
            {/* Search */}
            <Input
              type="text"
              placeholder="🔍 חיפוש..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[150px] h-8 text-sm"
            />
            
            {/* Rooms - Compact */}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="חדרים מ-"
                value={roomsMin}
                onChange={(e) => setRoomsMin(e.target.value)}
                className="w-[85px] h-8 text-sm"
                step="0.5"
                min="1"
                max="10"
              />
              <span className="text-xs text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="חדרים עד"
                value={roomsMax}
                onChange={(e) => setRoomsMax(e.target.value)}
                className="w-[80px] h-8 text-sm"
                step="0.5"
                min="1"
                max="10"
              />
            </div>

            {/* Budget - Compact */}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="תקציב מ-"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                className="w-[90px] h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="תקציב עד"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="w-[85px] h-8 text-sm"
              />
            </div>

            {/* Neighborhood - Multi-select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 min-w-[110px] justify-between text-sm">
                  <span>
                    {neighborhoodFilter.length === 0 
                      ? 'שכונות' 
                      : `${neighborhoodFilter.length} שכונות`}
                  </span>
                  {neighborhoodFilter.length > 0 && (
                    <Badge className="h-4 px-1 ml-1 text-[10px]">{neighborhoodFilter.length}</Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 max-h-64 overflow-y-auto" align="start">
                <div className="space-y-2">
                  {Object.keys(NEIGHBORHOOD_GROUPS).map(group => (
                    <div key={group} className="flex items-center gap-2">
                      <Checkbox
                        id={`desktop-neighborhood-${group}`}
                        checked={neighborhoodFilter.includes(group)}
                        onCheckedChange={() => toggleNeighborhood(group)}
                      />
                      <label htmlFor={`desktop-neighborhood-${group}`} className="text-sm cursor-pointer flex-1">
                        {group}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Source Filter */}
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[90px] h-8 text-sm">
                <SelectValue placeholder="מקורות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">מקורות</SelectItem>
                <SelectItem value="yad2">יד2</SelectItem>
                <SelectItem value="madlan">מדלן</SelectItem>
                <SelectItem value="homeless">הומלס</SelectItem>
              </SelectContent>
            </Select>

            {/* Property Type */}
            <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
              <SelectTrigger className="w-[100px] h-8 text-sm">
                <SelectValue placeholder="סוג עסקה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">עסקאות</SelectItem>
                <SelectItem value="rent">השכרה</SelectItem>
                <SelectItem value="sale">מכירה</SelectItem>
              </SelectContent>
            </Select>

            {/* Owner Type Filter (Private/Broker) - Desktop */}
            <Select value={ownerTypeFilter} onValueChange={setOwnerTypeFilter}>
              <SelectTrigger className="w-[100px] h-8 text-sm">
                <SelectValue placeholder="פרטי/תיווך" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">מפרסמים</SelectItem>
                <SelectItem value="private">פרטי</SelectItem>
                <SelectItem value="broker">תיווך</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 relative">
                  <Filter className="h-3.5 w-3.5" />
                  {featuresFilter.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                      {featuresFilter.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="start">
                <div className="space-y-2">
                  {FEATURE_OPTIONS.map(feature => (
                    <div key={feature.key} className="flex items-center gap-2">
                      <Checkbox
                        id={feature.key}
                        checked={featuresFilter.includes(feature.key)}
                        onCheckedChange={() => toggleFeature(feature.key)}
                      />
                      <label htmlFor={feature.key} className="text-sm cursor-pointer">
                        {feature.label}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Search Button - Icon only */}
            <Button onClick={handleSearch} size="icon" className="h-8 w-8">
              <Search className="h-3.5 w-3.5" />
            </Button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearAllFilters} className="h-8 w-8 text-muted-foreground">
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">מקור</TableHead>
                  <TableHead>פרטים</TableHead>
                  <TableHead className="w-[100px]">מחיר</TableHead>
                  <TableHead className="w-[80px]">חדרים</TableHead>
                  <TableHead className="w-[80px]">גודל</TableHead>
                  <TableHead className="w-[100px]">סטטוס</TableHead>
                  <TableHead className="w-[120px]">התאמות</TableHead>
                  <TableHead className="w-[100px]">נמצא</TableHead>
                  <TableHead className="w-[180px]">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      טוען...
                    </TableCell>
                  </TableRow>
                ) : filteredProperties?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      לא נמצאו דירות התואמות את החיפוש
                    </TableCell>
                  </TableRow>
                ) : filteredProperties?.map((property) => (
                  <TableRow key={property.id} className={property.is_active === false ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getSourceBadge(property.source)}
                        {property.is_private === true && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300 w-fit">פרטי</Badge>
                        )}
                        {property.is_private === false && (
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300 w-fit">תיווך</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {property.property_type === 'rent' ? 'להשכרה' : 'למכירה'}{property.address?.split(',')[0]?.trim() ? ` ב${property.address.split(',')[0].trim()}` : ''}{property.neighborhood ? `, ${property.neighborhood}` : ''}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {property.city?.replace(' יפו', '') || 'תל אביב'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {property.price ? `₪${property.price.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>{property.rooms || '-'}</TableCell>
                    <TableCell>{property.size ? `${property.size} מ"ר` : '-'}</TableCell>
                    <TableCell>{getStatusBadge(property.status, property.is_active)}</TableCell>
                    <TableCell>
                      {property.matched_leads?.length > 0 ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedProperty(property)}
                            >
                              <Users className="h-4 w-4 ml-1" />
                              {property.matched_leads.length} לקוחות
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>לקוחות שהותאמו</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {property.matched_leads.map((match: any, idx: number) => (
                                <div key={idx} className="p-3 border rounded-lg">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium">{match.name}</p>
                                      <p className="text-sm text-muted-foreground">{match.phone}</p>
                                    </div>
                                    <Badge>{match.score}% התאמה</Badge>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {match.reasons?.map((reason: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {reason}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(property.first_seen_at), { 
                        addSuffix: true,
                        locale: he 
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPropertyDetails(property);
                            setDetailsDialogOpen(true);
                          }}
                          title="צפה בפרטים מלאים"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(property.source_url, '_blank')}
                          title="פתח במקור"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        
                        {property.status !== 'imported' && property.status !== 'archived' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleImportProperty(property)}
                            disabled={importMutation.isPending}
                            title="ייבא למערכת"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {property.status === 'new' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => matchLeadsMutation.mutate(property.id)}
                            disabled={matchLeadsMutation.isPending}
                            title="התאם ללקוחות ושלח WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {property.status !== 'archived' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => archiveMutation.mutate(property.id)}
                            title="העבר לארכיון"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3" dir="rtl">
            {isLoading ? (
              <div className="text-center py-8">טוען...</div>
            ) : filteredProperties?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                לא נמצאו דירות התואמות את החיפוש
              </div>
            ) : filteredProperties?.map((property) => (
                <div
                  key={property.id}
                  className={`border border-gray-200 rounded-lg p-2.5 shadow-sm bg-white ${property.is_active === false ? 'opacity-60' : ''}`}
              >
                {/* Row 1: Title/Address, City-Neighborhood, Private/Broker, Source */}
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="font-medium truncate flex-1 min-w-0">
                    {property.property_type === 'rent' ? 'להשכרה' : 'למכירה'}{property.address?.split(',')[0]?.trim() ? ` ב${property.address.split(',')[0].trim()}` : ''}{property.neighborhood ? `, ${property.neighborhood}` : ''}
                  </span>
                  <span className="text-muted-foreground text-xs shrink-0">
                    {property.city?.replace(' יפו', '') || 'תל אביב'}
                  </span>
                  {property.is_private === true && (
                    <Badge variant="outline" className="text-[10px] h-5 px-1 bg-green-50 text-green-700 border-green-300 shrink-0">פרטי</Badge>
                  )}
                  {property.is_private === false && (
                    <Badge variant="outline" className="text-[10px] h-5 px-1 bg-orange-50 text-orange-700 border-orange-300 shrink-0">תיווך</Badge>
                  )}
                  {getSourceBadge(property.source)}
                </div>

                {/* Row 2: Actions | Price+Time */}
                <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t">
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setSelectedPropertyDetails(property);
                        setDetailsDialogOpen(true);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => window.open(property.source_url, '_blank')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    {property.status !== 'imported' && property.status !== 'archived' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleImportProperty(property)}
                        disabled={importMutation.isPending}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {property.status !== 'archived' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => archiveMutation.mutate(property.id)}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Price + Time grouped together */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-sm shrink-0">
                      {property.price ? `₪${property.price.toLocaleString()}` : '-'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {formatDistanceToNow(new Date(property.first_seen_at), { addSuffix: true, locale: he })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                מציג {((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, totalCount || 0)} מתוך {totalCount || 0}
              </div>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-9 px-2 sm:px-3"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="hidden sm:inline mr-1">הקודם</span>
                </Button>
                <span className="text-sm">
                  {currentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 px-2 sm:px-3"
                >
                  <span className="hidden sm:inline ml-1">הבא</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPropertyDetails && getSourceBadge(selectedPropertyDetails.source)}
              <span>{selectedPropertyDetails?.title || 'פרטי נכס'}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedPropertyDetails && (
            <div className="space-y-4">
              {/* Image Gallery */}
              {selectedPropertyDetails.images && selectedPropertyDetails.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedPropertyDetails.images.slice(0, 6).map((img, i) => (
                    <img 
                      key={i} 
                      src={img} 
                      alt={`תמונה ${i + 1}`}
                      className="rounded-lg object-cover h-24 w-full cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(img, '_blank')}
                    />
                  ))}
                </div>
              )}
              
              {/* Technical Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">עיר:</span>
                  <span className="font-medium">{selectedPropertyDetails.city || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">שכונה:</span>
                  <span className="font-medium">{selectedPropertyDetails.neighborhood || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">מחיר:</span>
                  <span className="font-medium">
                    {selectedPropertyDetails.price ? `₪${selectedPropertyDetails.price.toLocaleString()}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">חדרים:</span>
                  <span className="font-medium">{selectedPropertyDetails.rooms || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">גודל:</span>
                  <span className="font-medium">
                    {selectedPropertyDetails.size ? `${selectedPropertyDetails.size} מ"ר` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">קומה:</span>
                  <span className="font-medium">{selectedPropertyDetails.floor || '-'}</span>
                </div>
              </div>
              
              {/* Description */}
              {selectedPropertyDetails.description && (
                <div>
                  <h4 className="font-medium mb-2">תיאור:</h4>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {selectedPropertyDetails.description}
                  </p>
                </div>
              )}
              
              {/* Features */}
              {selectedPropertyDetails.features && Object.keys(selectedPropertyDetails.features).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">תכונות:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedPropertyDetails.features)
                      .filter(([_, v]) => v)
                      .map(([key]) => (
                        <Badge key={key} variant="secondary">{key}</Badge>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={() => window.open(selectedPropertyDetails.source_url, '_blank')}
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 ml-2" />
                  פתח במקור
                </Button>
                
                {selectedPropertyDetails.status !== 'imported' && selectedPropertyDetails.status !== 'archived' && (
                  <Button 
                    onClick={() => handleImportProperty(selectedPropertyDetails)}
                    disabled={importMutation.isPending}
                  >
                    <Download className="h-4 w-4 ml-2" />
                    {importMutation.isPending ? 'מייבא...' : 'ייבא למערכת'}
                  </Button>
                )}
                
                {selectedPropertyDetails.status === 'imported' && (
                  <Badge className="bg-blue-500 py-2 px-4">יובא למערכת</Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
