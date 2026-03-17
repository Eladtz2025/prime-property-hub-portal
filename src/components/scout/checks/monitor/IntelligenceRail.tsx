import React from 'react';
import { MiniSparkline } from '../../MiniSparkline';

interface IntelligenceRailProps {
  throughput: number;
  avgLatency: number | null;
  timeoutRate: number;
  activeSources: string[];
  hasAlerts: boolean;
  sparkline: number[];
}

const sourceBadgeMap: Record<string, { text: string; cls: string }> = {
  yad2: { text: 'YAD2', cls: 'bg-orange-500/15 text-orange-400' },
  madlan: { text: 'MDLN', cls: 'bg-blue-500/15 text-blue-400' },
  homeless: { text: 'HMLS', cls: 'bg-purple-500/15 text-purple-400' },
  availability: { text: 'AVAIL', cls: 'bg-cyan-500/15 text-cyan-400' },
  backfill: { text: 'FILL', cls: 'bg-teal-500/15 text-teal-400' },
};

export const IntelligenceRail: React.FC<IntelligenceRailProps> = ({
  throughput,
  avgLatency,
  timeoutRate,
  activeSources,
  hasAlerts,
  sparkline,
}) => {
  return (
    <div className="w-[160px] shrink-0 border-r border-white/[0.04] bg-gray-900/30 p-3 space-y-4 overflow-y-auto" dir="rtl">
      {/* Throughput */}
      <div>
        <p className="text-[10px] text-gray-500 mb-1">Events/min</p>
        <p className="text-xl font-bold text-white">{throughput}</p>
        <MiniSparkline data={sparkline} width={130} height={28} color="hsl(142, 71%, 45%)" />
      </div>

      {/* Avg Latency */}
      <div>
        <p className="text-[10px] text-gray-500 mb-1">Avg Latency</p>
        <p className="text-lg font-bold text-white">
          {avgLatency !== null ? `${(avgLatency / 1000).toFixed(1)}s` : '—'}
        </p>
      </div>

      {/* Timeout Rate */}
      <div>
        <p className="text-[10px] text-gray-500 mb-1">Timeout Rate</p>
        <p className={`text-lg font-bold ${timeoutRate > 20 ? 'text-red-400' : timeoutRate > 10 ? 'text-yellow-400' : 'text-emerald-400'}`}>
          {timeoutRate}%
        </p>
      </div>

      {/* Active Sources */}
      <div>
        <p className="text-[10px] text-gray-500 mb-1.5">מקורות פעילים</p>
        <div className="flex flex-wrap gap-1">
          {activeSources.length === 0 ? (
            <span className="text-[10px] text-gray-600">—</span>
          ) : (
            activeSources.map(src => {
              const badge = sourceBadgeMap[src.toLowerCase()] || { text: src.slice(0, 4).toUpperCase(), cls: 'bg-gray-500/15 text-gray-400' };
              return (
                <span key={src} className={`${badge.cls} text-[9px] font-mono font-bold px-1.5 py-0.5 rounded`}>
                  {badge.text}
                </span>
              );
            })
          )}
        </div>
      </div>

      {/* System Status */}
      <div>
        <p className="text-[10px] text-gray-500 mb-1">סטטוס</p>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${hasAlerts ? 'text-red-400' : 'text-emerald-400'}`}>
          <span className={`h-2 w-2 rounded-full ${hasAlerts ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} />
          {hasAlerts ? 'חריגות' : 'תקין'}
        </div>
      </div>
    </div>
  );
};
