
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building, Users, AlertTriangle, CheckCircle, Clock, Phone, Bell, TrendingUp, Edit2, Plus } from 'lucide-react';
import { Property, PropertyStats, Alert } from '../types/property';
import { AlertCard } from './AlertCard';
import { StatsCard } from './StatsCard';

import { MobileDashboard } from './MobileDashboard';
import { ActivityLogsList } from './ActivityLogsList';
import { useMobileOptimization } from '../hooks/useMobileOptimization';

interface DashboardProps {
  properties: Property[];
  stats: PropertyStats;
  alerts: Alert[];
  onAddProperty?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = React.memo(({ properties, stats, alerts, onAddProperty }) => {
  const { isMobile } = useMobileOptimization();
  const urgentAlerts = React.useMemo(() => alerts.filter(alert => alert.priority === 'urgent'), [alerts]);
  const highPriorityAlerts = React.useMemo(() => alerts.filter(alert => alert.priority === 'high'), [alerts]);
  
  // Manual monthly income state
  const [manualMonthlyIncome, setManualMonthlyIncome] = useState<number | null>(null);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  
  // Load saved manual income from localStorage
  useEffect(() => {
    const savedIncome = localStorage.getItem('manualMonthlyIncome');
    if (savedIncome) {
      setManualMonthlyIncome(Number(savedIncome));
    }
  }, []);
  
  // Save manual income to localStorage
  const saveManualIncome = (income: number) => {
    setManualMonthlyIncome(income);
    localStorage.setItem('manualMonthlyIncome', income.toString());
    setIsEditingIncome(false);
  };
  
  // Calculate automatic income from rent - memoized for performance
  const autoCalculatedIncome = React.useMemo(() => 
    properties
      .filter(p => p.monthlyRent && p.monthlyRent > 0)
      .reduce((sum, p) => sum + (p.monthlyRent || 0), 0),
    [properties]
  );
  
  // Use manual income if set, otherwise use auto-calculated
  const displayIncome = manualMonthlyIncome !== null ? manualMonthlyIncome : autoCalculatedIncome;

  
  // Show mobile dashboard for mobile users
  if (isMobile) {
    return <MobileDashboard properties={properties} stats={stats} alerts={alerts} onAddProperty={onAddProperty} />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-4xl font-bold text-foreground bg-gradient-primary bg-clip-text text-transparent">
            לוח בקרה ראשי
          </h2>
          <p className="text-muted-foreground mt-1">סקירה כללית של הנכסים שלך</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">עודכן לאחרונה</div>
            <div className="text-lg font-semibold text-foreground">
              {new Date().toLocaleDateString('he-IL')}
            </div>
          </div>
          {onAddProperty && (
            <Button
              onClick={onAddProperty}
              className="btn-enhanced-contrast touch-target"
              size="lg"
              aria-label="הוסף נכס חדש"
            >
              <Plus className="h-5 w-5 ml-2" />
              הוסף נכס חדש
            </Button>
          )}
        </div>
      </div>

      {/* Urgent Alerts */}
      {urgentAlerts.length > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              התראות דחופות ({urgentAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentAlerts.slice(0, 3).map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
            {urgentAlerts.length > 3 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                aria-label={`הצג עוד ${urgentAlerts.length - 3} התראות דחופות`}
              >
                הצג עוד {urgentAlerts.length - 3} התראות
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
        <StatsCard 
          title="סה״כ נכסים"
          value={stats.totalProperties}
          icon={Building}
          color="blue"
        />
        <StatsCard 
          title="בעלים שנוצר קשר"
          value={stats.contactedProperties}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard 
          title="טרם נוצר קשר"
          value={stats.notContactedProperties}
          icon={Phone}
          color="orange"
        />
        <StatsCard 
          title="נכסים תפוסים"
          value={stats.confirmedOccupied}
          icon={Users}
          color="green"
        />
        <Card className="cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-transparent hover:border-l-primary group" onClick={() => setIsEditingIncome(true)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 transition-all duration-300 group-hover:scale-110 shadow-sm">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">הכנסה חודשית כוללת</span>
                </div>
              </div>
              <Edit2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            {isEditingIncome ? (
              <div className="mt-2 space-y-2">
                <Input
                  type="number"
                  placeholder="הזן סכום בש״ח..."
                  defaultValue={manualMonthlyIncome || autoCalculatedIncome}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const value = Number((e.target as HTMLInputElement).value);
                      saveManualIncome(value);
                    }
                    if (e.key === 'Escape') {
                      setIsEditingIncome(false);
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    aria-label="שמור הכנסה חודשית"
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = (e.target as HTMLElement).parentElement?.parentElement?.querySelector('input') as HTMLInputElement;
                      const value = Number(input.value);
                      saveManualIncome(value);
                    }}
                  >
                    שמור
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    aria-label="בטל עריכה"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingIncome(false);
                    }}
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <div className="text-3xl font-bold text-foreground mb-1">₪{displayIncome.toLocaleString('he-IL')}</div>
                {manualMonthlyIncome !== null && (
                  <div className="text-xs text-muted-foreground">
                    ערך ידני (אוטומטי: ₪{autoCalculatedIncome.toLocaleString('he-IL')})
                  </div>
                )}
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-gradient-primary transition-all duration-500 group-hover:w-full w-0"></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <StatsCard 
          title="סטטוס לא ידוע"
          value={stats.unknownStatus}
          icon={Clock}
          color="gray"
        />
      </div>

      {/* High Priority Alerts */}
      {highPriorityAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              התראות בעדיפות גבוהה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {highPriorityAlerts.slice(0, 5).map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Properties Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>סקירת נכסים</span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/properties" aria-label="הצג את כל הנכסים">הצג הכל</Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {properties.slice(0, 5).map((property) => (
              <div key={property.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium">{property.address}</div>
                    <div className="text-sm text-muted-foreground">
                      בעלים: {property.ownerName}
                      {property.tenantName && ` • דייר: ${property.tenantName}`}
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  property.status === 'occupied' 
                    ? 'bg-green-100 text-green-800' 
                    : property.status === 'vacant'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {property.status === 'occupied' ? 'תפוס' : property.status === 'vacant' ? 'פנוי' : 'לא ידוע'}
                </div>
              </div>
            ))}
            {properties.length > 5 && (
              <div className="text-center text-sm text-muted-foreground pt-2">
                ועוד {properties.length - 5} נכסים נוספים
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>פעילות אחרונה</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityLogsList limit={5} />
        </CardContent>
      </Card>
    </div>
  );
});
