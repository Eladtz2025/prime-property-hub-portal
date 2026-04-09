import React, { useState, useMemo } from 'react';
import { Monitor, Activity, Loader2, Shield, Search, Database, Copy, Users, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMonitorData } from './monitor/useMonitorData';
import { LiveFeedTab } from './monitor/LiveFeedTab';
import { FeedItem } from './monitor/useMonitorData';
import { ScheduleContent } from './ScheduleContent';

type TabKey = 'availability' | 'scan' | 'backfill' | 'dedup' | 'matching' | 'schedule';

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'availability', label: 'זמינות', icon: Shield },
  { key: 'scan', label: 'סריקה', icon: Search },
  { key: 'backfill', label: 'השלמה', icon: Database },
  { key: 'dedup', label: 'כפילויות', icon: Copy },
  { key: 'matching', label: 'התאמות', icon: Users },
  { key: 'schedule', label: 'לוח זמנים', icon: Clock },
];

export const LiveMonitor: React.FC = () => {
  const {
    activeProcesses,
    alerts,
    intelligence,
    hasActivity,
    feedItems,
    dailyRunsHealth,
    yesterdayScansHealth,
  } = useMonitorData();
  const [activeTab, setActiveTab] = useState<TabKey>('availability');

  const errorAlerts = alerts.filter(a => a.severity === 'error').length;
  const statusText = errorAlerts > 0 ? `${errorAlerts} חריגות` : hasActivity ? 'תקין' : 'Idle';
  const statusDotClass = errorAlerts > 0 ? 'bg-red-400' : hasActivity ? 'bg-emerald-400' : 'bg-gray-600';
  const statusTextClass = errorAlerts > 0 ? 'text-red-400' : hasActivity ? 'text-emerald-400' : 'text-gray-500';

  // Count items per tab for badges
  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = { availability: 0, scan: 0, backfill: 0, dedup: 0, matching: 0, schedule: 0 };
    feedItems.forEach(f => { if (counts[f.type] !== undefined) counts[f.type]++; });
    return counts;
  }, [feedItems]);

  // Filter feed by active tab
  const filteredFeed = useMemo(() => {
    if (activeTab === 'schedule') return [];
    return feedItems.filter(f => f.type === activeTab).slice(0, 20);
  }, [feedItems, activeTab]);

  const healthColor = dailyRunsHealth.passed === dailyRunsHealth.total
    ? 'text-emerald-400'
    : dailyRunsHealth.passed >= dailyRunsHealth.total / 2
      ? 'text-yellow-400'
      : 'text-red-400';

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gray-950/95 backdrop-blur-sm overflow-hidden shadow-2xl" dir="rtl">
      {/* Header: single row on desktop, two rows on mobile */}
      <div className="border-b border-white/[0.05]">
        {/* Row 1: title + status */}
        <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2">
          <Monitor className="h-4 w-4 text-gray-400 shrink-0 hidden md:block" />
          <span className="text-xs md:text-sm font-medium text-gray-200 shrink-0">מוניטור</span>
          <span className={`h-2 w-2 rounded-full ${statusDotClass} shrink-0`} />
          <span className={`text-[10px] md:text-xs ${statusTextClass} shrink-0`}>{statusText}</span>
          <span className={`md:hidden text-[10px] font-mono ${healthColor} shrink-0`}>
            {dailyRunsHealth.passed}/{dailyRunsHealth.total}
          </span>

          {/* Desktop: tabs inline */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            <div className="w-px h-4 bg-white/[0.08] shrink-0 mr-2" />
            {tabs.map(tab => {
              const isActive = activeTab === tab.key;
              const count = tabCounts[tab.key];
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white/[0.08] text-gray-100'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                      isActive ? 'bg-white/10 text-gray-300' : 'bg-white/[0.04] text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2 (mobile only): scrollable tabs */}
        <div className="md:hidden flex gap-1 px-2 pb-2 overflow-x-auto scrollbar-none">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            const count = tabCounts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-white/[0.08] text-gray-100'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                    isActive ? 'bg-white/10 text-gray-300' : 'bg-white/[0.04] text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex" style={{ height: '420px' }}>
        {/* Metrics Rail — LEFT side (hidden on mobile) */}
        <div className="hidden md:flex w-[140px] shrink-0 border-l border-white/[0.04] p-4 flex-col justify-center gap-5">
          <MetricItem label="תורים פעילים" value={String(activeProcesses.length)} />

          {/* Daily runs health */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <p className="text-[10px] text-gray-500 mb-0.5">ריצות יומיות</p>
                  <div className="flex items-center gap-1.5">
                    {dailyRunsHealth.passed === dailyRunsHealth.total ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`text-lg font-bold ${healthColor}`}>
                      {dailyRunsHealth.passed}/{dailyRunsHealth.total}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-gray-900 border-white/10 text-gray-200 text-xs space-y-1 p-3">
                {dailyRunsHealth.details.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${d.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <span>{d.name}</span>
                    {d.time && <span className="text-gray-500 font-mono text-[10px]">{d.time}</span>}
                  </div>
                ))}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Yesterday scans health */}
          {yesterdayScansHealth.total > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <p className="text-[10px] text-gray-500 mb-0.5">סריקות אתמול</p>
                    <div className="flex items-center gap-1.5">
                      {yesterdayScansHealth.passed === yesterdayScansHealth.total ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                      <span className={`text-lg font-bold ${
                        yesterdayScansHealth.passed === yesterdayScansHealth.total
                          ? 'text-emerald-400'
                          : yesterdayScansHealth.passed >= yesterdayScansHealth.total / 2
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}>
                        {yesterdayScansHealth.passed}/{yesterdayScansHealth.total}
                      </span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-gray-900 border-white/10 text-gray-200 text-xs space-y-1 p-3">
                  {yesterdayScansHealth.details.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${d.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <span>{d.name}</span>
                      <span className="text-gray-500 font-mono text-[10px]">{d.found} נמצאו, {d.isNew} חדשים</span>
                      {d.time && <span className="text-gray-600 font-mono text-[10px]">{d.time}</span>}
                    </div>
                  ))}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

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

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Active processes bar */}
          {activeProcesses.length > 0 && (
            <div className="border-b border-white/[0.05] p-3 space-y-2">
              {activeProcesses.map((proc, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.02] rounded-xl px-4 py-2">
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

          {/* Content area */}
          <div className="flex-1 min-h-0">
            {activeTab === 'schedule' ? (
              <ScheduleContent />
            ) : filteredFeed.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <Activity className="h-8 w-8 text-gray-700 mx-auto" />
                  <p className="text-sm text-gray-400">
                    {`אין אירועי ${tabs.find(t => t.key === activeTab)?.label}`}
                  </p>
                  <p className="text-xs text-gray-600">המערכת מאזינה ותציג כאן אירועים בזמן אמת</p>
                </div>
              </div>
            ) : (
              <LiveFeedTab feedItems={filteredFeed} sourceFilter="all" />
            )}
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
