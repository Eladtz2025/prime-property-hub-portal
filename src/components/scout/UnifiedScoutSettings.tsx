import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NeighborhoodSelectorDropdown } from '@/components/ui/neighborhood-selector';
import { NEIGHBORHOODS } from '@/config/locations';
import { filterNeighborhoodsBySource, getSupportedSources } from '@/config/neighborhoodSupport';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Settings,
  ListFilter,
  Calendar,
  Plus,
  Play,
  Square,
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
  UserCheck,
  Zap,
  Info,
} from 'lucide-react';
import { useScoutSettings, useUpdateScoutSetting, defaultSettings } from '@/hooks/useScoutSettings';
import { LiveScanProgress } from './LiveScanProgress';

import { BrokerClassificationDialog } from './BrokerClassificationDialog';

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
    delaySeconds: 5,
    waitForMs: 15000,
    schedule: ['08:00', '16:00', '22:00'],
  },
};

// Helper to get source-specific border color for config cards
const getSourceBorderColor = (source: string): string => {
  switch (source) {
    case 'madlan': return 'border-l-4 border-l-blue-500';
    case 'yad2': return 'border-l-4 border-l-orange-500';
    case 'homeless': return 'border-l-4 border-l-purple-500';
    default: return '';
  }
};

// ConfigCard component for 3-column layout
interface ConfigCardProps {
  config: ScoutConfig;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRun: () => void;
  onStop: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isRunning: boolean;
  isRunPending: boolean;
  isStopPending: boolean;
  settings: any;
}

