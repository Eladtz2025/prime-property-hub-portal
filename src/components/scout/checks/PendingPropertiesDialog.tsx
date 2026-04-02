import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { SearchHighlight } from '@/components/SearchHighlight';

interface PendingPropertiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PendingPropertiesDialog: React.FC<PendingPropertiesDialogProps> = ({ open, onOpenChange }) => {
  const [search, setSearch] = useState('');

  const { data: pendingProperties, isLoading } = useQuery({
    queryKey: ['pending-availability-properties'],
    queryFn: async () => {
      const { data: ids, error: idsError } = await supabase.rpc('get_properties_needing_availability_check', {
        p_first_recheck_days: 8,
        p_recurring_recheck_days: 2,
        p_min_days_before_check: 3,
        p_fetch_limit: 5000,
      });
      if (idsError) throw idsError;
      if (!ids?.length) return [];

      const idList = ids.map((r: { id: string }) => r.id);
      const batchSize = 500;
      const allProperties: any[] = [];
      for (let i = 0; i < idList.length; i += batchSize) {
        const batch = idList.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('scouted_properties')
          .select('id, address, city, rooms, floor, price, source, availability_checked_at, source_url, availability_check_reason')
          .in('id', batch)
          .order('availability_checked_at', { ascending: true, nullsFirst: true });
        if (error) throw error;
        if (data) allProperties.push(...data);
      }

      return allProperties.sort((a, b) => {
        if (!a.availability_checked_at && !b.availability_checked_at) return 0;
        if (!a.availability_checked_at) return -1;
        if (!b.availability_checked_at) return 1;
        return new Date(a.availability_checked_at).getTime() - new Date(b.availability_checked_at).getTime();
      });
    },
    enabled: open,
    staleTime: 30000,
  });

  const pendingCount = pendingProperties?.length ?? 0;

  const cleanAddress = (addr: string | null) => {
    if (!addr) return '—';
    return addr.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  };

  const filtered = React.useMemo(() => {
    if (!pendingProperties?.length) return [];
    if (!search.trim()) return pendingProperties;
    const term = search.trim().toLowerCase();
    return pendingProperties.filter((p: any) =>
      (p.address?.toLowerCase().includes(term)) ||
      (p.city?.toLowerCase().includes(term)) ||
      (p.source?.toLowerCase().includes(term)) ||
      (p.source_url?.toLowerCase().includes(term))
    );
  }, [pendingProperties, search]);

  const reasonLabel = (reason: string | null) => {
    if (!reason) return '—';
    const map: Record<string, string> = {
      'madlan_direct_status_403': '403 חסום',
      'timeout': 'טיימאאוט',
      'per_property_timeout': 'טיימאאוט נכס',
      'blocked': 'חסום',
      'rate_limited': 'הגבלת קצב',
      'check_error': 'שגיאה',
      'status_520': '520',
    };
    return map[reason] || reason;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            נכסים ממתינים לבדיקת זמינות ({pendingCount})
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי כתובת, עיר או מקור..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {search ? 'לא נמצאו תוצאות' : 'אין נכסים ממתינים'}
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-2 p-2">
                {filtered.map((p: any) => (
                  <div key={p.id} className="rounded-lg border p-3 border-border">
                    <div className="flex-1 min-w-0">
                      {p.source_url ? (
                        <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary transition-colors line-clamp-1">
                          <SearchHighlight text={cleanAddress(p.address)} searchTerm={search} />
                        </a>
                      ) : (
                        <p className="text-sm font-medium line-clamp-1">
                          <SearchHighlight text={cleanAddress(p.address)} searchTerm={search} />
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <SearchHighlight text={p.city || '—'} searchTerm={search} />
                        <span>·</span>
                        <span>{p.price ? `₪${p.price.toLocaleString('he-IL')}` : '—'}</span>
                        <span>·</span>
                        <span>{p.availability_checked_at ? format(new Date(p.availability_checked_at), 'dd/MM HH:mm', { locale: he }) : 'לא נבדק'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>כתובת</TableHead>
                      <TableHead>חדרים</TableHead>
                      <TableHead>מחיר</TableHead>
                      <TableHead>סיבה</TableHead>
                      <TableHead>נבדק</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div>
                            {p.source_url ? (
                              <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                <SearchHighlight text={cleanAddress(p.address)} searchTerm={search} />
                              </a>
                            ) : (
                              <SearchHighlight text={cleanAddress(p.address)} searchTerm={search} />
                            )}
                            {p.city && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                <SearchHighlight text={p.city} searchTerm={search} />
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{p.rooms ?? '—'}</TableCell>
                        <TableCell>{p.price ? `₪${p.price.toLocaleString('he-IL')}` : '—'}</TableCell>
                        <TableCell className="text-xs">
                          {reasonLabel(p.availability_check_reason)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {p.availability_checked_at
                            ? format(new Date(p.availability_checked_at), 'dd/MM HH:mm', { locale: he })
                            : 'לא נבדק'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          {filtered.length > 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              מציג {filtered.length} מתוך {pendingCount}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
