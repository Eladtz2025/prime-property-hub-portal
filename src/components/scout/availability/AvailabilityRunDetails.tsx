import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Json } from '@/integrations/supabase/types';

interface RunDetail {
  property_id: string;
  source_url?: string;
  reason: string;
  is_inactive: boolean;
  address?: string;
  source?: string;
}

interface AvailabilityRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  properties_checked: number | null;
  inactive_marked: number | null;
  error_message: string | null;
  run_details: Json;
}

interface Props {
  run: AvailabilityRun | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DetailReasonBadge: React.FC<{ reason: string; isInactive: boolean }> = ({ reason, isInactive }) => {
  if (isInactive) {
    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px] gap-1">
        <XCircle className="h-3 w-3" />
        {reason}
      </Badge>
    );
  }
  if (reason === 'content_ok') {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px] gap-1">
        <CheckCircle className="h-3 w-3" />
        אקטיבי
      </Badge>
    );
  }
  if (reason.includes('timeout')) {
    return (
      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] gap-1">
        <Clock className="h-3 w-3" />
        Timeout
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] gap-1">
      <AlertTriangle className="h-3 w-3" />
      {reason}
    </Badge>
  );
};

export const AvailabilityRunDetails: React.FC<Props> = ({ run, open, onOpenChange }) => {
  if (!run) return null;

  const details: RunDetail[] = Array.isArray(run.run_details) 
    ? (run.run_details as unknown as RunDetail[])
    : [];

  const summary = {
    total: details.length,
    active: details.filter(d => !d.is_inactive && d.reason === 'content_ok').length,
    removed: details.filter(d => d.is_inactive).length,
    timeout: details.filter(d => d.reason?.includes('timeout')).length,
    other: details.filter(d => !d.is_inactive && d.reason !== 'content_ok' && !d.reason?.includes('timeout')).length,
  };

  const duration = run.completed_at
    ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base">
            פרטי ריצה - {format(new Date(run.started_at), 'dd/MM/yyyy HH:mm', { locale: he })}
          </DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="text-xs">סה״כ: {summary.total}</Badge>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
            אקטיבי: {summary.active}
          </Badge>
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs">
            הוסר: {summary.removed}
          </Badge>
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-xs">
            Timeout: {summary.timeout}
          </Badge>
          {duration && (
            <Badge variant="outline" className="text-xs">משך: {duration} שניות</Badge>
          )}
        </div>

        {run.error_message && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400 mb-4">
            {run.error_message}
          </div>
        )}

        {details.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            אין פרטים זמינים לריצה זו (ריצות ישנות לא כוללות פרטים)
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="h-9">
                  <TableHead className="py-2 text-xs">כתובת / מקור</TableHead>
                  <TableHead className="py-2 text-xs w-[70px]">מקור</TableHead>
                  <TableHead className="py-2 text-xs w-[120px]">תוצאה</TableHead>
                  <TableHead className="py-2 text-xs w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.map((detail, i) => (
                  <TableRow key={i} className={`h-9 ${detail.is_inactive ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                    <TableCell className="py-1.5 text-xs truncate max-w-[200px]">
                      {detail.address || detail.property_id?.slice(0, 8) + '...'}
                    </TableCell>
                    <TableCell className="py-1.5 text-xs">{detail.source || '—'}</TableCell>
                    <TableCell className="py-1.5">
                      <DetailReasonBadge reason={detail.reason} isInactive={detail.is_inactive} />
                    </TableCell>
                    <TableCell className="py-1.5">
                      {detail.source_url && (
                        <a href={detail.source_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
