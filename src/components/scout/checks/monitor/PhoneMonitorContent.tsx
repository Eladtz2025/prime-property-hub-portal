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
        .select('id, started_at, ended_at, status, phones_found, errors_count, triggered_by, property_id')
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
          <p className="text-xs text-gray-600">הקרון רץ כל דקה בין 09:00–22:00</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full" dir="rtl">
      {runs.map((run: any) => {
        const isFound = run.phones_found > 0;
        const hasError = run.errors_count > 0;
        const isRunning = run.status === 'running';

        return (
          <div
            key={run.id}
            className={`flex items-center gap-3 px-4 py-2 border-b border-white/[0.04] text-[11px] ${
              isFound
                ? 'bg-emerald-950/20 border-r-2 border-r-emerald-500/40'
                : hasError
                  ? 'bg-red-950/20 border-r-2 border-r-red-500/40'
                  : 'bg-amber-950/10 border-r-2 border-r-amber-500/20'
            }`}
          >
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
              {isFound ? 'נמצא' : hasError ? 'שגיאה' : 'לא נמצא'}
            </span>

            {/* Property ID shortened */}
            {run.property_id && (
              <span className="text-gray-500 font-mono shrink-0">
                {run.property_id.substring(0, 8)}
              </span>
            )}

            <span className="flex-1 text-gray-400 truncate">
              {run.triggered_by === 'manual' ? 'ריצה ידנית' : 'אוטומטי'}
              {isFound && ` · טלפון חולץ`}
            </span>

            {/* Timestamp */}
            <span className="text-gray-600 font-mono shrink-0">
              {format(new Date(run.started_at), 'HH:mm:ss', { locale: he })}
            </span>
          </div>
        );
      })}
    </div>
  );
};
