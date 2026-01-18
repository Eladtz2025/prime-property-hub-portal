import React, { useState } from 'react';
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
import { ExternalLink, Users, MessageSquare, Archive, Search, Eye, Download, ChevronRight, ChevronLeft, TrendingUp, Building2, X, Filter, SlidersHorizontal, CheckCircle2, Loader2, Calculator } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { formatDistanceToNow, startOfDay, startOfWeek } from 'date-fns';
import { he } from 'date-fns/locale';

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
  const [sourceFilter, setSourceFilter] = useState<string>('all');
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
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('all');
  const [featuresFilter, setFeaturesFilter] = useState<string[]>([]);
  
  // Applied filters state - starts with default values to show all properties
  const [appliedFilters, setAppliedFilters] = useState<{
    roomsMin: string;
    roomsMax: string;
    minBudget: string;
    maxBudget: string;
    neighborhood: string;
    features: string[];
    status: string;
    source: string;
  }>({
    roomsMin: '',
    roomsMax: '',
    minBudget: '',
    maxBudget: '',
    neighborhood: 'all',
    features: [],
    status: 'all',
    source: 'all'
  });

  // Statistics query
  const { data: stats } = useQuery({
    queryKey: ['scouted-properties-stats'],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }).toISOString();

      // Total count
      const { count: totalCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true });

      // Today count
      const { count: todayCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .gte('first_seen_at', today);

      // Today by source
      const { data: todayBySourceData } = await supabase
        .from('scouted_properties')
        .select('source')
        .gte('first_seen_at', today);

      const todayBySources = todayBySourceData?.reduce((acc, item) => {
        acc[item.source] = (acc[item.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // This week count
      const { count: weekCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .gte('first_seen_at', weekStart);

      // By source (total) - use separate count queries to avoid 1000 row limit
      const { count: yad2Count } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'yad2');

      const { count: homelessCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'homeless');

      const { count: madlanCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
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

  // Fetch neighborhoods - only Tel Aviv
  const { data: neighborhoods } = useQuery({
    queryKey: ['scouted-properties-neighborhoods-tel-aviv'],
    queryFn: async () => {
      const { data } = await supabase
        .from('scouted_properties')
        .select('neighborhood')
        .not('neighborhood', 'is', null)
        .ilike('city', '%תל אביב%');
      
      const uniqueNeighborhoods = [...new Set(data?.map(d => d.neighborhood).filter(Boolean))].sort() as string[];
      return uniqueNeighborhoods;
    }
  });

  // Build query filters helper - uses appliedFilters
  const applyFilters = (query: any, filters: NonNullable<typeof appliedFilters>) => {
    // Always filter for Tel Aviv
    query = query.ilike('city', '%תל אביב%');
    
    if (filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.source !== 'all') {
      query = query.eq('source', filters.source);
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
    if (filters.neighborhood !== 'all') {
      // Use ilike for partial matching to include sub-neighborhoods
      query = query.ilike('neighborhood', `%${filters.neighborhood}%`);
    }
    // Filter by features in DB query (JSONB)
    if (filters.features.length > 0) {
      filters.features.forEach(feature => {
        query = query.eq(`features->>${feature}`, 'true');
      });
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
  
  const isScanning = runningScans && runningScans.length > 0;
  
  // Get matching progress (separate from scanning)
  const matchingRun = runningScans?.find(r => r.source === 'matching');
  const matchingProgress = matchingRun ? {
    processed: matchingRun.properties_found || 0,
    total: matchingRun.new_properties || 0
  } : null;
  
  // Calculate scan progress (non-matching scans)
  const nonMatchingScans = runningScans?.filter(r => r.source !== 'matching') || [];
  const scanTotalFound = nonMatchingScans.reduce((sum, r) => sum + (r.properties_found || 0), 0);

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
      const { data, error } = await supabase.functions.invoke('match-scouted-to-leads', {
        body: { property_id: propertyId, send_whatsapp: true }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
      queryClient.invalidateQueries({ queryKey: ['scouted-properties-stats'] });
      toast.success(`נמצאו ${data.leads_matched} התאמות, נשלחו ${data.whatsapp_sent} הודעות`);
    },
    onError: () => {
      toast.error('שגיאה בהתאמת לקוחות');
    }
  });

  // Match all properties mutation
  const matchAllMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('match-scouted-to-leads', {
        body: { send_whatsapp: false }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`חושבו ${data.leads_matched || 0} התאמות ל-${data.properties_processed || 0} נכסים`);
      queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
      queryClient.invalidateQueries({ queryKey: ['scouted-properties-stats'] });
    },
    onError: (error) => {
      console.error('Match error:', error);
      toast.error('שגיאה בחישוב התאמות');
    }
  });
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

  const filteredProperties = properties?.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const normalizedTerm = normalizeSearch(term);
    
    // Check both original and normalized versions
    const checkMatch = (value: string | null | undefined) => {
      if (!value) return false;
      const lower = value.toLowerCase();
      return lower.includes(term) || normalizeSearch(lower).includes(normalizedTerm);
    };
    
    return (
      checkMatch(p.title) ||
      checkMatch(p.city) ||
      checkMatch(p.neighborhood) ||
      checkMatch(p.address)
    );
  });

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
      neighborhood: neighborhoodFilter,
      features: featuresFilter,
      status: statusFilter,
      source: sourceFilter
    });
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
    setSourceFilter('all');
    setRoomsMin('');
    setRoomsMax('');
    setMinBudget('');
    setMaxBudget('');
    setNeighborhoodFilter('all');
    setFeaturesFilter([]);
    setAppliedFilters({
      roomsMin: '',
      roomsMax: '',
      minBudget: '',
      maxBudget: '',
      neighborhood: 'all',
      features: [],
      status: 'all',
      source: 'all'
    });
  };

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || sourceFilter !== 'all' || 
    roomsMin !== '' || roomsMax !== '' || minBudget !== '' || maxBudget !== '' ||
    neighborhoodFilter !== 'all' || featuresFilter.length > 0;

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סה"כ דירות</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <div className="flex gap-2 flex-wrap text-xs mt-1">
                  <span className="text-orange-600">יד2: {stats?.bySources?.yad2 || 0}</span>
                  <span className="text-purple-600">הומלס: {stats?.bySources?.homeless || 0}</span>
                  <span className="text-blue-600">מדלן: {stats?.bySources?.madlan || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">נוספו היום</p>
                <p className="text-2xl font-bold">{stats?.today || 0}</p>
                {stats?.today > 0 && (
                  <div className="flex gap-2 flex-wrap text-xs mt-1">
                    {stats?.todayBySources?.yad2 > 0 && (
                      <span className="text-orange-600">יד2: {stats.todayBySources.yad2}</span>
                    )}
                    {stats?.todayBySources?.homeless > 0 && (
                      <span className="text-purple-600">הומלס: {stats.todayBySources.homeless}</span>
                    )}
                    {stats?.todayBySources?.madlan > 0 && (
                      <span className="text-blue-600">מדלן: {stats.todayBySources.madlan}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matches Card - replaces Week card */}
        <Card className={matchAllMutation.isPending || matchingProgress ? 'border-primary/30 bg-primary/5' : ''}>
          <CardContent className="p-4">
            {matchAllMutation.isPending || matchingProgress ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">מחשב התאמות...</p>
                    {matchingProgress && matchingProgress.total > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {matchingProgress.processed} / {matchingProgress.total} נכסים
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">אנא המתן</p>
                    )}
                  </div>
                </div>
                {matchingProgress && matchingProgress.total > 0 && (
                  <div className="space-y-1">
                    <Progress 
                      value={(matchingProgress.processed / matchingProgress.total) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      {Math.round((matchingProgress.processed / matchingProgress.total) * 100)}%
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Button 
                  onClick={() => matchAllMutation.mutate()}
                  disabled={matchAllMutation.isPending || !!matchingProgress}
                  className="w-full gap-2"
                  size="sm"
                >
                  <Calculator className="h-4 w-4" />
                  חשב התאמות
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  מתאים נכסים ללקוחות
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scan Status Card */}
        <Card className={isScanning ? 'border-red-500/30 bg-red-500/5' : ''}>
          <CardContent className="p-4">
            {isScanning ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping bg-red-500 rounded-full opacity-75" />
                  <div className="relative w-3 h-3 bg-red-500 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">סריקות פעילות</p>
                  <p className="text-lg font-bold">{scanTotalFound} נמצאו</p>
                  <Progress value={50} className="h-1.5 mt-1" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">אין סריקות פעילות</p>
                  {stats?.lastScanBySources && (
                    <div className="flex gap-2 flex-wrap text-xs mt-1">
                      <span className="text-orange-600">יד2: {stats.lastScanBySources.yad2 || 0}</span>
                      <span className="text-purple-600">הומלס: {stats.lastScanBySources.homeless || 0}</span>
                      <span className="text-blue-600">מדלן: {stats.lastScanBySources.madlan || 0}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
                        {(roomsMin ? 1 : 0) + (roomsMax ? 1 : 0) + (minBudget ? 1 : 0) + (maxBudget ? 1 : 0) + (neighborhoodFilter !== 'all' ? 1 : 0) + featuresFilter.length + (statusFilter !== 'all' ? 1 : 0) + (sourceFilter !== 'all' ? 1 : 0)}
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

                    {/* Neighborhood */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">שכונה</label>
                      <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="כל השכונות" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">כל השכונות</SelectItem>
                          {neighborhoods?.map(n => (
                            <SelectItem key={n} value={n}>{shortenNeighborhood(n)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

                    {/* Source */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">מקור</label>
                      <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="כל המקורות" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">כל המקורות</SelectItem>
                          <SelectItem value="yad2">יד2</SelectItem>
                          <SelectItem value="yad2_private">יד2 פרטי</SelectItem>
                          <SelectItem value="madlan">מדלן</SelectItem>
                          <SelectItem value="homeless">הומלס</SelectItem>
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

          {/* Desktop: Original inline filters */}
          <div className="hidden md:flex flex-wrap items-center gap-2 w-full" dir="rtl">
            {/* Title */}
            <CardTitle className="whitespace-nowrap ml-4">
              דירות שנסרקו ({totalCount || 0})
            </CardTitle>
            
            {/* Free text search */}
            <Input
              type="text"
              placeholder="חיפוש לפי כתובת, שכונה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[180px] h-9"
            />
            
            {/* Rooms Range */}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="מחדרים"
                value={roomsMin}
                onChange={(e) => setRoomsMin(e.target.value)}
                className="w-[70px] h-9"
                step="0.5"
                min="1"
                max="10"
              />
              <span className="text-muted-foreground text-sm">-</span>
              <Input
                type="number"
                placeholder="עד"
                value={roomsMax}
                onChange={(e) => setRoomsMax(e.target.value)}
                className="w-[55px] h-9"
                step="0.5"
                min="1"
                max="10"
              />
            </div>

            {/* Budget Range */}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="ממחיר"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                className="w-[80px] h-9"
              />
              <span className="text-muted-foreground text-sm">-</span>
              <Input
                type="number"
                placeholder="עד"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="w-[80px] h-9"
              />
            </div>

            {/* Neighborhood */}
            <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="שכונה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל השכונות</SelectItem>
                {neighborhoods?.map(n => (
                  <SelectItem key={n} value={n}>{shortenNeighborhood(n)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Features */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1 px-2">
                  <Filter className="h-3 w-3" />
                  תוספות
                  {featuresFilter.length > 0 && (
                    <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center text-xs">
                      {featuresFilter.length}
                    </Badge>
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

            {/* Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue placeholder="סטטוס" />
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

            {/* Source */}
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[95px] h-9">
                <SelectValue placeholder="מקור" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המקורות</SelectItem>
                <SelectItem value="yad2">יד2</SelectItem>
                <SelectItem value="yad2_private">יד2 פרטי</SelectItem>
                <SelectItem value="madlan">מדלן</SelectItem>
                <SelectItem value="homeless">הומלס</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Button */}
            <Button onClick={handleSearch} size="sm" className="h-9 gap-1">
              <Search className="h-3 w-3" />
              חפש
            </Button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-9 text-muted-foreground px-2">
                <X className="h-3 w-3" />
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
                        <p className="font-medium">{property.title || 'ללא כותרת'}</p>
                        <p className="text-sm text-muted-foreground">
                          {property.city}{property.neighborhood ? ` - ${property.neighborhood}` : ''}
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
          <div className="md:hidden space-y-3">
            {isLoading ? (
              <div className="text-center py-8">טוען...</div>
            ) : filteredProperties?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                לא נמצאו דירות התואמות את החיפוש
              </div>
            ) : filteredProperties?.map((property) => (
              <div 
                key={property.id} 
                className={`border rounded-lg p-3 space-y-2 ${property.is_active === false ? 'opacity-60' : ''}`}
              >
                {/* Header: Source + Status + Time */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {getSourceBadge(property.source)}
                    {property.is_private === true && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">פרטי</Badge>
                    )}
                    {property.is_private === false && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300">תיווך</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(property.first_seen_at), { addSuffix: true, locale: he })}
                  </span>
                </div>

                {/* Title + Location */}
                <div>
                  <p className="font-medium text-sm truncate">{property.title || 'ללא כותרת'}</p>
                  <p className="text-xs text-muted-foreground">
                    {property.city}{property.neighborhood ? ` - ${property.neighborhood}` : ''}
                  </p>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium">
                    {property.price ? `₪${property.price.toLocaleString()}` : '-'}
                  </span>
                  <span>{property.rooms || '-'} חד׳</span>
                  <span>{property.size ? `${property.size} מ"ר` : '-'}</span>
                  {getStatusBadge(property.status, property.is_active)}
                </div>

                {/* Matched Leads */}
                {property.matched_leads?.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-purple-600">
                    <Users className="h-3 w-3" />
                    <span>{property.matched_leads.length} התאמות</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 pt-1 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => {
                      setSelectedPropertyDetails(property);
                      setDetailsDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => window.open(property.source_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  
                  {property.status !== 'imported' && property.status !== 'archived' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleImportProperty(property)}
                      disabled={importMutation.isPending}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {property.status === 'new' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => matchLeadsMutation.mutate(property.id)}
                      disabled={matchLeadsMutation.isPending}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {property.status !== 'archived' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => archiveMutation.mutate(property.id)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
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
