
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'gray';
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color }) => {
const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
    gray: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30'
  };

  return (
    <Card className="hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-transparent hover:border-l-primary group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colorClasses[color]} transition-all duration-300 group-hover:scale-110 shadow-sm`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground mb-1">
          {typeof value === 'number' ? value.toLocaleString('he-IL') : value}
        </div>
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-primary transition-all duration-500 group-hover:w-full w-0"></div>
        </div>
      </CardContent>
    </Card>
  );
};
