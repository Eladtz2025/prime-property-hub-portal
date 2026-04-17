import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface RecentItem {
  address: string;
  neighborhood?: string;
  source?: string;
  source_url?: string;
  status: string;
  fields_found?: string[];
  fields_updated?: string[];
  broker_result?: string;
  address_action?: string;
  timestamp: string;
  // Enriched fields
  price?: number | null;
  rooms?: number | null;
  size?: number | null;
  floor?: number | null;
  features?: string[];
  branch?: string | null;
  error_reason?: string | null;
}

const featureLabels: Record<string, string> = {
  mamad: 'ממ״ד',
  parking: 'חניה',
  elevator: 'מעלית',
  balcony: 'מרפסת',
  aircon: 'מזגן',
  air_conditioner: 'מזגן',
  storage: 'מחסן',
  furnished: 'מרוהט',
  renovated: 'משופץ',
  accessible: 'נגיש',
  bars: 'סורגים',
  kosher_kitchen: 'מטבח כשר',
  pets: 'חיות מחמד',
  garden: 'גינה',
  rooftop: 'גג',
  sun_balcony: 'מרפסת שמש',
};

const formatPrice = (n?: number | null) => {
  if (!n || n <= 0) return null;
  return `₪${n.toLocaleString('he-IL')}`;
};

const formatDetails = (item: RecentItem): string | null => {
  const parts: string[] = [];
  const price = formatPrice(item.price);
  if (price) parts.push(price);
  if (item.rooms) parts.push(`${item.rooms} חד׳`);
  if (item.size) parts.push(`${item.size}מ״ר`);
  if (item.floor !== null && item.floor !== undefined) parts.push(`קומה ${item.floor}`);
  const feats = (item.features || []).map(f => featureLabels[f] || f);
  if (feats.length) parts.push(feats.join(', '));
  return parts.length ? parts.join(' · ') : null;
};

type StatusFilter = 'all' | 'success' | 'failed';

const fieldLabels: Record<string, string> = {
  rooms: 'חדרים',
  price: 'מחיר',
  size: 'גודל',
  city: 'עיר',
  floor: 'קומה',
  neighborhood: 'שכונה',
  features: 'מאפיינים',
  backfill_status: 'סטטוס',
  is_broker_listing: 'מתווך/פרטי',
  address: 'כתובת',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ok: { label: 'הצלחה', variant: 'default' },
  scrape_failed: { label: 'סריקה נכשלה', variant: 'destructive' },
  timeout_skipped: { label: 'חריגת זמן', variant: 'destructive' },
  blacklisted: { label: 'חסום', variant: 'secondary' },
  no_new_data: { label: 'אין נתונים חדשים', variant: 'outline' },
  non_ta_deactivated: { label: 'לא ת"א - הוסר', variant: 'secondary' },
  no_markdown: { label: 'אין תוכן', variant: 'destructive' },
  no_content: { label: 'אין תוכן', variant: 'destructive' },
  madlan_captcha: { label: 'CAPTCHA מדלן', variant: 'destructive' },
  madlan_homepage_redirect: { label: 'הפניה לדף בית', variant: 'destructive' },
  madlan_blocked: { label: 'חסימת מדלן', variant: 'destructive' },
  update_error: { label: 'שגיאת עדכון', variant: 'destructive' },
};

const getStatusInfo = (status: string) => statusConfig[status] || { label: status, variant: 'outline' as const };

const isSuccessStatus = (status: string) => status === 'ok';

export const BackfillJinaHistory: React.FC = () => {
  const [filter, setFilter] = useState<StatusFilter>('all');

  const { data: items, isLoading } = useQuery({
    queryKey: ['backfill-jina-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backfill_progress')
        .select('summary_data')
        .or('task_name.eq.data_completion_jina,task_name.like.data_completion_jina_auto_%')
        .not('summary_data', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      const summary = data?.summary_data as Record<string, any> | null;
      const recentItems = (summary?.recent_items ?? []) as RecentItem[];
      return recentItems.reverse(); // newest first
    },
  });

  const filtered = items?.filter((item) => {
    if (filter === 'success') return isSuccessStatus(item.status);
    if (filter === 'failed') return !isSuccessStatus(item.status);
    return true;
  }) ?? [];

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  if (!items?.length) {
    return <p className="text-center text-sm text-muted-foreground py-8">אין היסטוריה עדיין</p>;
  }

  const successCount = items.filter(i => isSuccessStatus(i.status)).length;
  const failedCount = items.length - successCount;

  return (
    <div className="space-y-3">
      {/* Filter buttons */}
      <div className="flex gap-2">
        <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setFilter('all')}>
          הכל ({items.length})
        </Button>
        <Button size="sm" variant={filter === 'success' ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setFilter('success')}>
          הצלחה ({successCount})
        </Button>
        <Button size="sm" variant={filter === 'failed' ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setFilter('failed')}>
          כשלון ({failedCount})
        </Button>
      </div>

      <ScrollArea className="h-[60vh]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>כתובת</TableHead>
              <TableHead>שכונה</TableHead>
              <TableHead>מקור</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>שדות שעודכנו</TableHead>
              <TableHead>זמן</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item, i) => {
              const statusInfo = getStatusInfo(item.status);
              const time = new Date(item.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const updatedFields = (item.fields_updated ?? []).filter(f => f !== 'backfill_status');
              const detailsLine = isSuccessStatus(item.status) ? formatDetails(item) : null;
              const failureLine = !isSuccessStatus(item.status) ? item.error_reason : null;

              return (
                <TableRow key={i}>
                  <TableCell className="font-medium max-w-[260px] align-top">
                    <div className="truncate">
                      {item.source_url ? (
                        <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">{item.address || '—'}</a>
                      ) : (item.address || '—')}
                      {item.branch && (
                        <span className="ms-1 inline-block text-[9px] text-muted-foreground border border-border rounded px-1 py-0">[{item.branch}]</span>
                      )}
                    </div>
                    {detailsLine && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-normal leading-tight">{detailsLine}</div>
                    )}
                    {failureLine && (
                      <div className="text-[10px] text-destructive mt-0.5 whitespace-normal leading-tight">סיבה: {failureLine}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground align-top">{item.neighborhood || '—'}</TableCell>
                  <TableCell className="text-muted-foreground align-top">{item.source || '—'}</TableCell>
                  <TableCell className="align-top">
                    <Badge variant={statusInfo.variant} className="text-[10px]">{statusInfo.label}</Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex flex-wrap gap-1">
                      {updatedFields.length > 0 ? updatedFields.map(f => (
                        <span key={f} className="inline-block bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px]">
                          {fieldLabels[f] || f}
                        </span>
                      )) : <span className="text-[10px] text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[11px] whitespace-nowrap align-top">{time}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};
