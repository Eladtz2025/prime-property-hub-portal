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
    <div className="space-y-6 p-4 pb-20">
      {/* Header with greeting */}
      <div className="bg-gradient-primary rounded-3xl p-8 text-white shadow-elevated animate-fade-in overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/20"></div>
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/10"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">שלום! 👋</h1>
              <p className="text-white/90 text-base">ברוך הבא למערכת ניהול הנכסים</p>
            </div>
            <Button
              onClick={onAddProperty}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <Plus className="h-5 w-5 ml-2" />
              הוסף נכס
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Building className="h-5 w-5" />
                </div>
                <span className="text-base font-semibold">סה״כ נכסים</span>
              </div>
              <div className="text-3xl font-bold">{stats.totalProperties}</div>
            </div>
            
            <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-base font-semibold">הכנסה חודשית</span>
              </div>
              <div className="text-xl font-bold">
                ₪{properties
                  .filter(p => p.monthlyRent)
                  .reduce((sum, p) => sum + (p.monthlyRent || 0), 0)
                  .toLocaleString('he-IL')}
              </div>
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
      <div className="grid grid-cols-2 gap-4 animate-fade-in">
        <Card className="shadow-card hover:shadow-elevated transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700/80 mb-2 font-medium">תפוסים</p>
                <p className="text-2xl font-bold text-green-700">{stats.occupiedProperties}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700/80 mb-2 font-medium">פנויים</p>
                <p className="text-2xl font-bold text-orange-700">{stats.vacantProperties}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Properties */}
      <Card className="shadow-elevated animate-fade-in border-0 bg-white">
        <CardHeader className="pb-4 px-6 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">נכסים אחרונים</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:bg-primary/10">
              <a href="/properties" className="font-semibold">הצג הכל →</a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-6">
          {properties.slice(0, 3).map((property, index) => (
            <div 
              key={property.id}
              className="flex items-center justify-between p-4 bg-gradient-to-l from-gray-50/50 to-transparent rounded-xl hover:from-primary/5 hover:to-transparent transition-all duration-200 animate-fade-in border border-gray-100/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{property.address}</p>
                  <p className="text-xs text-gray-600">{property.ownerName}</p>
                </div>
              </div>
              <Badge 
                className={`text-xs font-semibold ${
                  property.status === 'occupied' 
                    ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                }`}
              >
                {property.status === 'occupied' ? 'תפוס' : 'פנוי'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-elevated animate-fade-in border-0 bg-white">
        <CardHeader className="pb-4 px-6 pt-6">
          <CardTitle className="text-lg font-bold">פעולות מהירות</CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              size="lg" 
              asChild 
              className="h-14 border-2 border-primary/20 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
            >
              <a href="/properties" className="flex flex-col gap-1">
                <Building className="h-5 w-5" />
                <span className="text-sm font-semibold">כל הנכסים</span>
              </a>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              asChild 
              className="h-14 border-2 border-primary/20 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
            >
              <a href="/alerts" className="flex flex-col gap-1">
                <Bell className="h-5 w-5" />
                <span className="text-sm font-semibold">התראות</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};