import React, { useState } from 'react';
import { Monitor, Loader2, Radio, GitBranch, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { useMonitorData } from './monitor/useMonitorData';
import { LiveFeedTab } from './monitor/LiveFeedTab';
import { PipelineTab } from './monitor/PipelineTab';
import { AlertsTab } from './monitor/AlertsTab';
import { IntelligenceRail } from './monitor/IntelligenceRail';

type MonitorTab = 'feed' | 'pipeline' | 'alerts';

const sourceFilters = [
  { key: 'all', label: 'All' },
  { key: 'yad2', label: 'YAD2' },
  { key: 'homeless', label: 'HMLS' },
  { key: 'madlan', label: 'MDLN' },
  { key: 'avail', label: 'Avail' },
  { key: 'errors', label: 'Errors' },
];

export const LiveMonitor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MonitorTab>('feed');
  const [sourceFilter, setSourceFilter] = useState('all');

  const {
    feedItems,
    activeProcesses,
    pipelineStages,
    alerts,
    intelligence,
    hasActivity,
    lastEventTime,
  } = useMonitorData();

  const errorAlerts = alerts.filter(a => a.severity === 'error').length;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gray-950/95 backdrop-blur-sm overflow-hidden shadow-2xl">
      {/* ── Control Bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05] bg-gray-900/80">
        {/* Right: Title + Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-200">מוניטור חי</span>
          </div>
          {hasActivity ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-gray-700" />
          )}
          {lastEventTime && (
            <span className="text-[10px] text-gray-500 font-mono" dir="ltr">
              {format(new Date(lastEventTime), 'HH:mm:ss')}
            </span>
          )}
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            errorAlerts > 0
              ? 'bg-red-500/15 text-red-400'
              : hasActivity
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-gray-800 text-gray-500'
          }`}>
            {errorAlerts > 0 ? `${errorAlerts} חריגות` : hasActivity ? 'System OK' : 'Idle'}
          </span>
        </div>

        {/* Center: Tabs */}
        <div className="flex items-center gap-1 bg-gray-800/60 rounded-lg p-0.5">
          {([
            { key: 'feed' as MonitorTab, label: 'Live Feed', icon: Radio },
            { key: 'pipeline' as MonitorTab, label: 'Pipeline', icon: GitBranch },
            { key: 'alerts' as MonitorTab, label: 'Alerts', icon: AlertTriangle, badge: errorAlerts },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-gray-700/80 text-white shadow-sm shadow-white/5'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/40'
              }`}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Left: Source filters (only for feed tab) */}
        <div className="flex items-center gap-1">
          {activeTab === 'feed' && sourceFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setSourceFilter(f.key)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                sourceFilter === f.key
                  ? 'bg-gray-700/70 text-white'
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active processes bar ── */}
      {activeProcesses.length > 0 && (
        <div className="px-4 py-2 space-y-1.5 border-b border-white/[0.03] bg-gray-900/40">
          {activeProcesses.map((proc, i) => (
            <div key={i} className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
              <span className="text-xs text-gray-300 flex-1 truncate">{proc.label}</span>
              <span className="text-[10px] text-gray-500 font-mono">{proc.elapsed}</span>
              {proc.progress !== undefined && (
                <div className="w-20">
                  <Progress value={proc.progress} className="h-1 [&>div]:bg-emerald-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Main content: Tab + Intelligence Rail ── */}
      <div className="flex" style={{ height: '360px' }}>
        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'feed' && (
            <LiveFeedTab feedItems={feedItems} sourceFilter={sourceFilter} />
          )}
          {activeTab === 'pipeline' && (
            <PipelineTab stages={pipelineStages} />
          )}
          {activeTab === 'alerts' && (
            <AlertsTab alerts={alerts} />
          )}
        </div>

        {/* Intelligence Rail */}
        <IntelligenceRail
          throughput={intelligence.throughput}
          avgLatency={intelligence.avgLatency}
          timeoutRate={intelligence.timeoutRate}
          activeSources={intelligence.activeSources}
          hasAlerts={intelligence.hasAlerts}
          sparkline={intelligence.sparkline}
        />
      </div>

      {/* ── Footer ── */}
      {feedItems.length > 0 && (
        <div className="px-4 py-1.5 border-t border-white/[0.04] bg-gray-900/40 flex items-center gap-4 text-[10px] text-gray-500">
          <span>{feedItems.length} אירועים</span>
          <span className="text-emerald-400/70">✓ {feedItems.filter(f => f.status === 'ok').length}</span>
          <span className="text-red-400/70">✗ {feedItems.filter(f => f.status === 'error').length}</span>
          <span className="text-yellow-400/70">⚠ {feedItems.filter(f => f.status === 'warning').length}</span>
        </div>
      )}
    </div>
  );
};
