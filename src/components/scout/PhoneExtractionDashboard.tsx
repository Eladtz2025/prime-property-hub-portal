import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Phone, Play, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const PhoneExtractionDashboard: React.FC = () => {
  const qc = useQueryClient();

  // Queue stats
  const { data: stats } = useQuery({
    queryKey: ['phone-extraction-stats'],
    queryFn: async () => {
      const baseQ = () => supabase
        .from('scouted_properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('is_private', true)
        .eq('source', 'homeless');

      const [pendingRes, successRes, failedRes, notFoundRes, withPhoneRes] = await Promise.all([
        baseQ().or('owner_phone.is.null,owner_phone.eq.').lt('phone_extraction_attempts', 3).not('phone_extraction_status', 'eq', 'success').not('phone_extraction_status', 'eq', 'not_found'),
        baseQ().eq('phone_extraction_status', 'success'),
        baseQ().eq('phone_extraction_status', 'failed'),
        baseQ().eq('phone_extraction_status', 'not_found'),
        baseQ().not('owner_phone', 'is', null).not('owner_phone', 'eq', ''),
      ]);
      return {
        pending: pendingRes.count ?? 0,
        success: successRes.count ?? 0,
        failed: failedRes.count ?? 0,
        notFound: notFoundRes.count ?? 0,
        totalWithPhone: withPhoneRes.count ?? 0,
      };
    },
    refetchInterval: 15000,
  });

  // Feature flag
  const { data: flag } = useQuery({
    queryKey: ['feature-flag-phone-extraction'],
    queryFn: async () => {
      const { data } = await supabase
        .from('feature_flags')
        .select('id, is_enabled')
        .eq('name', 'phone_extraction_enabled')
        .single();
      return data;
    },
    refetchInterval: 30000,
  });

  // Recent runs
  const { data: runs } = useQuery({
    queryKey: ['phone-extraction-runs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('phone_extraction_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);
      return data ?? [];
    },
    refetchInterval: 10000,
  });

  // Toggle kill switch
  const toggleFlag = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!flag?.id) throw new Error('flag not found');
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: enabled })
        .eq('id', flag.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('עודכן בהצלחה');
      qc.invalidateQueries({ queryKey: ['feature-flag-phone-extraction'] });
    },
    onError: (e: Error) => toast.error(`שגיאה: ${e.message}`),
  });

  // Manual run
  const manualRun = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('phone-extraction-worker', {
        body: { manual: true },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.skipped) {
        toast.info(`דולג: ${data.reason}`);
      } else if (data?.phone_found) {
        toast.success('נמצא טלפון!');
      } else {
        toast.info('הריצה הסתיימה (ללא טלפון)');
      }
      qc.invalidateQueries({ queryKey: ['phone-extraction-stats'] });
      qc.invalidateQueries({ queryKey: ['phone-extraction-runs'] });
    },
    onError: (e: Error) => toast.error(`שגיאה: ${e.message}`),
  });

  return (
    <div className="space-y-4" dir="rtl">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="בתור" value={stats?.pending ?? 0} icon={<Clock className="h-4 w-4" />} color="amber" />
        <StatCard label="הצליחו" value={stats?.success ?? 0} icon={<CheckCircle2 className="h-4 w-4" />} color="green" />
        <StatCard label="נכשלו" value={stats?.failed ?? 0} icon={<XCircle className="h-4 w-4" />} color="red" />
        <StatCard label="לא נמצא" value={stats?.notFound ?? 0} icon={<AlertCircle className="h-4 w-4" />} color="gray" />
        <StatCard label="סה״כ עם טלפון" value={stats?.totalWithPhone ?? 0} icon={<Phone className="h-4 w-4" />} color="blue" />
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-5 w-5" />
            בקרה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-md border">
            <div>
              <p className="font-medium">חילוץ טלפונים אוטומטי</p>
              <p className="text-sm text-muted-foreground">
                Cron כל דקה, חלון פעילות 09:00–22:00, 15–45 שניות בין נכסים
              </p>
            </div>
            <Switch
              checked={!!flag?.is_enabled}
              onCheckedChange={(v) => toggleFlag.mutate(v)}
              disabled={toggleFlag.isPending}
            />
          </div>

          <Button
            onClick={() => manualRun.mutate()}
            disabled={manualRun.isPending}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {manualRun.isPending ? 'רץ...' : 'הרץ ידנית עכשיו (נכס אחד)'}
          </Button>
        </CardContent>
      </Card>

      {/* Recent runs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">20 ריצות אחרונות</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">זמן</TableHead>
                <TableHead className="text-right">מקור</TableHead>
                <TableHead className="text-right">טריגר</TableHead>
                <TableHead className="text-right">ניסיונות</TableHead>
                <TableHead className="text-right">נמצאו</TableHead>
                <TableHead className="text-right">שגיאות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(runs ?? []).map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">
                    {new Date(r.started_at).toLocaleString('he-IL')}
                  </TableCell>
                  <TableCell>{r.source}</TableCell>
                  <TableCell>
                    <Badge variant={r.triggered_by === 'manual' ? 'default' : 'secondary'}>
                      {r.triggered_by === 'manual' ? 'ידני' : 'אוטומטי'}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.properties_attempted}</TableCell>
                  <TableCell>
                    {r.phones_found > 0 ? (
                      <Badge className="bg-green-600">{r.phones_found}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.errors_count > 0 ? (
                      <Badge variant="destructive">{r.errors_count}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!runs || runs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    אין ריצות עדיין
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'amber' | 'green' | 'red' | 'gray' | 'blue';
}> = ({ label, value, icon, color }) => {
  const colorMap: Record<string, string> = {
    amber: 'text-amber-600 dark:text-amber-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    gray: 'text-muted-foreground',
    blue: 'text-blue-600 dark:text-blue-400',
  };
  return (
    <Card>
      <CardContent className="p-3">
        <div className={`flex items-center gap-2 text-xs ${colorMap[color]}`}>
          {icon}
          <span>{label}</span>
        </div>
        <p className="text-2xl font-bold mt-1">{value.toLocaleString('he-IL')}</p>
      </CardContent>
    </Card>
  );
};
