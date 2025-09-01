import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  
  // Manual monthly income state
  const [manualMonthlyIncome, setManualMonthlyIncome] = useState<number | null>(null);
  
  // Load saved manual income from localStorage
  useEffect(() => {
    const savedIncome = localStorage.getItem('manualMonthlyIncome');
    if (savedIncome) {
      setManualMonthlyIncome(Number(savedIncome));
    }
  }, []);
  
  // Memoized calculations for performance
  const urgentAlerts = useMemo(() => alerts.filter(alert => alert.priority === 'urgent'), [alerts]);
  const highPriorityAlerts = useMemo(() => alerts.filter(alert => alert.priority === 'high'), [alerts]);
  
  // Calculate monthly income only once and memoize it
  const displayIncome = useMemo(() => {
    if (manualMonthlyIncome !== null) {
      return manualMonthlyIncome;
    }
    
    // Calculate from actual property data
    const autoCalculatedIncome = properties
      .filter(p => p.monthlyRent && p.monthlyRent > 0)
      .reduce((sum, p) => sum + (p.monthlyRent || 0), 0);
    
    // If no rent data available, show a placeholder
    return autoCalculatedIncome > 0 ? autoCalculatedIncome : 15000;
  }, [properties, manualMonthlyIncome]);

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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">שלום! 👋</h1>
              <p className="text-white/90 text-sm">ברוך הבא למערכת ניהול הנכסים</p>
            </div>
            <Button
              onClick={onAddProperty}
              size="sm"
              className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 px-4 py-2"
            >
              <Plus className="h-4 w-4 ml-1" />
              הוסף נכס
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <Building className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">סה״כ נכסים</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
            </div>
            
            <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">הכנסה חודשית</span>
              </div>
              <div className="text-2xl font-bold">
                ₪{displayIncome.toLocaleString('he-IL')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Alerts */}
      {urgentAlerts.length > 0 && (
        <Card className="border-red-200/60 bg-red-50/80 animate-scale-in backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700 text-base">
              <AlertTriangle className="h-4 w-4" />
              התראות דחופות ({urgentAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentAlerts.slice(0, 2).map((alert) => (
              <div key={alert.id} className="bg-white/60 rounded-lg p-3 border border-red-100">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-red-800">{alert.message}</div>
                    <div className="text-xs text-red-600 mt-1">
                      {alert.propertyAddress} • {alert.ownerName}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {urgentAlerts.length > 2 && (
              <Button variant="outline" size="sm" className="w-full text-xs border-red-200 text-red-700 hover:bg-red-50">
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
                <p className="text-2xl font-bold text-green-700">{stats.confirmedOccupied}</p>
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
                <p className="text-2xl font-bold text-orange-700">{stats.confirmedVacant}</p>
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
              <Link to="/properties" className="font-semibold">הצג הכל →</Link>
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
                    : property.status === 'vacant'
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {property.status === 'occupied' ? 'תפוס' : property.status === 'vacant' ? 'פנוי' : 'לא ידוע'}
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
              <Link to="/properties" className="flex flex-col gap-1">
                <Building className="h-5 w-5" />
                <span className="text-sm font-semibold">כל הנכסים</span>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              asChild 
              className="h-14 border-2 border-primary/20 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
            >
              <Link to="/alerts" className="flex flex-col gap-1">
                <Bell className="h-5 w-5" />
                <span className="text-sm font-semibold">התראות</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};