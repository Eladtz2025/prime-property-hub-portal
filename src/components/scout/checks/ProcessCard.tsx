import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Play, History, Settings, Loader2, Square } from 'lucide-react';

export interface ProcessCardMetric {
  label: string;
  value: string | number;
}

export interface ProcessCardProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  status: 'running' | 'completed' | 'idle' | 'failed';
  statusText: string;
  metrics: ProcessCardMetric[];
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

const statusIndicator = (status: string) => {
  switch (status) {
    case 'running':
      return (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
        </span>
      );
    case 'completed':
      return <span className="inline-flex rounded-full h-2 w-2 bg-green-500" />;
    case 'failed':
      return <span className="inline-flex rounded-full h-2 w-2 bg-red-500" />;
    default:
      return <span className="inline-flex rounded-full h-2 w-2 bg-muted-foreground/40" />;
  }
};

export const ProcessCard: React.FC<ProcessCardProps> = ({
  title,
  icon,
  iconColor,
  status,
  statusText,
  metrics,
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

  return (
    <>
      <Card className={`h-full ${isDisabled ? 'opacity-60' : ''}`}>
        <CardContent className="p-3 space-y-2.5">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${iconColor}`}>
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{title}</p>
            </div>
            {onToggleEnabled && (
              <Switch
                checked={enabled}
                onCheckedChange={onToggleEnabled}
                disabled={isTogglePending}
                className="scale-75"
              />
            )}
            {statusIndicator(isDisabled ? 'idle' : status)}
          </div>

          {/* Status */}
          <p className="text-[11px] text-muted-foreground">
            {isDisabled ? 'מושבת' : statusText}
          </p>

          {/* Metrics */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {metrics.map((m, i) => (
              <div key={i} className="text-[10px]">
                <span className="text-muted-foreground">{m.label}: </span>
                <span className="font-medium">{typeof m.value === 'number' ? m.value.toLocaleString('he-IL') : m.value}</span>
              </div>
            ))}
          </div>

          {/* Last run */}
          {lastRun && (
            <p className="text-[10px] text-muted-foreground">ריצה אחרונה: {lastRun}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 pt-1 border-t">
            {status === 'running' && onStop ? (
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 flex-1" onClick={onStop} disabled={isStopPending}>
                {isStopPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Square className="h-3 w-3" />}
                עצור
              </Button>
            ) : onRun ? (
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 flex-1" onClick={onRun} disabled={isRunPending || status === 'running' || isDisabled}>
                {isRunPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                הפעל
              </Button>
            ) : null}
            {historyContent && (
              <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setHistoryOpen(true)}>
                <History className="h-3 w-3" />
                היסטוריה
              </Button>
            )}
            {settingsContent && (
              <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setSettingsOpen(true)}>
                <Settings className="h-3 w-3" />
                הגדרות
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
