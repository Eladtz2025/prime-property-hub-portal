import React, { useRef, useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, Clock, AlertTriangle,
  Search, Shield, Database, Copy, ArrowDown, Home, Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { FeedItem } from './useMonitorData';

const typeConfig = {
  availability: { icon: Shield, label: 'זמינות', bgClass: 'bg-blue-950/30 border-r-2 border-r-blue-500/40' },
  scan: { icon: Search, label: 'סריקה', bgClass: 'bg-orange-950/30 border-r-2 border-r-orange-500/40' },
  backfill: { icon: Database, label: 'השלמה', bgClass: 'bg-emerald-950/30 border-r-2 border-r-emerald-500/40' },
  dedup: { icon: Copy, label: 'כפילויות', bgClass: 'bg-purple-950/30 border-r-2 border-r-purple-500/40' },
  matching: { icon: Search, label: 'התאמות', bgClass: 'bg-green-950/30 border-r-2 border-r-green-500/40' },
};

const eventKindBadge = (kind?: string) => {
  const map: Record<string, { text: string; cls: string }> = {
    found: { text: 'FOUND', cls: 'bg-emerald-500/20 text-emerald-400' },
    matched: { text: 'MATCH', cls: 'bg-blue-500/20 text-blue-400' },
    timeout: { text: 'TIMEOUT', cls: 'bg-yellow-500/20 text-yellow-400' },
    pushed: { text: 'PUSH', cls: 'bg-teal-500/20 text-teal-400' },
    skipped: { text: 'SKIP', cls: 'bg-gray-500/20 text-gray-400' },
    checked: { text: 'CHECK', cls: 'bg-blue-500/20 text-blue-300' },
    inactive: { text: 'REMOVED', cls: 'bg-red-500/20 text-red-400' },
    error: { text: 'ERROR', cls: 'bg-red-500/20 text-red-400' },
  };
  if (!kind) return null;
  const m = map[kind];
  if (!m) return null;
  return <span className={`${m.cls} text-[10px] font-mono font-bold px-1.5 py-0.5 rounded`}>{m.text}</span>;
};

const statusIcon = (s: FeedItem['status']) => {
  switch (s) {
    case 'ok': return <CheckCircle className="h-4 w-4 text-green-400" />;
    case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    case 'pending': return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const sourceBadge = (source?: string) => {
  const map: Record<string, { text: string; cls: string }> = {
    yad2: { text: 'YAD2', cls: 'text-orange-400 bg-orange-400/10' },
    madlan: { text: 'MDLN', cls: 'text-blue-400 bg-blue-400/10' },
    homeless: { text: 'HMLS', cls: 'text-purple-400 bg-purple-400/10' },
  };
  const s = map[source?.toLowerCase() || ''];
  if (!s) return null;
  return <span className={`${s.cls} font-mono text-[11px] font-bold px-1.5 py-0.5 rounded`}>{s.text}</span>;
};

const PropertyBadges: React.FC<{ extra?: FeedItem['extra'] }> = ({ extra }) => {
  if (!extra) return null;
  const badges: React.ReactNode[] = [];

  if (extra.is_private !== undefined) {
    badges.push(
      extra.is_private
        ? <span key="prv" className="text-xs font-medium px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 flex items-center gap-0.5"><Home className="h-3 w-3" />פרטי</span>
        : <span key="brk" className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 flex items-center gap-0.5"><Building2 className="h-3 w-3" />תיווך</span>
    );
  }
  if (extra.price) {
    badges.push(<span key="pr" className="text-[11px] text-gray-300 font-mono px-1.5 py-0.5 rounded bg-white/[0.04]">₪{(extra.price / 1000).toFixed(0)}K</span>);
  }
  if (extra.rooms) {
    badges.push(<span key="rm" className="text-[11px] text-gray-400 px-1.5 py-0.5 rounded bg-white/[0.04]">{extra.rooms} חד׳</span>);
  }
  if (extra.floor !== undefined && extra.floor !== null) {
    badges.push(<span key="fl" className="text-[11px] text-gray-500 px-1.5 py-0.5 rounded bg-white/[0.04]">ק׳ {extra.floor}</span>);
  }

  if (badges.length === 0) return null;
  return <>{badges}</>;
};

interface LiveFeedTabProps {
  feedItems: FeedItem[];
  sourceFilter: string;
}

export const LiveFeedTab: React.FC<LiveFeedTabProps> = ({ feedItems, sourceFilter }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [prevLength, setPrevLength] = useState(0);

  // Filter by source
  const filtered = sourceFilter === 'all'
    ? feedItems
    : sourceFilter === 'errors'
      ? feedItems.filter(f => f.status === 'error')
      : feedItems.filter(f =>
          f.source?.toLowerCase() === sourceFilter ||
          (sourceFilter === 'avail' && f.type === 'availability')
        );

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && scrollRef.current && filtered.length > prevLength) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    setPrevLength(filtered.length);
  }, [filtered.length, autoScroll]);

  // Detect manual scroll-up
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    setAutoScroll(isAtBottom);
  };

  return (
    <div className="relative h-full">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-thin"
        dir="rtl"
      >
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600">
            <div className="text-center space-y-1">
              <Shield className="h-6 w-6 mx-auto opacity-30" />
              <p className="text-xs">ממתין לפעילות...</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {filtered.map((item, i) => {
              const cfg = typeConfig[item.type];
              const Icon = cfg.icon;
              const isLast = i === filtered.length - 1;
              const hasPropertyBadges = item.extra && (item.extra.price || item.extra.rooms || item.extra.neighborhood || item.extra.is_private !== undefined || item.extra.floor !== undefined);

              return (
                <div
                  key={`${item.type}-${i}`}
                  className={`${cfg.bgClass} ${isLast ? 'animate-in fade-in-50 slide-in-from-bottom-1 duration-300' : ''} transition-colors hover:bg-white/[0.03]`}
                >
                  {/* Desktop: row 1 — time, icon, status, eventKind, primary text, source */}
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 pb-0.5">
                    <span className="text-[10px] text-gray-600 font-mono shrink-0 w-[52px]" dir="ltr">
                      {item.timestamp ? format(new Date(item.timestamp), 'HH:mm:ss') : '--:--:--'}
                    </span>
                    <Icon className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                    <span className="shrink-0">{statusIcon(item.status)}</span>
                    {item.eventKind && <span className="shrink-0">{eventKindBadge(item.eventKind)}</span>}
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-200 flex-1 truncate font-medium hover:text-white transition-colors" onClick={e => e.stopPropagation()}>
                        {item.primary}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-200 flex-1 truncate font-medium">{item.primary}</span>
                    )}
                    {item.source && <span className="shrink-0">{sourceBadge(item.source)}</span>}
                  </div>
                  {/* Desktop: row 2 — property badges + details text */}
                  <div className="hidden md:flex items-center gap-2 px-3 pb-1.5 pr-[60px] flex-wrap">
                    <PropertyBadges extra={item.extra} />
                    {item.details && <span className="text-[11px] text-gray-500 truncate">{item.details}</span>}
                  </div>

                  {/* Mobile: two rows */}
                  <div className="md:hidden px-3 py-1.5 space-y-1">
                    <div className="flex items-center gap-1.5">
                      {item.source && <span className="shrink-0">{sourceBadge(item.source)}</span>}
                      {item.eventKind && <span className="shrink-0">{eventKindBadge(item.eventKind)}</span>}
                      <span className="shrink-0">{statusIcon(item.status)}</span>
                      <span className="flex-1" />
                      <span className="text-[10px] text-gray-600 font-mono shrink-0" dir="ltr">
                        {item.timestamp ? format(new Date(item.timestamp), 'HH:mm:ss') : '--:--:--'}
                      </span>
                    </div>
                    <div>
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-gray-200 font-medium hover:text-white transition-colors line-clamp-1" onClick={e => e.stopPropagation()}>
                          {item.primary}
                        </a>
                      ) : (
                        <span className="text-[12px] text-gray-200 font-medium line-clamp-1">{item.primary}</span>
                      )}
                      {hasPropertyBadges && (
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                          <PropertyBadges extra={item.extra} />
                        </div>
                      )}
                      {item.details && <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{item.details}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scroll-to-bottom button */}
      {!autoScroll && filtered.length > 10 && (
        <button
          onClick={() => {
            setAutoScroll(true);
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-gray-800/90 border border-white/10 text-gray-300 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-gray-700/90 transition-colors backdrop-blur-sm shadow-lg"
        >
          <ArrowDown className="h-3 w-3" />
          חזור למטה
        </button>
      )}
    </div>
  );
};
