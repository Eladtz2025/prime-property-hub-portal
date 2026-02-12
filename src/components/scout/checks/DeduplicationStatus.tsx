import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Copy, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const DeduplicationStatus: React.FC = () => {
  const { data: alerts } = useQuery({
    queryKey: ['dedup-alerts-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('duplicate_alerts')
        .select('id, detected_at, is_resolved, price_difference, price_difference_percent, primary_property_id, duplicate_property_id, notes')
        .order('detected_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const { data: stats } = useQuery({
    queryKey: ['dedup-stats'],
    queryFn: async () => {
      const [totalRes, unresolvedRes, todayRes] = await Promise.all([
        supabase.from('duplicate_alerts').select('id', { count: 'exact', head: true }),
        supabase.from('duplicate_alerts').select('id', { count: 'exact', head: true }).eq('is_resolved', false),
        supabase.from('duplicate_alerts').select('id', { count: 'exact', head: true }).gte('detected_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
      ]);
      return {
        total: totalRes.count ?? 0,
        unresolved: unresolvedRes.count ?? 0,
        today: todayRes.count ?? 0,
      };
    },
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">סה״כ כפילויות</p>
          <p className="text-xl font-bold">{stats?.total ?? '—'}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">לא טופלו</p>
          <p className="text-xl font-bold text-orange-600">{stats?.unresolved ?? '—'}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">זוהו היום</p>
          <p className="text-xl font-bold text-blue-600">{stats?.today ?? '—'}</p>
        </CardContent></Card>
      </div>

      {/* Recent alerts */}
      {alerts && alerts.length > 0 ? (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="h-9">
                <TableHead className="py-2 text-xs">תאריך</TableHead>
                <TableHead className="py-2 text-xs">סטטוס</TableHead>
                <TableHead className="py-2 text-xs">הפרש מחיר</TableHead>
                <TableHead className="py-2 text-xs">הערות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map(alert => (
                <TableRow key={alert.id} className="h-9">
                  <TableCell className="py-1.5 text-xs">
                    {alert.detected_at ? format(new Date(alert.detected_at), 'dd/MM HH:mm', { locale: he }) : '—'}
                  </TableCell>
                  <TableCell className="py-1.5">
                    {alert.is_resolved 
                      ? <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />טופל</Badge>
                      : <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-[10px]"><AlertTriangle className="h-3 w-3 mr-1" />פתוח</Badge>
                    }
                  </TableCell>
                  <TableCell className="py-1.5 text-xs">
                    {alert.price_difference ? `₪${Math.abs(alert.price_difference).toLocaleString('he-IL')}` : '—'}
                    {alert.price_difference_percent ? <span className="text-muted-foreground"> ({Number(alert.price_difference_percent).toFixed(0)}%)</span> : ''}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-muted-foreground truncate max-w-[150px]">{alert.notes || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground text-sm">אין כפילויות שזוהו</div>
      )}
    </div>
  );
};
