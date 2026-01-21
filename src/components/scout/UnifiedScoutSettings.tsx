import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  ListFilter,
  Calendar,
  Plus,
  Play,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  AlertTriangle,
  Database,
  RefreshCw,
  Timer,
  FileText,
  Target,
  Link,
} from 'lucide-react';
import { useScoutSettings, useUpdateScoutSetting, defaultSettings } from '@/hooks/useScoutSettings';

// Scout Config types
interface ScoutConfig {
  id: string;
  name: string;
  source: string;
  cities: string[] | null;
  neighborhoods: string[] | null;
  property_type: string;
  min_price: number | null;
  max_price: number | null;
  min_rooms: number | null;
  max_rooms: number | null;
  min_size: number | null;
  max_size: number | null;
  is_active: boolean;
  search_url: string | null;
  last_run_at: string | null;
  last_run_status: string | null;
  created_at: string;
}

const SOURCES = [
  { value: 'yad2', label: 'יד2' },
  { value: 'madlan', label: 'מדלן' },
  { value: 'homeless', label: 'הומלס' },
];

const PROPERTY_TYPES = [
  { value: 'rent', label: 'להשכרה' },
  { value: 'sale', label: 'למכירה' },
  { value: 'both', label: 'הכל' },
];

// Technical parameters per source - matches Edge Function configs
const SOURCE_TECHNICAL_PARAMS: Record<string, {
  getPages: (settings: any) => number;
  delaySeconds: number;
  waitForMs: number;
  schedule: string[];
}> = {
  yad2: {
    getPages: (settings) => settings?.scraping?.yad2_pages ?? 4,
    delaySeconds: 15,
    waitForMs: 5000,
    schedule: ['08:30', '16:30', '22:30'],
  },
  madlan: {
    getPages: (settings) => settings?.scraping?.madlan_pages ?? 15,
    delaySeconds: 5,
    waitForMs: 8000,
    schedule: ['08:10', '16:10', '22:10'],
  },
  homeless: {
    getPages: (settings) => settings?.scraping?.homeless_pages ?? 5,
    delaySeconds: 2,
    waitForMs: 3000,
    schedule: ['08:00', '16:00', '22:00'],
  },
};

const CITIES = [
  'תל אביב',
  'הרצליה',
  'רמת גן',
  'גבעתיים',
  'רמת השרון',
  'כפר סבא',
  'רעננה',
  'הוד השרון',
  'פתח תקווה',
  'ראשון לציון',
  'חולון',
  'בת ים',
  'נתניה',
  'אשדוד',
  'ירושלים',
  'חיפה',
  'באר שבע',
];

