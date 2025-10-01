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
import { ActivityLogsList } from './ActivityLogsList';
import { useMobileOptimization } from '../hooks/useMobileOptimization';
import { useAuth } from '@/contexts/AuthContext';

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

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="space-y-4 p-4 pb-24 mobile-scroll max-w-screen-sm mx-auto">
        {/* Header with greeting */}
        <div className="bg-gradient-primary rounded-2xl p-5 text-white shadow-elevated animate-fade-in overflow-hidden relative isolate">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/20"></div>
            <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/10"></div>
          </div>
          
          <div className="relative z-10">
            <div className="mb-4">
              <h1 className="text-xl font-bold mb-1">
                שלום{userName ? ` ${userName}` : ''}! 👋
              </h1>
              <p className="text-white/90 text-sm">ברוך הבא למערכת ניהול הנכסים</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-white/20 p-1.5 rounded-lg flex-shrink-0">
                    <Building className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold truncate">סה״כ נכסים</span>
                </div>
                <div className="text-xl font-bold number-display">{stats.totalProperties}</div>
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
                  <div className="text-lg font-bold number-display truncate">
                    {displayIncome > 0 ? `₪${displayIncome.toLocaleString('he-IL')}` : 'לא חושב'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Urgent Alerts */}
      {urgentAlerts.length > 0 && (
        <Card className="border-destructive bg-destructive/10 animate-scale-in backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive text-base">
              <AlertTriangle className="h-4 w-4" />
              התראות דחופות ({urgentAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentAlerts.slice(0, 2).map((alert) => (
              <div key={alert.id} className="bg-card/60 rounded-lg p-3 border border-destructive/20 overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="bg-destructive/10 p-2 rounded-full flex-shrink-0">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="font-medium text-sm text-destructive truncate">{alert.message}</div>
                    <div className="text-xs text-destructive/80 mt-1 truncate">
                      {alert.propertyAddress} • {alert.ownerName}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {urgentAlerts.length > 2 && (
              <Button variant="outline" size="sm" className="w-full text-xs border-destructive/30 text-destructive hover:bg-destructive/10">
                הצג עוד {urgentAlerts.length - 2}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats - Row 1 */}
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

      {/* Quick Stats - Row 2 */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in">
        <Card className="shadow-card hover:shadow-elevated transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-lg w-fit mx-auto mb-2">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <p className="text-xs text-blue-700/80 mb-1 font-medium">נוצר קשר</p>
              <p className="text-xl font-bold text-blue-700">{stats.contactedProperties}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg shadow-lg w-fit mx-auto mb-2">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <p className="text-xs text-purple-700/80 mb-1 font-medium">טרם קשר</p>
              <p className="text-xl font-bold text-purple-700">{stats.notContactedProperties}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-all duration-300 border-0 bg-gradient-to-br from-gray-50 to-gray-100/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-2 rounded-lg shadow-lg w-fit mx-auto mb-2">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <p className="text-xs text-gray-700/80 mb-1 font-medium">לא ידוע</p>
              <p className="text-xl font-bold text-gray-700">{stats.unknownStatus}</p>
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
                className="flex items-center justify-between p-3 bg-gradient-to-l from-muted/50 to-transparent rounded-lg hover:from-primary/5 hover:to-transparent transition-all duration-200 animate-fade-in border border-border/30 gap-3"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 flex-container-mobile">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-sm flex-shrink-0">
                    <MapPin className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 flex-container-mobile">
                    <p className="font-semibold text-sm text-foreground truncate block">{property.address}</p>
                    <p className="text-xs text-muted-foreground truncate block">{property.ownerName}</p>
                  </div>
                </div>
                <Badge 
                  className={`text-xs font-semibold flex-shrink-0 whitespace-nowrap px-2 py-1 ${
                    property.status === 'occupied' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30' 
                      : property.status === 'vacant'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900/30'
                  }`}
                >
                  {property.status === 'occupied' ? 'תפוס' : property.status === 'vacant' ? 'פנוי' : 'לא ידוע'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alerts Section */}
        <Card className="shadow-card animate-fade-in border border-border/50 bg-card">
          <CardHeader className="pb-3 px-4 pt-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4" />
                התראות ומעקב
              </CardTitle>
              {alerts.length > 0 && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {alerts.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {alerts.length === 0 ? (
              <div className="text-center py-6">
                <div className="bg-green-50 p-3 rounded-full w-fit mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <p className="font-medium text-sm">אין התראות פעילות</p>
                <p className="text-xs text-muted-foreground mt-1">כל הנכסים תקינים</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert, index) => (
                  <div 
                     key={alert.id} 
                    className={`rounded-lg p-3 border overflow-hidden animate-fade-in ${
                      alert.priority === 'urgent' 
                        ? 'bg-destructive/10 border-destructive/20' 
                        : alert.priority === 'high'
                        ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/30'
                        : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30'
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full flex-shrink-0 ${
                        alert.priority === 'urgent' 
                          ? 'bg-destructive/10' 
                          : alert.priority === 'high'
                          ? 'bg-orange-100 dark:bg-orange-900/30'
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        <AlertTriangle className={`h-3 w-3 ${
                          alert.priority === 'urgent' 
                            ? 'text-destructive' 
                            : alert.priority === 'high'
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge variant="outline" className={`text-xs font-semibold mb-1 ${
                          alert.priority === 'urgent' 
                            ? 'border-destructive/30 text-destructive' 
                            : alert.priority === 'high'
                            ? 'border-orange-300 text-orange-700 dark:text-orange-400'
                            : 'border-blue-300 text-blue-700 dark:text-blue-400'
                        }`}>
                          {alert.priority === 'urgent' ? 'דחוף' : alert.priority === 'high' ? 'חשוב' : 'רגיל'}
                        </Badge>
                        <div className={`font-medium text-sm truncate ${
                          alert.priority === 'urgent' 
                            ? 'text-destructive' 
                            : alert.priority === 'high'
                            ? 'text-orange-800 dark:text-orange-200'
                            : 'text-blue-800 dark:text-blue-200'
                        }`}>
                          {alert.message}
                        </div>
                        <div className={`text-xs mt-1 truncate ${
                          alert.priority === 'urgent' 
                            ? 'text-destructive/80' 
                            : alert.priority === 'high'
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {alert.propertyAddress} • {alert.ownerName}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {alerts.length > 5 && (
                  <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                    <Link to="/alerts">
                      הצג עוד {alerts.length - 5} התראות
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-card animate-fade-in border border-border/50 bg-card">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-base font-bold text-foreground">פעילות אחרונה</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ActivityLogsList limit={3} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};