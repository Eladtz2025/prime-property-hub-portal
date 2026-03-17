import React from 'react';
import { Monitor, Activity, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useMonitorData } from './monitor/useMonitorData';

export const LiveMonitor: React.FC = () => {
  const {
    activeProcesses,
    alerts,
    intelligence,
    hasActivity,
  } = useMonitorData();

  const errorAlerts = alerts.filter(a => a.severity === 'error').length;
  const statusText = errorAlerts > 0 ? `${errorAlerts} חריגות` : hasActivity ? 'תקין' : 'Idle';
  const statusDotClass = errorAlerts > 0 ? 'bg-red-400' : hasActivity ? 'bg-emerald-400' : 'bg-gray-600';
  const statusTextClass = errorAlerts > 0 ? 'text-red-400' : hasActivity ? 'text-emerald-400' : 'text-gray-500';

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gray-950/95 backdrop-blur-sm overflow-hidden shadow-2xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.05]">
        <Monitor className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-200">מוניטור חי</span>
        <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
        <span className={`text-xs ${statusTextClass}`}>{statusText}</span>
      </div>

      {/* Body */}
      <div className="flex" style={{ height: '320px' }}>
        {/* Center */}
        <div className="flex-1 min-w-0 flex items-center justify-center">
          {!hasActivity && activeProcesses.length === 0 ? (
            <div className="text-center space-y-2">
              <Activity className="h-8 w-8 text-gray-700 mx-auto" />
              <p className="text-sm text-gray-400">אין פעילות כרגע</p>
              <p className="text-xs text-gray-600">המערכת מאזינה ותציג כאן אירועים בזמן אמת</p>
            </div>
          ) : (
            <div className="w-full p-6 space-y-3">
              {activeProcesses.map((proc, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.02] rounded-xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500 shrink-0" />
                  <span className="text-sm text-gray-200 flex-1 truncate">{proc.label}</span>
                  <span className="text-[11px] text-gray-500 font-mono shrink-0">{proc.elapsed}</span>
                  {proc.progress !== undefined && (
                    <div className="w-24 shrink-0">
                      <Progress value={proc.progress} className="h-1 [&>div]:bg-emerald-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metrics Rail */}
        <div className="w-[150px] shrink-0 border-r border-white/[0.04] p-4 flex flex-col justify-center gap-6">
          <MetricItem label="Events/min" value={String(intelligence.throughput)} />
          <MetricItem
            label="Avg latency"
            value={intelligence.avgLatency !== null ? `${(intelligence.avgLatency / 1000).toFixed(1)}s` : '—'}
          />
          <MetricItem
            label="Timeout rate"
            value={`${intelligence.timeoutRate}%`}
            valueClass={intelligence.timeoutRate > 20 ? 'text-red-400' : intelligence.timeoutRate > 10 ? 'text-yellow-400' : undefined}
          />
          <MetricItem label="תורים פעילים" value={String(activeProcesses.length)} />
          <div>
            <p className="text-[10px] text-gray-500 mb-1">סטטוס</p>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
              <span className={`text-sm font-semibold ${statusTextClass}`}>
                {errorAlerts > 0 ? 'חריגות' : 'תקין'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricItem: React.FC<{ label: string; value: string; valueClass?: string }> = ({ label, value, valueClass }) => (
  <div>
    <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
    <p className={`text-lg font-bold ${valueClass || 'text-white'}`}>{value}</p>
  </div>
);
