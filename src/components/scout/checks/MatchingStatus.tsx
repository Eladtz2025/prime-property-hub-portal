import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CheckCircle, XCircle, Loader2, Clock, Users, UserCheck, UserX } from 'lucide-react';

export const MatchingStatus: React.FC = () => {
  const { data: runs } = useQuery({
    queryKey: ['matching-runs-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_runs')
        .select('*')
        .eq('source', 'matching')
        .order('started_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  // Pending properties (status = 'new' and active)
  const { data: pendingCount } = useQuery({
    queryKey: ['matching-pending-properties'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('scouted_properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('status', 'new');
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 15000,
  });

  // Lead stats
  const { data: leadStats } = useQuery({
    queryKey: ['matching-lead-stats'],
    queryFn: async () => {
      const [eligibleRes, incompleteRes] = await Promise.all([
        supabase.from('contact_leads').select('id', { count: 'exact', head: true }).eq('matching_status', 'eligible'),
        supabase.from('contact_leads').select('id', { count: 'exact', head: true }).eq('matching_status', 'incomplete'),
      ]);
      const eligible = eligibleRes.count ?? 0;
      const incomplete = incompleteRes.count ?? 0;

      // Get unique lead_ids that have matches in active properties
      const { data: matchedProps } = await supabase
        .from('scouted_properties')
        .select('matched_leads')
        .eq('is_active', true)
        .not('matched_leads', 'is', null)
        .neq('matched_leads', '[]');

      const matchedLeadIds = new Set<string>();
      if (matchedProps) {
        for (const prop of matchedProps) {
          const leads = prop.matched_leads as any[];
          if (Array.isArray(leads)) {
            for (const l of leads) {
              if (l?.lead_id) matchedLeadIds.add(l.lead_id);
            }
          }
        }
      }

      // Get all eligible lead IDs to intersect
      const { data: eligibleLeads } = await supabase
        .from('contact_leads')
        .select('id')
        .eq('matching_status', 'eligible');

      const eligibleIds = new Set((eligibleLeads || []).map(l => l.id));
      const withMatches = [...matchedLeadIds].filter(id => eligibleIds.has(id)).length;
      const withoutMatches = eligible - withMatches;

      return { eligible, incomplete, total: eligible + incomplete, withMatches, withoutMatches };
    },
    refetchInterval: 15000,
  });

  const lastRun = runs?.[0];
  const isRunning = lastRun?.status === 'running';

  return (
    <div className="space-y-3">
      {/* Last run subtitle */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>ריצה אחרונה: {isRunning
          ? <span className="text-blue-500 font-medium inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />רץ כעת</span>
          : lastRun?.completed_at ? format(new Date(lastRun.completed_at), 'dd/MM HH:mm', { locale: he }) : '—'
        }</span>
        {lastRun && !isRunning && (
          <span className="text-muted-foreground/60">
            ({lastRun.properties_found?.toLocaleString('he-IL') ?? 0} נכסים נבדקו)
          </span>
        )}
      </div>

      {/* Stats - 4 cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">ממתינים להתאמה</p>
          <p className={`text-xl font-bold ${pendingCount === 0 ? 'text-green-600' : (pendingCount ?? 0) > 1000 ? 'text-red-600' : 'text-amber-600'}`}>
            {pendingCount?.toLocaleString('he-IL') ?? '—'}
          </p>
          <p className="text-[10px] text-muted-foreground/60">נכסים חדשים</p>
        </CardContent></Card>

        <Card><CardContent className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">לקוחות במערכת</p>
          </div>
          <p className="text-xl font-bold">{leadStats?.total ?? '—'}</p>
          <p className="text-[10px] text-muted-foreground/60">
            {leadStats ? `${leadStats.eligible} פעילים | ${leadStats.incomplete} חסרי נתונים` : ''}
          </p>
        </CardContent></Card>

        <Card><CardContent className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <UserCheck className="h-3 w-3 text-green-600" />
            <p className="text-xs text-muted-foreground">עברו התאמה</p>
          </div>
          <p className="text-xl font-bold text-green-600">{leadStats?.withMatches ?? '—'}</p>
          <p className="text-[10px] text-muted-foreground/60">
            {leadStats ? `מתוך ${leadStats.eligible} פעילים` : ''}
          </p>
        </CardContent></Card>

        <Card><CardContent className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <UserX className="h-3 w-3 text-amber-600" />
            <p className="text-xs text-muted-foreground">ללא התאמות</p>
          </div>
          <p className={`text-xl font-bold ${(leadStats?.withoutMatches ?? 0) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {leadStats?.withoutMatches ?? '—'}
          </p>
          <p className="text-[10px] text-muted-foreground/60">לידים ללא דירות מתאימות</p>
        </CardContent></Card>
      </div>

      {/* History */}
      {runs && runs.length > 0 ? (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="h-9">
                <TableHead className="py-2 text-xs">תאריך</TableHead>
                <TableHead className="py-2 text-xs">סטטוס</TableHead>
                <TableHead className="py-2 text-xs">נכסים</TableHead>
                <TableHead className="py-2 text-xs">התאמות</TableHead>
                <TableHead className="py-2 text-xs">שגיאה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map(run => (
                <TableRow key={run.id} className="h-9">
                  <TableCell className="py-1.5 text-xs">
                    {run.started_at ? format(new Date(run.started_at), 'dd/MM HH:mm', { locale: he }) : '—'}
                  </TableCell>
                  <TableCell className="py-1.5">
                    {run.status === 'completed' && <Badge className="bg-green-600 text-white text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />הושלם</Badge>}
                    {run.status === 'running' && <Badge className="bg-blue-600 text-white text-[10px]"><Loader2 className="h-3 w-3 mr-1 animate-spin" />רץ</Badge>}
                    {run.status === 'failed' && <Badge className="bg-red-600 text-white text-[10px]"><XCircle className="h-3 w-3 mr-1" />נכשל</Badge>}
                    {!['completed', 'running', 'failed'].includes(run.status || '') && <Badge variant="outline" className="text-[10px]">{run.status}</Badge>}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs">{run.properties_found ?? 0}</TableCell>
                  <TableCell className="py-1.5 text-xs font-medium text-green-600">{run.leads_matched ?? 0}</TableCell>
                  <TableCell className="py-1.5 text-[10px] text-red-500 truncate max-w-[150px]">{run.error_message || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground text-sm">אין היסטוריית התאמות</div>
      )}
    </div>
  );
};
