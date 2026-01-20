import React, { useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
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
    });
    setEditingConfig(null);
  };

  const openEditDialog = (config: ScoutConfig) => {
    setEditingConfig(config);
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
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
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

              {/* Config list */}
              <div className="space-y-3">
                {configs?.map((config) => (
                  <Card key={config.id} className={`${!config.is_active ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{config.name}</span>
                            <Badge variant={config.is_active ? 'default' : 'secondary'}>
                              {config.is_active ? 'פעיל' : 'מושבת'}
                            </Badge>
                            <Badge variant="outline">
                              {SOURCES.find((s) => s.value === config.source)?.label}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
                            {config.cities?.length && (
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
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={config.is_active}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({ id: config.id, is_active: checked })
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runConfigMutation.mutate(config.id)}
                            disabled={runConfigMutation.isPending}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(config)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
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
                {(!configs || configs.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    אין הגדרות סריקה. לחץ על "הוסף הגדרה חדשה" להתחיל.
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Technical Parameters */}
        <AccordionItem value="parameters" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <span className="font-semibold">פרמטרים טכניים</span>
              {changesCount > 0 && (
                <Badge variant="outline" className="mr-2">
                  {changesCount} שינויים מברירת מחדל
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6">
              {/* Scraping Settings */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  🔍 הגדרות סריקה
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>דפים לסריקה - יד2</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={settings?.scraping?.yad2_pages ?? 7}
                      onChange={(e) => handleNumberChange('scraping', 'yad2_pages', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">ברירת מחדל: 7 | מומלץ: 5-10</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      דפים לסריקה - מדלן
                      {(settings?.scraping?.madlan_pages ?? 4) > 10 && (
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                      )}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={15}
                      value={settings?.scraping?.madlan_pages ?? 4}
                      onChange={(e) => handleNumberChange('scraping', 'madlan_pages', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">ברירת מחדל: 4 | זהירות: עלול להיחסם מעל 10</p>
                  </div>
                  <div className="space-y-2">
                    <Label>דפים לסריקה - הומלס</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={settings?.scraping?.homeless_pages ?? 0}
                      onChange={(e) => handleNumberChange('scraping', 'homeless_pages', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">ברירת מחדל: 0 (מושבת)</p>
                  </div>
                  <div className="space-y-2">
                    <Label>השהיה בין בקשות (ms)</Label>
                    <Input
                      type="number"
                      min={500}
                      max={10000}
                      step={100}
                      value={settings?.scraping?.delay_between_requests_ms ?? 1500}
                      onChange={(e) => handleNumberChange('scraping', 'delay_between_requests_ms', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">ברירת מחדל: 1500ms</p>
                  </div>
                  <div className="space-y-2">
                    <Label>השהיה מדלן (ms)</Label>
                    <Input
                      type="number"
                      min={1000}
                      max={15000}
                      step={500}
                      value={settings?.scraping?.madlan_delay_ms ?? 5000}
                      onChange={(e) => handleNumberChange('scraping', 'madlan_delay_ms', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">ברירת מחדל: 5000ms</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Timeout סריקה תקועה (דקות)</Label>
                    <Input
                      type="number"
                      min={10}
                      max={120}
                      value={settings?.scraping?.stuck_timeout_minutes ?? 30}
                      onChange={(e) => handleNumberChange('scraping', 'stuck_timeout_minutes', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">ברירת מחדל: 30 דקות</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Duplicate Settings */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  🔄 הגדרות זיהוי כפילויות
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>סף הפרש מחיר (%)</Label>
                    <Input
                      type="number"
                      min={5}
                      max={50}
                      value={Math.round((settings?.duplicates?.price_diff_threshold ?? 0.2) * 100)}
                      onChange={(e) => handleNumberChange('duplicates', 'price_diff_threshold', (parseFloat(e.target.value) / 100).toString())}
                    />
                    <p className="text-xs text-muted-foreground">ברירת מחדל: 20%</p>
                  </div>
                  <div className="space-y-2">
                    <Label>סף הפרש גודל (%)</Label>
                    <Input
                      type="number"
                      min={5}
                      max={30}
                      value={Math.round((settings?.duplicates?.size_diff_threshold ?? 0.1) * 100)}
                      onChange={(e) => handleNumberChange('duplicates', 'size_diff_threshold', (parseFloat(e.target.value) / 100).toString())}
                    />
                    <p className="text-xs text-muted-foreground">ברירת מחדל: 10%</p>
                  </div>
                  <div className="space-y-2">
                    <Label>הפרש מינימלי להתראה (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={settings?.duplicates?.min_price_diff_for_alert ?? 5}
                      onChange={(e) => handleNumberChange('duplicates', 'min_price_diff_for_alert', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">ברירת מחדל: 5%</p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <Label className="cursor-pointer">דרוש קומה זהה</Label>
                    <Switch
                      checked={settings?.duplicates?.require_same_floor ?? false}
                      onCheckedChange={(checked) => handleBooleanChange('duplicates', 'require_same_floor', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <Label className="cursor-pointer">יצירת התראות אוטומטית</Label>
                    <Switch
                      checked={settings?.duplicates?.auto_create_alerts ?? true}
                      onCheckedChange={(checked) => handleBooleanChange('duplicates', 'auto_create_alerts', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Matching Settings */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  🎯 הגדרות התאמה ללקוחות
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>ציון התאמה מינימלי</Label>
                    <Input
                      type="number"
                      min={30}
                      max={90}
                      value={settings?.matching?.min_score ?? 60}
                      onChange={(e) => handleNumberChange('matching', 'min_score', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">ברירת מחדל: 60</p>
                  </div>
                  <div className="space-y-2">
                    <Label>מקסימום התאמות לנכס</Label>
                    <Input
                      type="number"
                      min={5}
                      max={50}
                      value={settings?.matching?.max_matches_per_property ?? 20}
                      onChange={(e) => handleNumberChange('matching', 'max_matches_per_property', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">ברירת מחדל: 20</p>
                  </div>
                  <div className="space-y-2">
                    <Label>גמישות מחיר (%)</Label>
                    <Input
                      type="number"
                      min={5}
                      max={30}
                      value={Math.round((settings?.matching?.flexible_price_threshold ?? 0.15) * 100)}
                      onChange={(e) => handleNumberChange('matching', 'flexible_price_threshold', (parseFloat(e.target.value) / 100).toString())}
                    />
                    <p className="text-xs text-muted-foreground">ברירת מחדל: 15%</p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="cursor-pointer">שליחת וואטסאפ אוטומטית</Label>
                      <p className="text-xs text-muted-foreground">שליחת הודעה אוטומטית ללקוחות מתאימים</p>
                    </div>
                    <Switch
                      checked={settings?.matching?.auto_send_whatsapp ?? false}
                      onCheckedChange={(checked) => handleBooleanChange('matching', 'auto_send_whatsapp', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Schedule Info */}
        <AccordionItem value="schedule" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-semibold">לוח זמנים</span>
              <Badge variant="outline" className="mr-2">
                אוטומטי
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      סריקות נכסים
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">08:00</Badge>
                      <span className="text-muted-foreground">בוקר</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">16:00</Badge>
                      <span className="text-muted-foreground">צהריים</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">22:00</Badge>
                      <span className="text-muted-foreground">ערב</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      התאמה ללקוחות
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">08:15</Badge>
                      <span className="text-muted-foreground">+15 דקות</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">16:15</Badge>
                      <span className="text-muted-foreground">+15 דקות</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">22:15</Badge>
                      <span className="text-muted-foreground">+15 דקות</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      בדיקת זמינות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">05:00</Badge>
                      <span className="text-muted-foreground">יומי</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      בדיקת לינקים מתים וסימון נכסים לא פעילים
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span>לשינוי לוח הזמנים נדרשת עריכת מסד הנתונים (cron jobs)</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
