
import React from 'react';
import { Button } from "@/components/ui/button";
import { Alert } from '../types/property';
import { AlertTriangle, Clock, CheckCircle, X } from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const priorityIcons = {
    urgent: AlertTriangle,
    high: Clock,
    medium: CheckCircle,
    low: CheckCircle
  };

  const priorityColors = {
    urgent: 'text-red-600 bg-red-100',
    high: 'text-orange-600 bg-orange-100',
    medium: 'text-yellow-600 bg-yellow-100',
    low: 'text-green-600 bg-green-100'
  };

  const Icon = priorityIcons[alert.priority];

  return (
    <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${priorityColors[alert.priority]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="font-medium">{alert.message}</div>
          <div className="text-sm text-muted-foreground">{alert.message}</div>
          <div className="text-xs text-muted-foreground mt-1">
            תאריך יעד: {new Date(alert.dueDate).toLocaleDateString('he-IL')}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          טופל
        </Button>
        <Button variant="ghost" size="sm">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
