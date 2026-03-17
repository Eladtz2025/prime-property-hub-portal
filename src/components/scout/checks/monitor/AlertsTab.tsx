import React from 'react';
import { AlertTriangle, XCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { MonitorAlert } from './useMonitorData';

const severityConfig = {
  error: { icon: XCircle, border: 'border-r-red-500', bg: 'bg-red-950/20', text: 'text-red-400', label: 'קריטי' },
  warning: { icon: AlertTriangle, border: 'border-r-yellow-500', bg: 'bg-yellow-950/20', text: 'text-yellow-400', label: 'אזהרה' },
  info: { icon: Info, border: 'border-r-blue-500', bg: 'bg-blue-950/20', text: 'text-blue-400', label: 'מידע' },
};

interface AlertsTabProps {
  alerts: MonitorAlert[];
}

export const AlertsTab: React.FC<AlertsTabProps> = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600" dir="rtl">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <span className="text-lg">✓</span>
          </div>
          <p className="text-sm text-gray-400">הכל תקין — אין חריגות</p>
        </div>
      </div>
    );
  }

  // Sort: errors first, then warnings, then info
  const sorted = [...alerts].sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="h-full overflow-y-auto p-3 space-y-2" dir="rtl">
      {sorted.map(alert => {
        const cfg = severityConfig[alert.severity];
        const Icon = cfg.icon;
        return (
          <div
            key={alert.id}
            className={`${cfg.bg} border-r-2 ${cfg.border} rounded-lg p-3 transition-colors`}
          >
            <div className="flex items-start gap-2">
              <Icon className={`h-4 w-4 ${cfg.text} mt-0.5 shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-sm font-medium ${cfg.text}`}>{alert.title}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text} border border-current/20`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{alert.description}</p>
                <span className="text-[10px] text-gray-600 font-mono mt-1 block" dir="ltr">
                  {format(new Date(alert.timestamp), 'HH:mm:ss')}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
