
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Users, AlertTriangle, CheckCircle, Clock, Phone, Bell, TrendingUp } from 'lucide-react';
import { Property, PropertyStats, Alert } from '../types/property';
import { AlertCard } from './AlertCard';
import { StatsCard } from './StatsCard';
import { MobileDashboard } from './MobileDashboard';
import { useMobileOptimization } from '../hooks/useMobileOptimization';
import { findDuplicatePhoneNumbers } from '../utils/duplicateDetection';

interface DashboardProps {
  properties: Property[];
  stats: PropertyStats;
  alerts: Alert[];
  onAddProperty?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ properties, stats, alerts, onAddProperty }) => {
  const { isMobile } = useMobileOptimization();
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  
  useEffect(() => {
    const duplicates = findDuplicatePhoneNumbers(properties);
    setDuplicateGroups(duplicates);
  }, [properties]);

  const urgentAlerts = alerts.filter(alert => alert.priority === 'urgent');
  const highPriorityAlerts = alerts.filter(alert => alert.priority === 'high');

  console.log('📊 Dashboard rendering with:', properties.length, 'properties');
  console.log('🏠 Properties in dashboard:', properties.slice(0, 3));
  
  // Show mobile dashboard for mobile users
  if (isMobile) {
    return <MobileDashboard properties={properties} stats={stats} alerts={alerts} onAddProperty={onAddProperty} />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">דשבורד מרכזי</h2>
        <div className="text-sm text-muted-foreground">
          עדכון אחרון: {new Date().toLocaleDateString('he-IL')}
        </div>
      </div>

      {/* Duplicate Phone Numbers Alert */}
      {duplicateGroups.length > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              נמצאו כפיליות במספרי טלפון ({duplicateGroups.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-orange-700">
              {duplicateGroups.map((group, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div>
                    <strong>{group.phoneNumber}</strong> - {group.properties.length} נכסים
                  </div>
                  <div className="text-xs">
                    {group.properties.map((p: Property) => p.address).join(', ')}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/properties">נהל כפיליות</Link>
            </Button>
          </CardContent>
        </Card>
      )}

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
              <Button variant="outline" size="sm" className="w-full">
                הצג עוד {urgentAlerts.length - 3} התראות
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard 
          title="סה״כ נכסים"
          value={stats.totalProperties}
          icon={Building}
          color="blue"
        />
        <StatsCard 
          title="נכסים תפוסים"
          value={stats.occupiedProperties}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard 
          title="נכסים פנויים"
          value={stats.vacantProperties}
          icon={Users}
          color="orange"
        />
        <StatsCard 
          title="הכנסה חודשית"
          value={`₪${properties
            .filter(p => p.monthlyRent && p.monthlyRent > 0)
            .reduce((sum, p) => sum + (p.monthlyRent || 0), 0)
            .toLocaleString('he-IL')}`}
          icon={TrendingUp}
          color="purple"
        />
        <StatsCard 
          title="חידושים קרובים"
          value={stats.upcomingRenewals}
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
              <Link to="/properties">הצג הכל</Link>
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
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {property.status === 'occupied' ? 'תפוס' : 'פנוי'}
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
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">שיחה עם בעל נכס</div>
                  <div className="text-sm text-muted-foreground">בן יהודה 107 - שחר</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">לפני 2 שעות</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">נכס חדש נוסף</div>
                  <div className="text-sm text-muted-foreground">זנגביל 24 - מייק</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">אתמול</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
