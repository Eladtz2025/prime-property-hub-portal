import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Phone, 
  Bell, 
  TrendingUp,
  MapPin,
  Plus
} from 'lucide-react';
import { Property, PropertyStats, Alert } from '../types/property';
import { AlertCard } from './AlertCard';
import { useMobileOptimization } from '../hooks/useMobileOptimization';

interface MobileDashboardProps {
  properties: Property[];
  stats: PropertyStats;
  alerts: Alert[];
  onAddProperty?: () => void;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({ 
  properties, 
  stats, 
  alerts,
  onAddProperty 
}) => {
  const { isMobile } = useMobileOptimization();
  const urgentAlerts = alerts.filter(alert => alert.priority === 'urgent');
  const highPriorityAlerts = alerts.filter(alert => alert.priority === 'high');

  if (!isMobile) {
    return null; // This component is only for mobile
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header with greeting */}
      <div className="bg-gradient-primary rounded-2xl p-6 text-white shadow-elevated animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">שלום! 👋</h1>
            <p className="text-white/80 text-sm">ברוך הבא למערכת ניהול הנכסים</p>
          </div>
          <Button
            onClick={onAddProperty}
            size="sm"
            variant="outline"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <Plus className="h-4 w-4 ml-1" />
            הוסף נכס
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Building className="h-4 w-4" />
              <span className="text-sm font-medium">סה״כ נכסים</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">הכנסה חודשית</span>
            </div>
            <div className="text-lg font-bold">
              ₪{properties
                .filter(p => p.monthlyRent)
                .reduce((sum, p) => sum + (p.monthlyRent || 0), 0)
                .toLocaleString('he-IL')}
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Alerts */}
      {urgentAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50 animate-scale-in">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-600 text-base">
              <AlertTriangle className="h-4 w-4" />
              התראות דחופות ({urgentAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {urgentAlerts.slice(0, 2).map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
            {urgentAlerts.length > 2 && (
              <Button variant="outline" size="sm" className="w-full text-xs">
                הצג עוד {urgentAlerts.length - 2}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in">
        <Card className="shadow-card hover:shadow-elevated transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">תפוסים</p>
                <p className="text-xl font-bold text-green-600">{stats.occupiedProperties}</p>
              </div>
              <div className="bg-gradient-success p-2 rounded-full">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">פנויים</p>
                <p className="text-xl font-bold text-orange-600">{stats.vacantProperties}</p>
              </div>
              <div className="bg-gradient-warning p-2 rounded-full">
                <Users className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Properties */}
      <Card className="shadow-card animate-fade-in">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">נכסים אחרונים</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <a href="/properties" className="text-primary text-xs">הצג הכל</a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {properties.slice(0, 3).map((property, index) => (
            <div 
              key={property.id}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-gradient-info p-2 rounded-full">
                  <MapPin className="h-3 w-3 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">{property.address}</p>
                  <p className="text-xs text-muted-foreground">{property.ownerName}</p>
                </div>
              </div>
              <Badge 
                variant="outline"
                className={`text-xs ${
                  property.status === 'occupied' 
                    ? 'border-green-200 text-green-700 bg-green-50' 
                    : 'border-orange-200 text-orange-700 bg-orange-50'
                }`}
              >
                {property.status === 'occupied' ? 'תפוס' : 'פנוי'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-card animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">פעולות מהירות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" asChild className="h-12">
              <a href="/properties">
                <Building className="h-4 w-4 ml-1" />
                כל הנכסים
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild className="h-12">
              <a href="/alerts">
                <Bell className="h-4 w-4 ml-1" />
                התראות
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};