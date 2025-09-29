import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Plus,
  Edit3,
  Check,
  X
} from 'lucide-react';
import { Property, PropertyStats, Alert } from '../types/property';
import { AlertCard } from './AlertCard';
import { useMobileOptimization } from '../hooks/useMobileOptimization';
import { useAuth } from '@/contexts/AuthContext';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

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
  const { profile } = useAuth();
  const { trigger } = useHapticFeedback();
  
  // Extract user's name for greeting
  const getUserName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0]; // Get first name
    }
    if (profile?.email) {
      return profile.email.split('@')[0]; // Get part before @
    }
    return '';
  };
  
  const userName = getUserName();
  
  // Manual monthly income state
  const [manualMonthlyIncome, setManualMonthlyIncome] = useState<number | null>(null);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [editIncomeValue, setEditIncomeValue] = useState('');
  
  // Load saved manual income from localStorage
  useEffect(() => {
    const savedIncome = localStorage.getItem('manualMonthlyIncome');
    if (savedIncome) {
      setManualMonthlyIncome(Number(savedIncome));
    }
  }, []);
  
  // Handle income editing
  const handleEditIncome = () => {
    setEditIncomeValue(displayIncome.toString());
    setIsEditingIncome(true);
  };
  
  const handleSaveIncome = () => {
    const newIncome = Number(editIncomeValue);
    if (!isNaN(newIncome) && newIncome >= 0) {
      setManualMonthlyIncome(newIncome);
      localStorage.setItem('manualMonthlyIncome', newIncome.toString());
    }
    setIsEditingIncome(false);
  };
  
  const handleCancelEdit = () => {
    setIsEditingIncome(false);
    setEditIncomeValue('');
  };
  
  // Memoized calculations for performance
  const urgentAlerts = useMemo(() => alerts.filter(alert => alert.priority === 'urgent'), [alerts]);
  const highPriorityAlerts = useMemo(() => alerts.filter(alert => alert.priority === 'high'), [alerts]);
  
  // Calculate monthly income only once and memoize it
  const displayIncome = useMemo(() => {
    if (manualMonthlyIncome !== null) {
      return manualMonthlyIncome;
    }
    
    // Calculate from actual property data - only occupied properties
    const autoCalculatedIncome = properties
      .filter(p => p.status === 'occupied' && p.monthlyRent && p.monthlyRent > 0)
      .reduce((sum, p) => sum + (p.monthlyRent || 0), 0);
    
    // If no rent data available, don't show a placeholder
    return autoCalculatedIncome;
  }, [properties, manualMonthlyIncome]);

  if (!isMobile) {
    return null; // This component is only for mobile
  }

  console.log('MobileDashboard rendering:', { propertiesCount: properties.length, stats });
  
  return (
    <div className="w-full min-h-screen bg-background pb-20">
      <div className="space-y-6 px-4 py-6 max-w-lg mx-auto">
        {/* Header with greeting */}
        <div className="bg-gradient-primary rounded-2xl p-6 text-white shadow-elevated animate-fade-in overflow-hidden relative isolate">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/20"></div>
            <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/10"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold mb-2 leading-tight">
                  שלום{userName ? ` ${userName}` : ''}! 👋
                </h1>
                <p className="text-white/90 text-lg leading-relaxed">ברוך הבא למערכת ניהול הנכסים</p>
              </div>
              <Button
                onClick={() => {
                  trigger('light');
                  onAddProperty?.();
                }}
                size="sm"
                className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 px-3 py-2 flex-shrink-0 btn-enhanced-contrast touch-target"
                aria-label="הוסף נכס חדש למערכת"
              >
                <Plus className="h-4 w-4 ml-1" />
                הוסף נכס
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-white/20 p-1.5 rounded-lg flex-shrink-0">
                    <Building className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold truncate">סה״כ נכסים</span>
                </div>
                <div className="text-3xl font-bold number-display">{stats.totalProperties}</div>
              </div>
              
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-white/20 p-1.5 rounded-lg flex-shrink-0">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold truncate">הכנסה חודשית</span>
                  {!isEditingIncome && (
                    <Button
                      onClick={handleEditIncome}
                      size="sm"
                      variant="ghost"
                      className="bg-white/10 hover:bg-white/20 text-white p-1 h-6 w-6 ml-auto flex-shrink-0"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {isEditingIncome ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={editIncomeValue}
                      onChange={(e) => setEditIncomeValue(e.target.value)}
                      placeholder="הכנסה חודשית"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/70 text-sm h-8 flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveIncome();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <Button
                      onClick={handleSaveIncome}
                      size="sm"
                      variant="ghost"
                      className="bg-white/10 hover:bg-white/20 text-white p-1 h-8 w-8 flex-shrink-0"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      size="sm"
                      variant="ghost"
                      className="bg-white/10 hover:bg-white/20 text-white p-1 h-8 w-8 flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-3xl font-bold number-display">
                    {displayIncome > 0 ? `₪${displayIncome.toLocaleString('he-IL')}` : 'לא חושב'}
                  </div>
                )}
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
              <div key={alert.id} className="bg-white/60 rounded-lg p-3 border border-red-100 overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="font-medium text-sm text-red-800 truncate">{alert.message}</div>
                    <div className="text-xs text-red-600 mt-1 truncate">
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
        <Card className="shadow-card animate-fade-in border border-border/50 bg-card overflow-hidden">
          <CardHeader className="pb-3 px-4 pt-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-bold text-foreground truncate">נכסים אחרונים</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:bg-primary/10 flex-shrink-0">
                <Link to="/properties" className="font-semibold text-sm">הצג הכל ←</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            {properties.slice(0, 3).map((property, index) => (
              <div 
                key={property.id}
                className="flex items-center justify-between p-3 bg-gradient-to-l from-muted/50 to-transparent rounded-lg hover:from-primary/5 hover:to-transparent transition-all duration-200 animate-fade-in border border-border/30 gap-3 mobile-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 flex-container-mobile">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-sm flex-shrink-0">
                    <MapPin className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 flex-container-mobile">
                    <p className="font-semibold text-sm text-foreground text-truncate-mobile">{property.address}</p>
                    <p className="text-xs text-muted-foreground text-truncate-mobile">{property.ownerName}</p>
                  </div>
                </div>
                <Badge 
                  className={`text-xs font-semibold flex-shrink-0 whitespace-nowrap px-2 py-1 ${
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
        <Card className="shadow-card animate-fade-in border border-border/50 bg-card">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-base font-bold text-foreground">פעולות מהירות</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="lg" 
                asChild 
                className="h-12 border-2 border-primary/20 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
              >
                <Link to="/properties" className="flex flex-col gap-1">
                  <Building className="h-4 w-4" />
                  <span className="text-xs font-semibold">כל הנכסים</span>
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                asChild 
                className="h-12 border-2 border-primary/20 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
              >
                <Link to="/alerts" className="flex flex-col gap-1">
                  <Bell className="h-4 w-4" />
                  <span className="text-xs font-semibold">התראות</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};