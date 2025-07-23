import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';

interface AlertListCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  color: string;
  items: Array<{
    title: string;
    subtitle: string;
  }>;
}

export const AlertListCard: React.FC<AlertListCardProps> = ({ 
  title, 
  count, 
  icon: Icon, 
  color, 
  items 
}) => {
  const colorClasses = {
    red: 'text-red-600 bg-red-100',
    orange: 'text-orange-600 bg-orange-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
  };

  const getColorClass = (color: string) => {
    return colorClasses[color as keyof typeof colorClasses] || 'text-gray-600 bg-gray-100';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getColorClass(color)}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{count}</div>
        {items.length > 0 && (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {items.slice(0, 3).map((item, index) => (
              <div key={index} className="text-xs">
                <div className="font-medium">{item.title}</div>
                <div className="text-muted-foreground">{item.subtitle}</div>
              </div>
            ))}
            {items.length > 3 && (
              <div className="text-xs text-muted-foreground">
                ועוד {items.length - 3} נוספים...
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};