export const UnifiedScoutSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading: settingsLoading } = useScoutSettings();
  const updateSetting = useUpdateScoutSetting();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ScoutConfig | null>(null);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [selectedConfigs, setSelectedConfigs] = useState<Set<string>>(new Set());
  const [isDuplicatesDialogOpen, setIsDuplicatesDialogOpen] = useState(false);
  const [isMatchingDialogOpen, setIsMatchingDialogOpen] = useState(false);
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    source: 'yad2',
    cities: [] as string[],
    property_type: 'rent',
    min_price: '',
    max_price: '',
    min_rooms: '',
    max_rooms: '',
    search_url: '',
    // Technical parameters
    max_pages: '',
    page_delay_seconds: '',
    wait_for_ms: '',
    schedule_time_1: '',
    schedule_time_2: '',
    schedule_time_3: '',
  });

  // Fetch backfill progress
  const { data: backfillProgress, refetch: refetchProgress } = useQuery({
    queryKey: ['backfill-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backfill_progress')
        .select('*')
        .eq('task_name', 'backfill_entry_dates')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    refetchInterval: isBackfilling ? 3000 : false,
  });

  // Update isBackfilling state based on progress
  useEffect(() => {
    if (backfillProgress?.status === 'running') {
      setIsBackfilling(true);
    } else if (backfillProgress?.status === 'completed' || backfillProgress?.status === 'failed') {
      setIsBackfilling(false);
    }
  }, [backfillProgress?.status]);

  // Ref to prevent duplicate concurrent calls
  const isProcessingRef = useRef(false);

  // Auto-continue backfill with proper mutex handling
  useEffect(() => {
    // Skip if not backfilling or already processing
    if (!isBackfilling || isProcessingRef.current) return;
    if (backfillProgress?.status !== 'running') return;
    
    const processedItems = backfillProgress?.processed_items || 0;
    const totalItems = backfillProgress?.total_items || 0;
    
    // Check if completed
    if (processedItems >= totalItems && totalItems > 0) {
      toast.success('עדכון תאריכי כניסה הושלם!');
      setIsBackfilling(false);
      return;
    }

    // Schedule next batch with longer delay to prevent overlap
    const timer = setTimeout(async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      
      try {
        console.log(`Triggering backfill batch, progress: ${processedItems}/${totalItems}`);
        
        const { data, error } = await supabase.functions.invoke('backfill-entry-dates', {
          body: { batch_size: 15 },
        });
        
        if (error) {
          console.error('Continue error:', error);
          toast.error('שגיאה בהמשך העדכון');
          setIsBackfilling(false);
          return;
        }
        
        // If skipped due to mutex, just refetch and wait
        if (data?.skipped) {
          console.log('Batch skipped - another instance processing');
        } else if (data?.completed) {
          toast.success('עדכון תאריכי כניסה הושלם בהצלחה!');
          setIsBackfilling(false);
        }
        
        refetchProgress();
      } catch (err) {
        console.error('Continue error:', err);
        setIsBackfilling(false);
      } finally {
        isProcessingRef.current = false;
      }
    }, 5000); // Increased to 5 seconds to prevent overlap
    
    return () => clearTimeout(timer);
  }, [isBackfilling, backfillProgress?.processed_items, backfillProgress?.status]);

  // Fetch scout configs
  const { data: configs, isLoading: configsLoading } = useQuery({
    queryKey: ['scout-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_configs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ScoutConfig[];
    },
  });

  // Group configs by source
  const configsBySource = React.useMemo(() => {
    if (!configs) return {};
    return configs.reduce((acc, config) => {
      const source = config.source;
      if (!acc[source]) acc[source] = [];
      acc[source].push(config);
      return acc;
    }, {} as Record<string, ScoutConfig[]>);
  }, [configs]);

  // Toggle config selection
  const toggleConfigSelection = (configId: string) => {
    setSelectedConfigs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(configId)) {
        newSet.delete(configId);
      } else {
        newSet.add(configId);
      }
      return newSet;
    });
  };

  // Run selected configs
  const runSelectedConfigs = async () => {
    const ids = Array.from(selectedConfigs);
    toast.info(`מפעיל ${ids.length} סריקות...`);
    
    for (const configId of ids) {
      try {
        await runConfigMutation.mutateAsync(configId);
      } catch (error) {
        console.error(`Failed to run config ${configId}:`, error);
      }
    }
    
    setSelectedConfigs(new Set());
    toast.success(`הופעלו ${ids.length} סריקות`);
  };

  // Config mutations
  const createConfigMutation = useMutation({
    mutationFn: async (config: { name: string; source: string; cities: string[] | null; property_type: string; min_price: number | null; max_price: number | null; min_rooms: number | null; max_rooms: number | null; search_url: string | null }) => {
      const { data, error } = await supabase
        .from('scout_configs')
        .insert([config])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scout-configs'] });
      toast.success('הגדרה נוצרה בהצלחה');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast.error('שגיאה ביצירת ההגדרה'),
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, ...config }: { id: string; name: string; source: string; cities: string[] | null; property_type: string; min_price: number | null; max_price: number | null; min_rooms: number | null; max_rooms: number | null; search_url: string | null }) => {
      const { error } = await supabase
        .from('scout_configs')
        .update(config)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scout-configs'] });
      toast.success('הגדרה עודכנה בהצלחה');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast.error('שגיאה בעדכון ההגדרה'),
  });

  const deleteConfigMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scout_configs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scout-configs'] });
      toast.success('הגדרה נמחקה');
    },
    onError: () => toast.error('שגיאה במחיקת ההגדרה'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('scout_configs')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scout-configs'] }),
    onError: () => toast.error('שגיאה בעדכון הסטטוס'),
  });

  const runConfigMutation = useMutation({
    mutationFn: async (configId: string) => {
      const { error } = await supabase.functions.invoke('scout-properties', {
        body: { configId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('סריקה הופעלה');
      queryClient.invalidateQueries({ queryKey: ['scout-configs'] });
    },
    onError: () => toast.error('שגיאה בהפעלת הסריקה'),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      source: 'yad2',
      cities: [],
      property_type: 'rental',
      min_price: '',
      max_price: '',
      min_rooms: '',
      max_rooms: '',
      search_url: '',
      max_pages: '',
      page_delay_seconds: '',
      wait_for_ms: '',
      schedule_time_1: '',
      schedule_time_2: '',
      schedule_time_3: '',
    });
    setEditingConfig(null);
  };

  const openEditDialog = (config: ScoutConfig) => {
    setEditingConfig(config);
    const sourceDefaults = SOURCE_TECHNICAL_PARAMS[config.source];
    const defaultSchedule = sourceDefaults?.schedule || ['08:30', '16:30', '22:30'];
    const configSchedule = (config as any).schedule_times;
    
    setFormData({
      name: config.name,
      source: config.source,
      cities: config.cities || [],
      property_type: config.property_type,
      min_price: config.min_price?.toString() || '',
      max_price: config.max_price?.toString() || '',
      min_rooms: config.min_rooms?.toString() || '',
      max_rooms: config.max_rooms?.toString() || '',
      search_url: config.search_url || '',
      // Technical parameters - use existing values OR source defaults
      max_pages: ((config as any).max_pages ?? sourceDefaults?.getPages(settings) ?? 3).toString(),
      page_delay_seconds: ((config as any).page_delay_seconds ?? sourceDefaults?.delaySeconds ?? 15).toString(),
      wait_for_ms: ((config as any).wait_for_ms ?? sourceDefaults?.waitForMs ?? 5000).toString(),
      // Schedule times - use existing values OR source defaults
      schedule_time_1: configSchedule?.[0] ?? defaultSchedule[0],
      schedule_time_2: configSchedule?.[1] ?? defaultSchedule[1],
      schedule_time_3: configSchedule?.[2] ?? defaultSchedule[2],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    // Combine 3 schedule time fields into array
    const scheduleArray = [
      formData.schedule_time_1,
      formData.schedule_time_2,
      formData.schedule_time_3,
    ].filter(Boolean);
    
    const configData = {
      name: formData.name,
      source: formData.source,
      cities: formData.cities.length > 0 ? formData.cities : null,
      property_type: formData.property_type,
      min_price: formData.min_price ? parseInt(formData.min_price) : null,
      max_price: formData.max_price ? parseInt(formData.max_price) : null,
      min_rooms: formData.min_rooms ? parseFloat(formData.min_rooms) : null,
      max_rooms: formData.max_rooms ? parseFloat(formData.max_rooms) : null,
      search_url: formData.search_url || null,
      // Technical parameters - always save as numbers
      max_pages: formData.max_pages ? parseInt(formData.max_pages) : null,
      page_delay_seconds: formData.page_delay_seconds ? parseInt(formData.page_delay_seconds) : null,
      wait_for_ms: formData.wait_for_ms ? parseInt(formData.wait_for_ms) : null,
      schedule_times: scheduleArray.length > 0 ? scheduleArray : null,
    };

    if (editingConfig) {
      updateConfigMutation.mutate({ id: editingConfig.id, ...configData });
    } else {
      createConfigMutation.mutate(configData);
    }
  };

  // Settings handlers
  const handleNumberChange = (category: string, setting_key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateSetting.mutate({ category, setting_key, setting_value: numValue });
    }
  };

  const handleBooleanChange = (category: string, setting_key: string, value: boolean) => {
    updateSetting.mutate({ category, setting_key, setting_value: value });
  };

  // Backfill entry dates handler
  const handleBackfillEntryDates = async () => {
    try {
      setIsBackfilling(true);
      toast.info('מתחיל עדכון תאריכי כניסה...');
      
      // Delete any existing progress to start completely fresh
      await supabase
        .from('backfill_progress')
        .delete()
        .eq('task_name', 'backfill_entry_dates');
      
      const { error } = await supabase.functions.invoke('backfill-entry-dates', {
        body: { batch_size: 30 },
      });
      
      if (error) throw error;
      
      refetchProgress();
    } catch (error) {
      console.error('Backfill error:', error);
      toast.error('שגיאה בהפעלת העדכון');
      setIsBackfilling(false);
    }
  };

  // Cancel backfill
  const handleCancelBackfill = async () => {
    try {
      await supabase.functions.invoke('backfill-entry-dates', {
        body: { cancel: true },
      });
      toast.info('בוטל');
      setIsBackfilling(false);
      refetchProgress();
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  // Continue backfill if more items
  const continueBackfill = async (continueFrom: string) => {
    try {
      console.log('Continuing backfill from:', continueFrom);
      
      const { data, error } = await supabase.functions.invoke('backfill-entry-dates', {
        body: { batch_size: 30, continue_from: continueFrom },
      });
      
      if (error) throw error;
      
      // Check if completed
      if (data?.completed) {
        toast.success('עדכון תאריכי כניסה הושלם בהצלחה!');
        setIsBackfilling(false);
      }
      
      refetchProgress();
    } catch (error) {
      console.error('Continue backfill error:', error);
      toast.error('שגיאה בהמשך העדכון');
      setIsBackfilling(false);
    }
  };
  
  // Calculate estimated time remaining
  const getEstimatedTime = () => {
    if (!backfillProgress?.started_at || !backfillProgress?.processed_items || backfillProgress.processed_items === 0) {
      return null;
    }
    const elapsed = Date.now() - new Date(backfillProgress.started_at).getTime();
    const rate = backfillProgress.processed_items / (elapsed / 60000); // per minute
    const remaining = (backfillProgress.total_items || 0) - backfillProgress.processed_items;
    const minutesLeft = Math.ceil(remaining / rate);
    return { rate: Math.round(rate), minutesLeft };
  };

  // Count changes from defaults
  const countChangesFromDefault = () => {
    if (!settings) return 0;
    let changes = 0;
    
    Object.entries(defaultSettings).forEach(([category, categorySettings]) => {
      Object.entries(categorySettings).forEach(([key, defaultValue]) => {
        const currentValue = (settings as any)[category]?.[key];
        if (currentValue !== undefined && currentValue !== defaultValue) {
          changes++;
        }
      });
    });
    
    return changes;
  };

  if (settingsLoading || configsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const changesCount = countChangesFromDefault();
  const progressPercent = backfillProgress?.total_items 
    ? Math.round(((backfillProgress.processed_items || 0) / backfillProgress.total_items) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={[]} className="space-y-4">
        {/* Scout Configurations */}
        <AccordionItem value="configs" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <ListFilter className="h-5 w-5 text-primary" />
              <span className="font-semibold">קונפיגורציות סריקה</span>
              <Badge variant="secondary" className="mr-2">
                {configs?.filter(c => c.is_active).length || 0} פעילות
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {/* Add button */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף הגדרה חדשה
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingConfig ? 'עריכת הגדרה' : 'הוספת הגדרה חדשה'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>שם ההגדרה</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="לדוגמה: תל אביב 3-4 חדרים"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>מקור</Label>
                        <Select
                          value={formData.source}
                          onValueChange={(value) => setFormData({ ...formData, source: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SOURCES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>סוג נכס</Label>
                        <Select
                          value={formData.property_type}
                          onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PROPERTY_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>ערים</Label>
                      <Select
                        value={formData.cities[0] || ''}
                        onValueChange={(value) => setFormData({ ...formData, cities: [value] })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="בחר עיר" />
                        </SelectTrigger>
                        <SelectContent>
                          {CITIES.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>מחיר מינימום</Label>
                        <Input
                          type="number"
                          value={formData.min_price}
                          onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                          placeholder="₪"
                        />
                      </div>
                      <div>
                        <Label>מחיר מקסימום</Label>
                        <Input
                          type="number"
                          value={formData.max_price}
                          onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                          placeholder="₪"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>חדרים מינימום</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={formData.min_rooms}
                          onChange={(e) => setFormData({ ...formData, min_rooms: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>חדרים מקסימום</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={formData.max_rooms}
                          onChange={(e) => setFormData({ ...formData, max_rooms: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>URL מותאם אישית (אופציונלי)</Label>
                      <Input
                        value={formData.search_url}
                        onChange={(e) => setFormData({ ...formData, search_url: e.target.value })}
                        placeholder="https://..."
                        dir="ltr"
                      />
                    </div>
                    
                    {/* Technical Parameters Section */}
                    <div className="border-t pt-4 mt-2">
                      <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                        פרמטרים טכניים (השאר ריק לברירת מחדל)
                      </Label>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">דפים לסריקה</Label>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={formData.max_pages}
                            onChange={(e) => setFormData({ ...formData, max_pages: e.target.value })}
                            placeholder={SOURCE_TECHNICAL_PARAMS[formData.source]?.getPages(settings)?.toString() || '4'}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">delay (שניות)</Label>
                          <Input
                            type="number"
                            min={1}
                            max={60}
                            value={formData.page_delay_seconds}
                            onChange={(e) => setFormData({ ...formData, page_delay_seconds: e.target.value })}
                            placeholder={SOURCE_TECHNICAL_PARAMS[formData.source]?.delaySeconds?.toString() || '10'}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">waitFor (ms)</Label>
                          <Input
                            type="number"
                            min={1000}
                            max={15000}
                            step={500}
                            value={formData.wait_for_ms}
                            onChange={(e) => setFormData({ ...formData, wait_for_ms: e.target.value })}
                            placeholder={SOURCE_TECHNICAL_PARAMS[formData.source]?.waitForMs?.toString() || '5000'}
                          />
                        </div>
                      </div>
                      
                      {/* Schedule Times - 3 separate fields */}
                      <div className="mt-3">
                        <Label className="text-xs">שעות ריצה</Label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">שעה 1</Label>
                            <Input
                              type="time"
                              value={formData.schedule_time_1}
                              onChange={(e) => setFormData({ ...formData, schedule_time_1: e.target.value })}
                              dir="ltr"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">שעה 2</Label>
                            <Input
                              type="time"
                              value={formData.schedule_time_2}
                              onChange={(e) => setFormData({ ...formData, schedule_time_2: e.target.value })}
                              dir="ltr"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">שעה 3</Label>
                            <Input
                              type="time"
                              value={formData.schedule_time_3}
                              onChange={(e) => setFormData({ ...formData, schedule_time_3: e.target.value })}
                              dir="ltr"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleSubmit}
                      disabled={!formData.name || createConfigMutation.isPending || updateConfigMutation.isPending}
                      className="w-full"
                    >
                      {createConfigMutation.isPending || updateConfigMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : editingConfig ? (
                        'עדכן'
                      ) : (
                        'צור'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Selection bar */}
              {selectedConfigs.size > 0 && (
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedConfigs.size} קונפיגורציות נבחרו
                  </span>
                  <Button 
                    size="sm" 
                    onClick={runSelectedConfigs}
                    disabled={runConfigMutation.isPending}
                  >
                    <Play className="h-4 w-4 ml-2" />
                    הרץ נבחרות
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedConfigs(new Set())}
                  >
                    בטל בחירה
                  </Button>
                </div>
              )}

              {/* Config list - flat grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {configs?.map((config) => (
                  <Card key={config.id} className={`${!config.is_active ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <Checkbox
                          checked={selectedConfigs.has(config.id)}
                          onCheckedChange={() => toggleConfigSelection(config.id)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">{config.name}</span>
                            <Badge variant={config.is_active ? 'default' : 'secondary'} className="text-xs">
                              {config.is_active ? 'פעיל' : 'מושבת'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {SOURCES.find(s => s.value === config.source)?.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {PROPERTY_TYPES.find(t => t.value === config.property_type)?.label}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex flex-wrap gap-2 mt-1">
                            {config.cities?.length > 0 && (
                              <span>{config.cities.join(', ')}</span>
                            )}
                            {config.min_price && config.max_price && (
                              <span>
                                ₪{config.min_price.toLocaleString()} - ₪{config.max_price.toLocaleString()}
                              </span>
                            )}
                            {config.min_rooms && config.max_rooms && (
                              <span>{config.min_rooms}-{config.max_rooms} חדרים</span>
                            )}
                          </div>
                          {/* Technical parameters */}
                          {SOURCE_TECHNICAL_PARAMS[config.source] && (
                            <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground flex flex-wrap gap-3">
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {(config as any).max_pages ?? SOURCE_TECHNICAL_PARAMS[config.source].getPages(settings)} דפים
                                {(config as any).max_pages && <span className="text-primary font-bold">*</span>}
                              </span>
                              <span className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {(config as any).page_delay_seconds ?? SOURCE_TECHNICAL_PARAMS[config.source].delaySeconds}s
                                {(config as any).page_delay_seconds && <span className="text-primary font-bold">*</span>}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {(config as any).schedule_times?.join(', ') || SOURCE_TECHNICAL_PARAMS[config.source].schedule.join(', ')}
                                {(config as any).schedule_times && <span className="text-primary font-bold">*</span>}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Switch
                            checked={config.is_active}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({ id: config.id, is_active: checked })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => runConfigMutation.mutate(config.id)}
                            disabled={runConfigMutation.isPending}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(config)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteConfigMutation.mutate(config.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {(!configs || configs.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  אין הגדרות סריקה. לחץ על "הוסף הגדרה חדשה" להתחיל.
                </div>
              )}

              {/* Duplicates, Matching & Availability Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                {/* Duplicates Card */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => setIsDuplicatesDialogOpen(true)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                          <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h4 className="font-medium">זיהוי כפילויות</h4>
                          <p className="text-sm text-muted-foreground">
                            סף הפרש מחיר: {Math.round((settings?.duplicates?.price_diff_threshold ?? 0.2) * 100)}%
                          </p>
                        </div>
                      </div>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                {/* Matching Card */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => setIsMatchingDialogOpen(true)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                          <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-medium">התאמה ללקוחות</h4>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              מקס׳ {settings?.matching?.max_matches_per_property ?? 20} התאמות
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              <span>08:15, 16:15, 22:15</span>
                              <Badge variant="outline" className="text-[10px] px-1 py-0">אוטומטי</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                {/* Availability Card */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => setIsAvailabilityDialogOpen(true)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <Link className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium">בדיקת זמינות</h4>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              אחרי {settings?.availability?.min_days_before_check ?? 3} ימים
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              <span>05:00</span>
                              <Badge variant="outline" className="text-[10px] px-1 py-0">אוטומטי</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Database Tools */}
        <AccordionItem value="database" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <span className="font-semibold">כלי מסד נתונים</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">עדכון תאריכי כניסה לנכסים קיימים</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    סריקה מחדש של כל נכסי השכירות הפעילים שחסר להם תאריך כניסה, חילוץ התאריך מהמודעה המקורית ועדכון בבסיס הנתונים.
                  </p>
                  
                  {backfillProgress && backfillProgress.status === 'running' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>התקדמות:</span>
                        <span>{backfillProgress.processed_items || 0} / {backfillProgress.total_items || 0}</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="text-success">✓ הצליחו: {backfillProgress.successful_items || 0}</span>
                        <span className="text-destructive">✗ נכשלו: {backfillProgress.failed_items || 0}</span>
                      </div>
                      {(() => {
                        const estimate = getEstimatedTime();
                        return estimate ? (
                          <div className="text-xs text-muted-foreground">
                            קצב: ~{estimate.rate} נכסים/דקה | זמן משוער: ~{estimate.minutesLeft} דקות
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                  
                  {backfillProgress && backfillProgress.status === 'completed' && (
                    <div className="p-3 bg-success/10 rounded-lg text-sm">
                      <span className="text-success">
                        ✓ הושלם! עודכנו {backfillProgress.successful_items || 0} נכסים, נכשלו {backfillProgress.failed_items || 0}
                      </span>
                    </div>
                  )}
                  
                  {backfillProgress && backfillProgress.status === 'failed' && (
                    <div className="p-3 bg-destructive/10 rounded-lg text-sm">
                      <span className="text-destructive">
                        ✗ נכשל: {backfillProgress.error_message}
                      </span>
                    </div>
                  )}

                  {backfillProgress && backfillProgress.status === 'cancelled' && (
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <span className="text-muted-foreground">
                        בוטל. עובדו {backfillProgress.processed_items || 0} נכסים.
                      </span>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleBackfillEntryDates}
                      disabled={isBackfilling}
                      className="flex-1 sm:flex-none"
                    >
                      {isBackfilling ? (
                        <>
                          <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                          מעדכן...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 ml-2" />
                          עדכן תאריכי כניסה
                        </>
                      )}
                    </Button>
                    
                    {isBackfilling && (
                      <Button 
                        variant="outline"
                        onClick={handleCancelBackfill}
                      >
                        ביטול
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Duplicates Settings Dialog */}
      <Dialog open={isDuplicatesDialogOpen} onOpenChange={setIsDuplicatesDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              הגדרות זיהוי כפילויות
            </DialogTitle>
            <DialogDescription>
              נכסים נחשבים כפולים אם יש להם: כתובת עם מספר + חדרים + עיר + קומה + מחיר (עד סף ההפרש)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>סף הפרש מחיר (%)</Label>
              <Input
                type="number"
                min={5}
                max={50}
                value={Math.round((settings?.duplicates?.price_diff_threshold ?? 0.2) * 100)}
                onChange={(e) => handleNumberChange('duplicates', 'price_diff_threshold', (parseFloat(e.target.value) / 100).toString())}
              />
              <p className="text-xs text-muted-foreground">
                ברירת מחדל: 20% - נכסים עם מחיר זהה או הפרש עד 20% ייחשבו ככפילויות
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Matching Settings Dialog */}
      <Dialog open={isMatchingDialogOpen} onOpenChange={setIsMatchingDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              הגדרות התאמה ללקוחות
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            
            {/* Two-stage matching explanation */}
            <div className="space-y-3">
              {/* Stage 1: Lead Eligibility */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <h5 className="font-medium text-sm flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                  כשירות לקוח (אוטומטי)
                </h5>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1.5">
                  מתעדכן אוטומטית בכל שינוי בפרטי הלקוח
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  דרישות: ערים + שכונות + תקציב + טווח חדרים
                </p>
              </div>
              
              {/* Stage 2: Property Matching */}
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <h5 className="font-medium text-sm flex items-center gap-2 text-green-800 dark:text-green-200">
                  <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                  התאמת נכס (08:15, 16:15, 22:15)
                </h5>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1.5">
                  רץ רק על לקוחות כשירים
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  סוג עסקה → עיר → שכונה → מחיר → חדרים → תכונות → תאריך כניסה
                </p>
              </div>
            </div>
            
            {/* Dynamic Price Flexibility - Editable */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h5 className="font-medium text-sm">זליגת מחיר דינמית (להשכרה)</h5>
              <div className="space-y-3">
                {/* Range 1 */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground min-w-[60px]">טווח 1:</span>
                  <span>עד ₪</span>
                  <Input
                    type="number"
                    className="w-24 h-8"
                    value={settings?.matching?.rent_flex_low_threshold ?? 7000}
                    onChange={(e) => handleNumberChange('matching', 'rent_flex_low_threshold', e.target.value)}
                  />
                  <span>→ זליגה</span>
                  <Input
                    type="number"
                    className="w-16 h-8"
                    min={1}
                    max={50}
                    value={Math.round((settings?.matching?.rent_flex_low_percent ?? 0.15) * 100)}
                    onChange={(e) => handleNumberChange('matching', 'rent_flex_low_percent', (parseFloat(e.target.value) / 100).toString())}
                  />
                  <span>%</span>
                </div>
                {/* Range 2 */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground min-w-[60px]">טווח 2:</span>
                  <span>עד ₪</span>
                  <Input
                    type="number"
                    className="w-24 h-8"
                    value={settings?.matching?.rent_flex_mid_threshold ?? 15000}
                    onChange={(e) => handleNumberChange('matching', 'rent_flex_mid_threshold', e.target.value)}
                  />
                  <span>→ זליגה</span>
                  <Input
                    type="number"
                    className="w-16 h-8"
                    min={1}
                    max={50}
                    value={Math.round((settings?.matching?.rent_flex_mid_percent ?? 0.10) * 100)}
                    onChange={(e) => handleNumberChange('matching', 'rent_flex_mid_percent', (parseFloat(e.target.value) / 100).toString())}
                  />
                  <span>%</span>
                </div>
                {/* Range 3 */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground min-w-[60px]">טווח 3:</span>
                  <span className="text-muted-foreground">מעל</span>
                  <div className="w-24" />
                  <span>→ זליגה</span>
                  <Input
                    type="number"
                    className="w-16 h-8"
                    min={1}
                    max={50}
                    value={Math.round((settings?.matching?.rent_flex_high_percent ?? 0.08) * 100)}
                    onChange={(e) => handleNumberChange('matching', 'rent_flex_high_percent', (parseFloat(e.target.value) / 100).toString())}
                  />
                  <span>%</span>
                </div>
              </div>
            </div>

            {/* Entry Date Settings */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h5 className="font-medium text-sm">הגדרות תאריך כניסה</h5>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground flex-1">"מיידי" = זמין תוך</span>
                  <Input
                    type="number"
                    className="w-16 h-8"
                    min={7}
                    max={90}
                    value={settings?.matching?.immediate_max_days ?? 30}
                    onChange={(e) => handleNumberChange('matching', 'immediate_max_days', e.target.value)}
                  />
                  <span>ימים</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground flex-1">חיפוש מדויק: ±</span>
                  <Input
                    type="number"
                    className="w-16 h-8"
                    min={3}
                    max={30}
                    value={settings?.matching?.entry_date_range_strict ?? 10}
                    onChange={(e) => handleNumberChange('matching', 'entry_date_range_strict', e.target.value)}
                  />
                  <span>ימים</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground flex-1">חיפוש גמיש: ±</span>
                  <Input
                    type="number"
                    className="w-16 h-8"
                    min={7}
                    max={60}
                    value={settings?.matching?.entry_date_range_flexible ?? 14}
                    onChange={(e) => handleNumberChange('matching', 'entry_date_range_flexible', e.target.value)}
                  />
                  <span>ימים</span>
                </div>
              </div>
            </div>
            
            {/* Max Matches */}
            <div className="space-y-2">
              <Label>מקסימום התאמות לנכס</Label>
              <Input
                type="number"
                min={5}
                max={100}
                value={settings?.matching?.max_matches_per_property ?? 20}
                onChange={(e) => handleNumberChange('matching', 'max_matches_per_property', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">ברירת מחדל: 20 לקוחות לנכס</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Availability Settings Dialog */}
      <Dialog open={isAvailabilityDialogOpen} onOpenChange={setIsAvailabilityDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="h-5 w-5 text-blue-600" />
              הגדרות בדיקת זמינות
            </DialogTitle>
            <DialogDescription>
              בודק אם נכסים עדיין פעילים ומסמן כלא פעילים נכסים שהוסרו
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Check Timing Settings */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h5 className="font-medium text-sm">הגדרות בדיקה</h5>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground flex-1">מינימום ימים לפני בדיקה</span>
                  <Input
                    type="number"
                    className="w-20 h-8"
                    min={1}
                    max={30}
                    value={settings?.availability?.min_days_before_check ?? 3}
                    onChange={(e) => handleNumberChange('availability', 'min_days_before_check', e.target.value)}
                  />
                  <span>ימים</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground flex-1">נכסים באצווה</span>
                  <Input
                    type="number"
                    className="w-20 h-8"
                    min={10}
                    max={200}
                    value={settings?.availability?.batch_size ?? 50}
                    onChange={(e) => handleNumberChange('availability', 'batch_size', e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                נכסים חדשים מ-{settings?.availability?.min_days_before_check ?? 3} ימים לא ייבדקו
              </p>
            </div>

            {/* Delay Settings */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h5 className="font-medium text-sm">השהיות</h5>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground flex-1">השהייה בין אצוות</span>
                  <Input
                    type="number"
                    className="w-24 h-8"
                    min={500}
                    max={10000}
                    step={100}
                    value={settings?.availability?.delay_between_batches_ms ?? 1500}
                    onChange={(e) => handleNumberChange('availability', 'delay_between_batches_ms', e.target.value)}
                  />
                  <span className="text-xs">ms</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground flex-1">השהייה בין בקשות</span>
                  <Input
                    type="number"
                    className="w-24 h-8"
                    min={50}
                    max={2000}
                    step={50}
                    value={settings?.availability?.delay_between_requests_ms ?? 150}
                    onChange={(e) => handleNumberChange('availability', 'delay_between_requests_ms', e.target.value)}
                  />
                  <span className="text-xs">ms</span>
                </div>
              </div>
            </div>

            {/* Timeout Settings */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h5 className="font-medium text-sm">זמני המתנה (Timeout)</h5>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground flex-1">בקשת HEAD</span>
                  <Input
                    type="number"
                    className="w-24 h-8"
                    min={3000}
                    max={30000}
                    step={1000}
                    value={settings?.availability?.head_timeout_ms ?? 10000}
                    onChange={(e) => handleNumberChange('availability', 'head_timeout_ms', e.target.value)}
                  />
                  <span className="text-xs">ms</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground flex-1">בקשת GET</span>
                  <Input
                    type="number"
                    className="w-24 h-8"
                    min={3000}
                    max={30000}
                    step={1000}
                    value={settings?.availability?.get_timeout_ms ?? 8000}
                    onChange={(e) => handleNumberChange('availability', 'get_timeout_ms', e.target.value)}
                  />
                  <span className="text-xs">ms</span>
                </div>
              </div>
            </div>

            {/* Schedule Info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 rounded p-2">
              <Clock className="h-3.5 w-3.5" />
              <span>הבדיקה רצה אוטומטית כל יום ב-05:00</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
