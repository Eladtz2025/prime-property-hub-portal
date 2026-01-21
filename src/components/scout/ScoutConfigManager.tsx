import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Play, Trash2, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface ScoutConfig {
  id: string;
  name: string;
  source: string;
  property_type: string;
  cities: string[];
  min_price: number | null;
  max_price: number | null;
  min_rooms: number | null;
  max_rooms: number | null;
  search_url: string | null;
  is_active: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
}

const CITIES = [
  'תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'רמת גן', 'גבעתיים',
  'הרצליה', 'רעננה', 'כפר סבא', 'פתח תקווה', 'ראשון לציון',
  'חולון', 'בת ים', 'אשדוד', 'אשקלון', 'נתניה', 'רחובות'
];

export const ScoutConfigManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ScoutConfig | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    source: 'yad2',
    property_type: 'rent',
    cities: [] as string[],
    min_price: '',
    max_price: '',
    min_rooms: '',
    max_rooms: '',
    search_url: '',
    is_active: true
  });

  const { data: configs, isLoading } = useQuery({
    queryKey: ['scout-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_configs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ScoutConfig[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('scout_configs')
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scout-configs'] });
      toast.success('הגדרת סריקה נוצרה בהצלחה');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('שגיאה ביצירת הגדרה');
      console.error(error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('scout_configs')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scout-configs'] });
      toast.success('הגדרה עודכנה בהצלחה');
      setIsDialogOpen(false);
      setEditingConfig(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scout_configs')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scout-configs'] });
      toast.success('הגדרה נמחקה');
    }
  });

  const runMutation = useMutation({
    mutationFn: async (configId: string) => {
      const { data, error } = await supabase.functions.invoke('scout-properties', {
        body: { config_id: configId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scout-configs'] });
      queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
      toast.success(`סריקה הושלמה: נמצאו ${data.properties_found} דירות, ${data.new_properties} חדשות`);
    },
    onError: (error) => {
      toast.error('שגיאה בהרצת סריקה');
      console.error(error);
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('scout_configs')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scout-configs'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      source: 'yad2',
      property_type: 'rent',
      cities: [],
      min_price: '',
      max_price: '',
      min_rooms: '',
      max_rooms: '',
      search_url: '',
      is_active: true
    });
  };

  const openEditDialog = (config: ScoutConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      source: config.source,
      property_type: config.property_type,
      cities: config.cities || [],
      min_price: config.min_price?.toString() || '',
      max_price: config.max_price?.toString() || '',
      min_rooms: config.min_rooms?.toString() || '',
      max_rooms: config.max_rooms?.toString() || '',
      search_url: config.search_url || '',
      is_active: config.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      source: formData.source,
      property_type: formData.property_type,
      cities: formData.cities,
      min_price: formData.min_price ? parseInt(formData.min_price) : null,
      max_price: formData.max_price ? parseInt(formData.max_price) : null,
      min_rooms: formData.min_rooms ? parseFloat(formData.min_rooms) : null,
      max_rooms: formData.max_rooms ? parseFloat(formData.max_rooms) : null,
      search_url: formData.search_url || null,
      is_active: formData.is_active
    };

    if (editingConfig) {
      updateMutation.mutate({ id: editingConfig.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">הגדרות סריקה ({configs?.length || 0})</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingConfig(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              הגדרה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'עריכת הגדרת סריקה' : 'הגדרת סריקה חדשה'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>שם החיפוש</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="למשל: דירות 3 חדרים בתל אביב"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>מקור</Label>
                  <Select 
                    value={formData.source}
                    onValueChange={(v) => setFormData({ ...formData, source: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="madlan">מדל"ן</SelectItem>
                      <SelectItem value="yad2_private">יד2 - פרטיים בלבד</SelectItem>
                      <SelectItem value="yad2">יד2 - הכל</SelectItem>
                      <SelectItem value="homeless">הומלס</SelectItem>
                      <SelectItem value="both">מדל"ן + יד2 פרטיים</SelectItem>
                      <SelectItem value="all">כל המקורות</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>סוג נכס</Label>
                  <Select
                    value={formData.property_type}
                    onValueChange={(v) => setFormData({ ...formData, property_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">השכרה</SelectItem>
                      <SelectItem value="sale">מכירה</SelectItem>
                      <SelectItem value="both">שניהם</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>ערים</Label>
                <Select
                  value={formData.cities[0] || ''}
                  onValueChange={(v) => setFormData({ ...formData, cities: [v] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עיר" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
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
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>מחיר מקסימום</Label>
                  <Input
                    type="number"
                    value={formData.max_price}
                    onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                    placeholder="ללא הגבלה"
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
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>חדרים מקסימום</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.max_rooms}
                    onChange={(e) => setFormData({ ...formData, max_rooms: e.target.value })}
                    placeholder="ללא הגבלה"
                  />
                </div>
              </div>

              <div>
                <Label>URL חיפוש מותאם (אופציונלי)</Label>
                <Input
                  value={formData.search_url}
                  onChange={(e) => setFormData({ ...formData, search_url: e.target.value })}
                  placeholder="https://www.yad2.co.il/realestate/rent?..."
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ניתן להדביק קישור ישיר מיד2 או מדלן עם הפילטרים שלך
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>פעיל (ירוץ אוטומטית)</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                ביטול
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
              >
                {editingConfig ? 'עדכן' : 'צור'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {configs?.map((config) => (
          <Card key={config.id}>
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* Row 1: Badges only */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={config.is_active ? 'default' : 'secondary'} className="text-xs">
                    {config.is_active ? 'פעיל' : 'מושבת'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {config.source === 'madlan' ? 'מדל"ן' :
                     config.source === 'yad2_private' ? 'יד2 פרטיים' :
                     config.source === 'yad2' ? 'יד2' :
                     config.source === 'homeless' ? 'הומלס' :
                     config.source === 'both' ? 'מדל"ן + יד2' :
                     config.source === 'all' ? 'כל המקורות' : config.source}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {config.property_type === 'rent' ? 'השכרה' : config.property_type === 'sale' ? 'מכירה' : 'השכרה + מכירה'}
                  </Badge>
                  {config.cities?.map(city => (
                    <Badge key={city} variant="outline" className="text-xs">{city}</Badge>
                  ))}
                  {config.min_price && (
                    <Badge variant="outline" className="text-xs">
                      ₪{config.min_price.toLocaleString()} - ₪{config.max_price?.toLocaleString() || '∞'}
                    </Badge>
                  )}
                  {config.min_rooms && (
                    <Badge variant="outline" className="text-xs">
                      {config.min_rooms}-{config.max_rooms || '∞'} חדרים
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={(checked) => 
                      toggleActiveMutation.mutate({ id: config.id, is_active: checked })
                    }
                  />
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => runMutation.mutate(config.id)}
                    disabled={runMutation.isPending}
                    title="הרץ עכשיו"
                  >
                    {runMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(config)}
                    title="ערוך"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteMutation.mutate(config.id)}
                    title="מחק"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Row 2: Metadata */}
              {config.last_run_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  ריצה אחרונה: {formatDistanceToNow(new Date(config.last_run_at), { 
                    addSuffix: true, 
                    locale: he 
                  })}
                  {config.last_run_status && ` (${config.last_run_status})`}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {(!configs || configs.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              אין הגדרות סריקה. לחץ על "הגדרה חדשה" כדי להתחיל.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
