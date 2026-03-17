import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Play, History, Settings, Loader2, Square, TrendingUp, AlertTriangle, Info } from 'lucide-react';

export interface ProcessCardProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  status: 'running' | 'completed' | 'idle' | 'failed';
  primaryValue: number | string;
  primaryLabel: string;
  secondaryLine?: string;
  insight?: string;
  insightType?: 'ok' | 'warning' | 'info';
  lastRun?: string;
  onRun?: () => void;
  onStop?: () => void;
  isRunPending?: boolean;
  isStopPending?: boolean;
  historyContent?: React.ReactNode;
  settingsContent?: React.ReactNode;
  historyTitle?: string;
  settingsTitle?: string;
  enabled?: boolean;
  onToggleEnabled?: (enabled: boolean) => void;
  isTogglePending?: boolean;
}

const statusConfig = (status: string, enabled: boolean) => {
  if (!enabled) return { label: 'מושבת', bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted-foreground/20' };
  switch (status) {
    case 'running': return { label: 'בתהליך', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-400/40' };
    case 'completed': return { label: 'פעיל', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-400/40' };
    case 'failed': return { label: 'תקלה', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-400/40' };
    default: return { label: 'ממתין', bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted-foreground/20' };
  }
};

const insightIcon = (type: 'ok' | 'warning' | 'info') => {
  switch (type) {
    case 'ok': return <TrendingUp className="h-3 w-3 text-green-500" />;
    case 'warning': return <AlertTriangle className="h-3 w-3 text-amber-500" />;
    case 'info': return <Info className="h-3 w-3 text-blue-500" />;
  }
};

export const ProcessCard: React.FC<ProcessCardProps> = ({
  title,
  icon,
  iconColor,
  status,
  primaryValue,
  primaryLabel,
  secondaryLine,
  insight,
  insightType = 'info',
  lastRun,
  onRun,
  onStop,
  isRunPending,
  isStopPending,
  historyContent,
  settingsContent,
  historyTitle,
  settingsTitle,
  enabled = true,
  onToggleEnabled,
  isTogglePending,
}) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isDisabled = enabled === false;
  const st = statusConfig(status, enabled);

  return (
    <>
      <Card className={`min-h-[220px] rounded-2xl border-t-2 ${st.border} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${isDisabled ? 'opacity-60' : ''}`}>
        <CardContent className="p-5 h-full flex flex-col justify-between gap-3">
          {/* Header: icon + title + badge + toggle */}
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
              {icon}
            </div>
            <p className="text-sm font-semibold truncate flex-1">{title}</p>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${st.bg} ${st.text}`}>
              {status === 'running' && enabled && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
              {st.label}
            </span>
            {onToggleEnabled && (
              <Switch
                checked={enabled}
                onCheckedChange={onToggleEnabled}
                disabled={isTogglePending}
                className="scale-75"
              />
            )}
          </div>

          {/* Center: primary number + label + secondary + insight */}
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-0.5">
            <p className="text-3xl font-bold leading-none">
              {typeof primaryValue === 'number' ? primaryValue.toLocaleString('he-IL') : primaryValue}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{primaryLabel}</p>
            {secondaryLine && (
              <p className="text-[10px] text-muted-foreground/70 mt-1">{secondaryLine}</p>
            )}
            {insight && (
              <div className="flex items-center gap-1 mt-1.5">
                {insightIcon(insightType)}
                <span className={`text-[10px] font-medium ${insightType === 'ok' ? 'text-green-600 dark:text-green-400' : insightType === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {insight}
                </span>
              </div>
            )}
          </div>

          {/* Footer: primary action + secondary icon buttons */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {status === 'running' && onStop ? (
              <Button variant="destructive" size="sm" className="h-9 flex-1 text-xs gap-1.5" onClick={onStop} disabled={isStopPending}>
                {isStopPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
                עצור
              </Button>
            ) : onRun ? (
              <Button size="sm" className="h-9 flex-1 text-xs gap-1.5" onClick={onRun} disabled={isRunPending || status === 'running' || isDisabled}>
                {isRunPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                הפעל
              </Button>
            ) : null}
            {historyContent && (
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setHistoryOpen(true)}>
                <History className="h-4 w-4" />
              </Button>
            )}
            {settingsContent && (
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setSettingsOpen(true)}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History Dialog */}
      {historyContent && (
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>{historyTitle || `היסטוריה — ${title}`}</DialogTitle>
            </DialogHeader>
            {historyContent}
          </DialogContent>
        </Dialog>
      )}

      {/* Settings Dialog */}
      {settingsContent && (
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>{settingsTitle || `הגדרות — ${title}`}</DialogTitle>
            </DialogHeader>
            {settingsContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
