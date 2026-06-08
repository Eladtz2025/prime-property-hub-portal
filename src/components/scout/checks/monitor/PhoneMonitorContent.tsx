import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Phone, CheckCircle, XCircle, Clock } from 'lucide-react';

export const PhoneMonitorContent: React.FC = () => {
  const { data: runs } = useQuery({
    queryKey: ['phone-monitor-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phone_extraction_runs')
        .select('id, started_at, ended_at, status, phones_found, errors_count, triggered_by, source, properties_attempted, notes')
        .order('started_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 15000,
  });

  if (!runs || runs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <Phone className="h-8 w-8 text-gray-700 mx-auto" />
          <p className="text-sm text-gray-400">אין אירועי חילוץ טלפונים</p>
          <p className="text-xs text-gray-600">הקרון רץ כל דקה בין 09:00–21:00</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full" dir="rtl">
      {runs.map((run: any) => {
        const isFound = (run.phones_found ?? 0) > 0;
        const hasError = (run.errors_count ?? 0) > 0;
        const isRunning = run.status === 'running';
        const isBatch = (run.properties_attempted ?? 1) > 1;

        // Pull property details from notes
        const notes = run.notes as any;
        // Single-property cron run: notes = { property_id, result }
        // Batch manual run:          notes = { batch_size, phones_found, sample: [...] }
        const singlePropertyId: string | undefined =
          !isBatch && notes?.property_id ? notes.property_id : undefined;
        const batchSample: { property_id: string; phone_found: boolean; phone?: string }[] =
          isBatch && Array.isArray(notes?.sample) ? notes.sample : [];

        const sourceLabel: Record<string, string> = { yad2: 'Yad2', madlan: 'Madlan', homeless: 'Homeless' };

        return (
          <div
            key={run.id}
            className={`flex flex-col gap-1 px-4 py-2.5 border-b border-white/[0.04] text-[11px] ${
              isFound
                ? 'bg-emerald-950/20 border-r-2 border-r-emerald-500/40'
                : hasError
                  ? 'bg-red-950/20 border-r-2 border-r-red-500/40'
                  : 'bg-amber-950/10 border-r-2 border-r-amber-500/20'
            }`}
          >
            {/* Main row */}
            <div className="flex items-center gap-3">
              {/* Status icon */}
              <span className="shrink-0">
                {isRunning ? (
                  <Clock className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                ) : isFound ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                ) : hasError ? (
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                ) : (
                  <Phone className="h-3.5 w-3.5 text-gray-500" />
                )}
              </span>

              {/* Badge */}
              <span className={`shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                isFound
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : hasError
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-gray-500/20 text-gray-500'
              }`}>
                {isFound ? `נמצאו ${run.phones_found}` : hasError ? 'שגיאה' : 'לא נמצא'}
              </span>

              {/* Source */}
              {run.source && (
                <span className="text-gray-500 font-mono shrink-0 text-[9px] uppercase">
                  {sourceLabel[run.source] ?? run.source}
                </span>
              )}

              {/* Single property ID */}
              {singlePropertyId && (
                <span className="text-gray-500 font-mono shrink-0">
                  {singlePropertyId.substring(0, 8)}
                </span>
              )}

              <span className="flex-1 text-gray-400 truncate">
                {isBatch
                  ? `${run.triggered_by === 'manual' ? 'ריצה ידנית' : 'אוטומטי'} · ${run.properties_attempted} נכסים`
                  : run.triggered_by === 'manual' ? 'ריצה ידנית' : 'אוטומטי'}
              </span>

              {/* Timestamp */}
              <span className="text-gray-600 font-mono shrink-0">
                {format(new Date(run.started_at), 'HH:mm:ss', { locale: he })}
              </span>
            </div>

            {/* Batch sample — show phones found with their numbers */}
            {isBatch && batchSample.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pl-7">
                {batchSample.filter(s => s.phone_found).map((s, i) => (
                  <span key={i} className="text-[10px] font-mono bg-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded">
                    {s.phone ?? s.property_id.substring(0, 8)}
                  </span>
                ))}
                {batchSample.filter(s => !s.phone_found).length > 0 && (
                  <span className="text-[10px] text-gray-600">
                    +{batchSample.filter(s => !s.phone_found).length} ללא טלפון
                  </span>
                )}
              </div>
            )}

            {/* Single-property phone result from notes */}
            {!isBatch && notes?.result?.phone && (
              <div className="pl-7">
                <span className="text-[10px] font-mono bg-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded">
                  {notes.result.phone}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
