import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  CheckCircle, 
  Users, 
  Phone, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { PropertyStats } from '@/types/property';

interface AnalyticsSummaryCardProps {
  stats: PropertyStats;
}

export const AnalyticsSummaryCard: React.FC<AnalyticsSummaryCardProps> = ({ stats }) => {
  // Calculate occupancy rate
  const occupancyRate = stats.totalProperties > 0 
    ? Math.round((stats.confirmedOccupied / stats.totalProperties) * 100) 
    : 0;

  const statItems = [
    { label: 'תפוסים', value: stats.confirmedOccupied, icon: CheckCircle, color: 'text-green-600' },
    { label: 'פנויים', value: stats.confirmedVacant, icon: Users, color: 'text-orange-600' },
    { label: 'נוצר קשר', value: stats.contactedProperties, icon: Phone, color: 'text-blue-600' },
    { label: 'טרם קשר', value: stats.notContactedProperties, icon: Clock, color: 'text-purple-600' },
    { label: 'לא ידוע', value: stats.unknownStatus, icon: AlertTriangle, color: 'text-muted-foreground' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5 text-primary" />
          סיכום נכסים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-2">
          {statItems.map((item) => (
            <div key={item.label} className="text-center">
              <item.icon className={`h-4 w-4 mx-auto mb-1 ${item.color}`} />
              <div className="text-lg font-bold">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Occupancy Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">אחוז תפוסה</span>
            <span className="font-semibold">{occupancyRate}%</span>
          </div>
          <Progress value={occupancyRate} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};