const ConfigCard: React.FC<ConfigCardProps> = ({
  config,
  isSelected,
  onToggleSelect,
  onRun,
  onStop,
  onEdit,
  onDelete,
  isRunning,
  isRunPending,
  isStopPending,
  settings,
}) => {
  return (
    <Card className={`${!config.is_active ? 'opacity-60' : ''}`} dir="rtl">
      <CardContent className="p-2.5">
        {/* Row 1: Checkbox + Name + Status */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="shrink-0"
          />
          <span className="font-medium text-sm truncate flex-1" title={config.name}>
            {config.name.replace(/^(Yad2|Homeless|Madlan)\s*/i, '')}
          </span>
          <Badge 
            variant={config.is_active ? "default" : "secondary"} 
            className="text-[10px] px-1.5 py-0 shrink-0"
          >
            {config.property_type === 'rent' ? 'השכרה' : 'מכירה'}
          </Badge>
        </div>
        
        {/* Row 2: Technical details + Actions */}
        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>{(config as any).max_pages ?? 5} דפים</span>
            <span>|</span>
            <span>{(config as any).page_delay_seconds ?? 3}s</span>
            <span>|</span>
            <span>{(config as any).schedule_times?.[0] || '-'}</span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onRun}
              disabled={isRunPending || isRunning}
            >
              <Play className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive"
              onClick={onStop}
              disabled={isStopPending || !isRunning}
            >
              <Square className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onEdit}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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


export const UnifiedScoutSettings: React.FC<{ triggerFunction?: string }> = ({ triggerFunction = 'trigger-scout-pages' }) => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading: settingsLoading } = useScoutSettings();
  const updateSetting = useUpdateScoutSetting();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ScoutConfig | null>(null);
  const [selectedConfigs, setSelectedConfigs] = useState<Set<string>>(new Set());
  const [isDuplicatesDialogOpen, setIsDuplicatesDialogOpen] = useState(false);
  const [isMatchingDialogOpen, setIsMatchingDialogOpen] = useState(false);
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [isEligibilityDialogOpen, setIsEligibilityDialogOpen] = useState(false);
  const [isBrokerBackfillDialogOpen, setIsBrokerBackfillDialogOpen] = useState(false);
  const [isRefreshingEligibility, setIsRefreshingEligibility] = useState(false);
  const [runningSource, setRunningSource] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    source: 'yad2',
    cities: [] as string[],
    neighborhoods: [] as string[],
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
    owner_type_filter: '',
  });


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

  // Query for active runs
  const { data: activeRuns } = useQuery({
    queryKey: ['active-scout-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_runs')
        .select('*')
        .eq('status', 'running');
      if (error) throw error;
      return data;
    },
    refetchInterval: 3000,
  });

  const getActiveRunForConfig = (configId: string) => {
    return activeRuns?.find(run => run.config_id === configId);
  };

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

  // Run all configs of a source sequentially with 5 min delay
  const runAllSourceConfigs = async (source: string) => {
    const sourceConfigs = configs?.filter(c => c.source === source && c.is_active) || [];
    
    if (sourceConfigs.length === 0) {
      toast.warning('אין קונפיגורציות פעילות למקור זה');
      return;
    }

    setRunningSource(source);
    toast.info(`מתחיל להריץ ${sourceConfigs.length} קונפיגורציות של ${source}...`);

    for (let i = 0; i < sourceConfigs.length; i++) {
      const config = sourceConfigs[i];
      
      try {
        await runConfigMutation.mutateAsync(config.id);
        toast.success(`הופעלה: ${config.name} (${i + 1}/${sourceConfigs.length})`);
        
        // Wait 5 minutes before next (except for the last one)
        if (i < sourceConfigs.length - 1) {
          toast.info(`ממתין 5 דקות לפני הבא...`);
          await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // 5 minutes
        }
      } catch (error) {
        console.error(`Failed to run ${config.name}:`, error);
        toast.error(`שגיאה בהפעלת ${config.name}`);
      }
    }

    setRunningSource(null);
    toast.success(`הושלמו כל ${sourceConfigs.length} הריצות של ${source}!`);
  };

  // Config mutations
  const createConfigMutation = useMutation({
    mutationFn: async (config: { name: string; source: string; cities: string[] | null; neighborhoods: string[] | null; property_type: string; min_price: number | null; max_price: number | null; min_rooms: number | null; max_rooms: number | null; search_url: string | null }) => {
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
    mutationFn: async ({ id, ...config }: { id: string; name: string; source: string; cities: string[] | null; neighborhoods: string[] | null; property_type: string; min_price: number | null; max_price: number | null; min_rooms: number | null; max_rooms: number | null; search_url: string | null }) => {
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
      // Get the config to determine which function to call
      const config = configs?.find(c => c.id === configId);
      const source = config?.source || 'yad2';
      
      // Use trigger-scout-pages for all sources - proven stable approach
      // Each page runs independently, preventing timeouts
      const functionName = triggerFunction;
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { config_id: configId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const message = data?.pages_triggered 
        ? `סריקה הופעלה - ${data.pages_triggered} דפים` 
        : 'סריקה הופעלה';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['scout-configs'] });
      queryClient.invalidateQueries({ queryKey: ['active-scout-runs'] });
      queryClient.invalidateQueries({ queryKey: ['live-scan-progress'] });
    },
    onError: (error: any) => {
      const message = error?.message || 'שגיאה בהפעלת הסריקה';
      toast.error(message);
    },
  });

  const stopMutation = useMutation({
    mutationFn: async (configId: string) => {
      const activeRun = getActiveRunForConfig(configId);
      if (!activeRun) throw new Error('No active run found');
      
      const { error } = await supabase.functions.invoke('stop-scout-run', {
        body: { run_id: activeRun.id },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-scout-runs'] });
      queryClient.invalidateQueries({ queryKey: ['scout-configs'] });
      toast.success('הסריקה נעצרה');
    },
    onError: () => toast.error('שגיאה בעצירת הסריקה'),
  });

  // Check if matching is currently running
  const isMatchingRunning = activeRuns?.some(run => run.source === 'matching') || false;

  // Run matching mutation
  const runMatchingMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('trigger-matching', {
        body: { force: true }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`הופעל חישוב התאמות ל-${data.total_properties || 0} נכסים`);
      queryClient.invalidateQueries({ queryKey: ['active-scout-runs'] });
    },
    onError: (error) => {
      console.error('Match error:', error);
      toast.error('שגיאה בהפעלת חישוב התאמות');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      source: 'yad2',
      cities: [],
      neighborhoods: [],
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
      owner_type_filter: '',
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
      neighborhoods: config.neighborhoods || [],
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
      schedule_time_2: configSchedule?.[1] || '',
      owner_type_filter: (config as any).owner_type_filter || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    // Combine 2 schedule time fields into array
    const scheduleArray = [
      formData.schedule_time_1,
      formData.schedule_time_2,
    ].filter(Boolean);
    
    const configData = {
      name: formData.name,
      source: formData.source,
      cities: formData.cities.length > 0 ? formData.cities : null,
      neighborhoods: formData.neighborhoods.length > 0 ? formData.neighborhoods : null,
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
      owner_type_filter: formData.owner_type_filter || null,
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

  return (
    <div className="space-y-4">
      
      {/* Live Scan Progress - shown only when scans are active */}
      <LiveScanProgress />
      
      <Accordion type="multiple" defaultValue={["configs", "database"]} className="space-y-4">
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => { resetForm(); }}
                  >
                    <Plus className="h-4 w-4" />
                    הוסף קונפיגורציה
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingConfig ? 'עריכת הגדרה' : 'הוספת הגדרה חדשה'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto px-1">
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
                        onValueChange={(value) => setFormData({ ...formData, cities: [value], neighborhoods: [] })}
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
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Label>שכונות (אופציונלי)</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs">מוצגות רק שכונות שנתמכות ע"י {SOURCES.find(s => s.value === formData.source)?.label || formData.source}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <NeighborhoodSelectorDropdown
                        selectedCities={formData.cities}
                        selectedNeighborhoods={formData.neighborhoods}
                        onChange={(neighborhoods) => setFormData({ ...formData, neighborhoods })}
                        filterBySource={formData.source}
                      />
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
                    
                    {/* Owner Type Filter - for Yad2 and Madlan */}
                    {(formData.source === 'yad2' || formData.source === 'madlan') && (
                      <div>
                        <Label>סוג מפרסם</Label>
                        <Select
                          value={formData.owner_type_filter}
                          onValueChange={(value) => setFormData({ ...formData, owner_type_filter: value === 'all' ? '' : value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="ללא סינון" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">ללא סינון</SelectItem>
                            <SelectItem value="private">פרטי בלבד</SelectItem>
                            <SelectItem value="broker">תיווך בלבד</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

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
                      
                      {/* Schedule Times - 2 separate fields */}
                      <div className="mt-3">
                        <Label className="text-xs">שעות ריצה</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
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

              {/* Config list - 3 columns by source */}
              {configs && configs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Madlan Column */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border-r-4 border-r-blue-500">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-700 dark:text-blue-400">מדלן</span>
                        <Badge variant="outline" className="bg-blue-500/20">
                          {configs.filter(c => c.source === 'madlan').length}
                        </Badge>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-500/20"
                              onClick={() => runAllSourceConfigs('madlan')}
                              disabled={runningSource !== null}
                            >
                              {runningSource === 'madlan' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>הרץ את כל המדלן (5 דק׳ הפרש)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {configs
                        .filter(c => c.source === 'madlan')
                        .sort((a, b) => {
                          const timeA = (a as any).schedule_times?.[0] || '99:99';
                          const timeB = (b as any).schedule_times?.[0] || '99:99';
                          return timeA.localeCompare(timeB);
                        })
                        .map(config => (
                        <ConfigCard 
                          key={config.id} 
                          config={config}
                          isSelected={selectedConfigs.has(config.id)}
                          onToggleSelect={() => toggleConfigSelection(config.id)}
                          onRun={() => runConfigMutation.mutate(config.id)}
                          onStop={() => stopMutation.mutate(config.id)}
                          onEdit={() => openEditDialog(config)}
                          onDelete={() => deleteConfigMutation.mutate(config.id)}
                          isRunning={!!getActiveRunForConfig(config.id)}
                          isRunPending={runConfigMutation.isPending}
                          isStopPending={stopMutation.isPending}
                          settings={settings}
                        />
                      ))}
                      {configs.filter(c => c.source === 'madlan').length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          אין קונפיגורציות
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Yad2 Column */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border-r-4 border-r-orange-500">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-orange-700 dark:text-orange-400">יד2</span>
                        <Badge variant="outline" className="bg-orange-500/20">
                          {configs.filter(c => c.source === 'yad2').length}
                        </Badge>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-orange-600 hover:bg-orange-500/20"
                              onClick={() => runAllSourceConfigs('yad2')}
                              disabled={runningSource !== null}
                            >
                              {runningSource === 'yad2' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>הרץ את כל היד2 (5 דק׳ הפרש)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {configs
                        .filter(c => c.source === 'yad2')
                        .sort((a, b) => {
                          const timeA = (a as any).schedule_times?.[0] || '99:99';
                          const timeB = (b as any).schedule_times?.[0] || '99:99';
                          return timeA.localeCompare(timeB);
                        })
                        .map(config => (
                        <ConfigCard 
                          key={config.id} 
                          config={config}
                          isSelected={selectedConfigs.has(config.id)}
                          onToggleSelect={() => toggleConfigSelection(config.id)}
                          onRun={() => runConfigMutation.mutate(config.id)}
                          onStop={() => stopMutation.mutate(config.id)}
                          onEdit={() => openEditDialog(config)}
                          onDelete={() => deleteConfigMutation.mutate(config.id)}
                          isRunning={!!getActiveRunForConfig(config.id)}
                          isRunPending={runConfigMutation.isPending}
                          isStopPending={stopMutation.isPending}
                          settings={settings}
                        />
                      ))}
                      {configs.filter(c => c.source === 'yad2').length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          אין קונפיגורציות
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Homeless Column */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border-r-4 border-r-purple-500">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-purple-700 dark:text-purple-400">הומלס</span>
                        <Badge variant="outline" className="bg-purple-500/20">
                          {configs.filter(c => c.source === 'homeless').length}
                        </Badge>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-purple-600 hover:bg-purple-500/20"
                              onClick={() => runAllSourceConfigs('homeless')}
                              disabled={runningSource !== null}
                            >
                              {runningSource === 'homeless' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>הרץ את כל ההומלס (5 דק׳ הפרש)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {configs
                        .filter(c => c.source === 'homeless')
                        .sort((a, b) => {
                          const timeA = (a as any).schedule_times?.[0] || '99:99';
                          const timeB = (b as any).schedule_times?.[0] || '99:99';
                          return timeA.localeCompare(timeB);
                        })
                        .map(config => (
                        <ConfigCard 
                          key={config.id} 
                          config={config}
                          isSelected={selectedConfigs.has(config.id)}
                          onToggleSelect={() => toggleConfigSelection(config.id)}
                          onRun={() => runConfigMutation.mutate(config.id)}
                          onStop={() => stopMutation.mutate(config.id)}
                          onEdit={() => openEditDialog(config)}
                          onDelete={() => deleteConfigMutation.mutate(config.id)}
                          isRunning={!!getActiveRunForConfig(config.id)}
                          isRunPending={runConfigMutation.isPending}
                          isStopPending={stopMutation.isPending}
                          settings={settings}
                        />
                      ))}
                      {configs.filter(c => c.source === 'homeless').length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          אין קונפיגורציות
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  אין הגדרות סריקה
                </div>
              )}

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
              
              {/* Stage 2: Property Matching - with editable schedule */}
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <h5 className="font-medium text-sm flex items-center gap-2 text-green-800 dark:text-green-200">
                  <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                  התאמת נכס
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">אוטומטי</span>
                </h5>
                <div className="mt-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <Input
                    type="text"
                    className="w-36 h-7 text-sm"
                    placeholder="09:15, 18:15"
                    defaultValue={(settings?.matching?.schedule_times || ['09:15', '18:15']).join(', ')}
                    onBlur={(e) => {
                      const times = e.target.value.split(',').map(t => t.trim()).filter(t => /^\d{2}:\d{2}$/.test(t));
                      if (times.length > 0) {
                        updateSetting.mutate({ category: 'matching', setting_key: 'schedule_times', setting_value: JSON.stringify(times) });
                      }
                    }}
                  />
                  <span className="text-xs text-muted-foreground">(שעון ישראל)</span>
                </div>
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

      {/* Lead Eligibility Settings Dialog */}
      <Dialog open={isEligibilityDialogOpen} onOpenChange={setIsEligibilityDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              הגדרות כשירות לקוח
            </DialogTitle>
            <DialogDescription>
              לקוח נחשב כשיר להתאמה רק אם יש לו את כל השדות המסומנים כחובה
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <Label className="text-sm font-medium">ערים מועדפות</Label>
                  <p className="text-xs text-muted-foreground">לקוח חייב לבחור לפחות עיר אחת</p>
                </div>
                <Switch
                  checked={settings?.eligibility?.require_cities ?? true}
                  onCheckedChange={(checked) => handleBooleanChange('eligibility', 'require_cities', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <Label className="text-sm font-medium">שכונות מועדפות</Label>
                  <p className="text-xs text-muted-foreground">לקוח חייב לבחור לפחות שכונה אחת</p>
                </div>
                <Switch
                  checked={settings?.eligibility?.require_neighborhoods ?? true}
                  onCheckedChange={(checked) => handleBooleanChange('eligibility', 'require_neighborhoods', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <Label className="text-sm font-medium">תקציב מקסימלי</Label>
                  <p className="text-xs text-muted-foreground">לקוח חייב להזין תקציב</p>
                </div>
                <Switch
                  checked={settings?.eligibility?.require_budget ?? true}
                  onCheckedChange={(checked) => handleBooleanChange('eligibility', 'require_budget', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm font-medium">טווח חדרים</Label>
                  <p className="text-xs text-muted-foreground">לקוח חייב להזין מינימום או מקסימום חדרים</p>
                </div>
                <Switch
                  checked={settings?.eligibility?.require_rooms ?? true}
                  onCheckedChange={(checked) => handleBooleanChange('eligibility', 'require_rooms', checked)}
                />
              </div>
            </div>

            <Separator />

            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-2">
                💡 שינויים משפיעים על לקוחות חדשים מיד. לעדכון לקוחות קיימים:
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    setIsRefreshingEligibility(true);
                    toast.info('מעדכן כשירות לקוחות...');
                    const { data, error } = await supabase.functions.invoke('refresh-lead-eligibility');
                    if (error) throw error;
                    toast.success(`עודכנו ${data?.updated || 0} לקוחות`);
                    queryClient.invalidateQueries({ queryKey: ['contact-leads'] });
                  } catch (err) {
                    console.error('Refresh error:', err);
                    toast.error('שגיאה בעדכון');
                  } finally {
                    setIsRefreshingEligibility(false);
                  }
                }}
                disabled={isRefreshingEligibility}
                className="w-full"
              >
                {isRefreshingEligibility ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    מעדכן...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 ml-2" />
                    עדכן כל הלקוחות הקיימים
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 rounded p-2">
              <Database className="h-3.5 w-3.5" />
              <span>הכשירות מתעדכנת אוטומטית בכל שינוי בפרטי הלקוח (DB Trigger)</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Broker Classification Dialog - new component */}
      <BrokerClassificationDialog 
        open={isBrokerBackfillDialogOpen} 
        onOpenChange={setIsBrokerBackfillDialogOpen} 
      />
    </div>
  );
};
