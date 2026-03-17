import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { History, Settings, Loader2, Pause, Play, TrendingUp, AlertTriangle, Info } from 'lucide-react';

export interface ProcessCardProps {
  title: string;
  icon: React.ReactNode;
  iconColor?: string;
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

const statusText = (status: string, enabled: boolean) => {
  if (!enabled) return { label: 'מושבת', color: 'text-muted-foreground' };
  switch (status) {
    case 'running': return { label: 'פעיל', color: 'text-blue-600 dark:text-blue-400' };
    case 'completed': return { label: 'פעיל', color: 'text-green-600 dark:text-green-400' };
    case 'failed': return { label: 'תקלה', color: 'text-destructive' };
    default: return { label: 'ממתין', color: 'text-muted-foreground' };
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
  const st = statusText(status, enabled);

  return (
    <>
      <Card className={`rounded-2xl border border-border/40 transition-shadow duration-200 hover:shadow-sm ${isDisabled ? 'opacity-55' : ''}`}>
        <CardContent className="p-3.5 flex flex-col gap-0">
          {/* Header: icon + title + status + toggle */}
          <div className="flex items-center gap-2">
            <span className="shrink-0">{icon}</span>
            <p className="text-sm font-semibold truncate flex-1">{title}</p>
            <span className={`text-[11px] ${st.color}`}>{st.label}</span>
          </div>

          {/* Center: compact metric */}
          <div className="flex-1 flex flex-col items-center justify-center text-center py-2 gap-0">
            <p className="text-3xl font-bold leading-none tracking-tight">
              {typeof primaryValue === 'number' ? primaryValue.toLocaleString('he-IL') : primaryValue}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{primaryLabel}</p>
            {secondaryLine && (
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{secondaryLine}</p>
            )}
            {insight && (
              <div className="flex items-center gap-1 mt-1">
                {insightIcon(insightType)}
                <span className={`text-[11px] font-medium ${
                  insightType === 'ok' ? 'text-green-600 dark:text-green-400' 
                  : insightType === 'warning' ? 'text-amber-600 dark:text-amber-400' 
                  : 'text-muted-foreground'
                }`}>
                  {insight}
                </span>
              </div>
            )}
          </div>

          {/* Thin footer */}
          <div className="flex items-center gap-1 pt-2 border-t border-border/30 relative">
            <div className="flex-1 flex justify-center">
              {status === 'running' && onStop ? (
                <button
                  className="bg-muted text-muted-foreground rounded-md px-4 py-1 text-[11px] font-medium flex items-center gap-1 hover:bg-muted/80 disabled:opacity-50 transition-colors"
                  onClick={onStop}
                  disabled={isStopPending}
                >
                  {isStopPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pause className="h-2.5 w-2.5" />}
                  השהה
                </button>
              ) : onRun ? (
                <button
                  className="bg-primary text-primary-foreground rounded-md px-4 py-1 text-[11px] font-medium flex items-center gap-1 hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  onClick={onRun}
                  disabled={isRunPending || status === 'running' || isDisabled}
                >
                  {isRunPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-2.5 w-2.5" />}
                  הפעל
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-0 absolute left-0">
              {historyContent && (
                <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50" onClick={() => setHistoryOpen(true)}>
                  <History className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
              {settingsContent && (
                <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50" onClick={() => setSettingsOpen(true)}>
                  <Settings className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
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
