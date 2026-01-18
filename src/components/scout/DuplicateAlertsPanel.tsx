import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Check, 
  ExternalLink, 
  TrendingDown, 
  TrendingUp,
  RefreshCw,
  Copy,
  Info
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface DuplicateAlert {
  id: string;
  primary_property_id: string;
  duplicate_property_id: string;
  price_difference: number;
  price_difference_percent: number;
  detected_at: string;
  is_resolved: boolean;
  resolved_at: string | null;
  notes: string | null;
  primary_property?: {
    title: string;
    address: string;
    city: string;
    price: number;
    source: string;
    source_url: string;
    rooms: number;
  };
  duplicate_property?: {
    title: string;
    address: string;
    city: string;
    price: number;
    source: string;
    source_url: string;
    rooms: number;
  };
}

export const DuplicateAlertsPanel: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['duplicate-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('duplicate_alerts')
        .select(`
          *,
          primary_property:scouted_properties!duplicate_alerts_primary_property_id_fkey(title, address, city, price, source, source_url, rooms),
          duplicate_property:scouted_properties!duplicate_alerts_duplicate_property_id_fkey(title, address, city, price, source, source_url, rooms)
        `)
        .eq('is_resolved', false)
        .order('price_difference_percent', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as unknown as DuplicateAlert[];
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['duplicate-stats'],
    queryFn: async () => {
      const { count: totalAlerts } = await supabase
        .from('duplicate_alerts')
        .select('id', { count: 'exact', head: true });

      const { count: unresolvedAlerts } = await supabase
        .from('duplicate_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('is_resolved', false);

      const { data: duplicateGroups } = await supabase
        .from('scouted_properties')
        .select('duplicate_group_id')
        .not('duplicate_group_id', 'is', null);

      const uniqueGroups = new Set(duplicateGroups?.map(d => d.duplicate_group_id)).size;

      // Get count of properties that can/cannot be checked for duplicates
      const { count: checkableCount } = await supabase
        .from('scouted_properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('duplicate_check_possible', true);

      const { count: uncheckableCount } = await supabase
        .from('scouted_properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('duplicate_check_possible', false);

      return {
        total: totalAlerts || 0,
        unresolved: unresolvedAlerts || 0,
        groups: uniqueGroups,
        checkable: checkableCount || 0,
        uncheckable: uncheckableCount || 0
      };
    }
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('duplicate_alerts')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicate-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['duplicate-stats'] });
      toast.success('ההתראה סומנה כטופלה');
    },
    onError: () => {
      toast.error('שגיאה בעדכון ההתראה');
    }
  });

  const runDuplicateDetection = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('detect_existing_duplicates');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['duplicate-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['duplicate-stats'] });
      if (data && data[0]) {
        toast.success(`נמצאו ${data[0].duplicates_found} כפילויות, ${data[0].groups_created} קבוצות חדשות`);
      } else {
        toast.success('סריקת כפילויות הושלמה');
      }
    },
    onError: (error) => {
      console.error('Duplicate detection error:', error);
      toast.error('שגיאה בסריקת כפילויות');
    }
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'yad2': return 'bg-orange-500';
      case 'madlan': return 'bg-blue-500';
      case 'homeless': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">קבוצות כפילויות</p>
                <p className="text-2xl font-bold">{stats?.groups || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">התראות פתוחות</p>
                <p className="text-2xl font-bold">{stats?.unresolved || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">התראות שטופלו</p>
                <p className="text-2xl font-bold">{(stats?.total || 0) - (stats?.unresolved || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 flex items-center justify-center">
            <Button 
              onClick={() => runDuplicateDetection.mutate()}
              disabled={runDuplicateDetection.isPending}
              variant="outline"
              className="w-full"
            >
              {runDuplicateDetection.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <RefreshCw className="h-4 w-4 ml-2" />
              )}
              סרוק כפילויות
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info about uncheckable properties */}
      {stats?.uncheckable && stats.uncheckable > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">{stats.uncheckable} נכסים</span> לא ניתנים לבדיקת כפילויות (חסר מספר בניין בכתובת).
            מתוך <span className="font-medium">{stats.checkable + stats.uncheckable}</span> נכסים פעילים, 
            רק <span className="font-medium">{stats.checkable}</span> ({((stats.checkable / (stats.checkable + stats.uncheckable)) * 100).toFixed(0)}%) ניתנים לבדיקה.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            התראות הפרשי מחיר
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!alerts || alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Copy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>לא נמצאו התראות על הפרשי מחיר</p>
              <p className="text-sm mt-2">לחץ על "סרוק כפילויות" לזיהוי כפילויות קיימות</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Address and Location */}
                      <div>
                        <h4 className="font-medium">
                          {alert.primary_property?.address || 'כתובת לא ידועה'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {alert.primary_property?.city} • {alert.primary_property?.rooms} חדרים
                        </p>
                      </div>

                      {/* Price Comparison */}
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Badge className={getSourceColor(alert.primary_property?.source || '')}>
                            {alert.primary_property?.source}
                          </Badge>
                          <span className="font-medium">
                            {formatPrice(alert.primary_property?.price || 0)}
                          </span>
                          <a 
                            href={alert.primary_property?.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>

                        <div className="flex items-center gap-1 text-muted-foreground">
                          {(alert.primary_property?.price || 0) > (alert.duplicate_property?.price || 0) ? (
                            <TrendingDown className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            הפרש: {formatPrice(alert.price_difference)} ({alert.price_difference_percent.toFixed(1)}%)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={getSourceColor(alert.duplicate_property?.source || '')}>
                            {alert.duplicate_property?.source}
                          </Badge>
                          <span className="font-medium">
                            {formatPrice(alert.duplicate_property?.price || 0)}
                          </span>
                          <a 
                            href={alert.duplicate_property?.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>

                      {/* Detection time */}
                      <p className="text-xs text-muted-foreground">
                        זוהה ב-{format(new Date(alert.detected_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </p>
                    </div>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resolveAlert.mutate(alert.id)}
                      disabled={resolveAlert.isPending}
                    >
                      <Check className="h-4 w-4 ml-1" />
                      טופל
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
