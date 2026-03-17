import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { History, Settings, Loader2, Square, TrendingUp, AlertTriangle, Info, ExternalLink } from 'lucide-react';

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
      <Card className={`rounded-2xl border border-border/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${isDisabled ? 'opacity-55' : ''}`}>
        <CardContent className="p-5 flex flex-col gap-1">
          {/* Header: icon + title ... toggle + status text */}
          <div className="flex items-center gap-2 mb-1">
            <span className="shrink-0">{icon}</span>
            <p className="text-sm font-semibold truncate flex-1">{title}</p>
            <span className={`text-[11px] ${st.color}`}>{st.label}</span>
            {onToggleEnabled && (
              <Switch
                checked={enabled}
                onCheckedChange={onToggleEnabled}
                disabled={isTogglePending}
                className="scale-[0.7]"
              />
            )}
          </div>

          {/* Center: big number + labels */}
          <div className="flex-1 flex flex-col items-center justify-center text-center py-4 gap-0.5">
            <p className="text-4xl font-bold leading-none tracking-tight">
              {typeof primaryValue === 'number' ? primaryValue.toLocaleString('he-IL') : primaryValue}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">{primaryLabel}</p>
            {secondaryLine && (
              <p className="text-[11px] text-muted-foreground/70 mt-1">{secondaryLine}</p>
            )}
            {insight && (
              <div className="flex items-center gap-1 mt-2">
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

          {/* Footer: divider + open link + icons */}
          <div className="flex items-center gap-2 pt-3 border-t border-border/30">
            {status === 'running' && onStop ? (
              <Button variant="ghost" size="sm" className="h-8 flex-1 text-xs gap-1.5 text-destructive hover:text-destructive" onClick={onStop} disabled={isStopPending}>
                {isStopPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3 w-3" />}
                עצור
              </Button>
            ) : onRun ? (
              <Button variant="ghost" size="sm" className="h-8 flex-1 text-xs gap-1.5" onClick={onRun} disabled={isRunPending || status === 'running' || isDisabled}>
                {isRunPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                הפעל
              </Button>
            ) : (
              <div className="flex-1" />
            )}
            <div className="flex items-center gap-0.5 mr-auto">
              {historyContent && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setHistoryOpen(true)}>
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
              {settingsContent && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSettingsOpen(true)}>
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
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
