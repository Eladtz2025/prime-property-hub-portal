import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddPropertyModal } from '../components/AddPropertyModal';
import { Alert } from '../types/property';
import { usePropertyData, usePropertyStats } from '../hooks/usePropertyData';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityLogsList } from '../components/ActivityLogsList';
import { StatsCard } from '../components/StatsCard';
import { useMobileOptimization } from '../hooks/useMobileOptimization';
import { MobileDashboard } from '../components/MobileDashboard';
import { 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Building,
  Users,
  Download,
  AlertTriangle,
  Send,
  MessageSquare,
  Eye,
  Home
} from 'lucide-react';

const Index = memo(() => {
  const { isAuthenticated } = useAuth();
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const { 
    properties, 
    isLoading, 
    addProperty, 
    isAddingProperty 
  } = usePropertyData();
  
  const { data: stats } = usePropertyStats(properties);

  const handlePropertyAdded = (newProperty: any) => {
    addProperty(newProperty);
    setShowAddPropertyModal(false);
  };
  
  // No alerts yet - system is ready for first use
  const alerts: Alert[] = [];

  // Show login prompt for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">מערכת ניהול נכסים</CardTitle>
            <CardDescription>
              התחבר למערכת כדי לגשת לנכסים שלך
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">משתמש קיים:</p>
              <Button asChild className="w-full">
                <Link to="/login">התחברות</Link>
              </Button>
            </div>
            <div className="text-center text-xs text-muted-foreground">
              <p>לבדיקת המערכת:</p>
              <p>מנהל על: eladtz@gmail.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { isMobile } = useMobileOptimization();
  
  // Mock urgent alerts for display
  const urgentAlerts: Alert[] = [
    { 
      id: "1", 
      message: "חידוש חוזה נדרש - רחוב הרצל 15", 
      type: "lease_expiry", 
      priority: "high",
      propertyAddress: "רחוב הרצל 15",
      ownerName: "יוסי כהן",
      createdAt: new Date().toISOString()
    },
    { 
      id: "2", 
      message: "תשלום שכר דירה מתעכב - רחוב בן גוריון 23", 
      type: "payment", 
      priority: "urgent",
      propertyAddress: "רחוב בן גוריון 23",
      ownerName: "שרה לוי",
      createdAt: new Date().toISOString()
    }
  ];

  if (isMobile) {
    return (
      <>
        <MobileDashboard 
          properties={properties}
          stats={stats ? {
            totalProperties: stats.total,
            contactedProperties: stats.contacted || 0,
            notContactedProperties: stats.notContacted || 0,
            confirmedOccupied: stats.occupied,
            confirmedVacant: stats.vacant,
            unknownStatus: stats.unknown || 0,
            upcomingRenewals: stats.upcomingRenewals
          } : { 
            totalProperties: 0, 
            contactedProperties: 0, 
            notContactedProperties: 0, 
            confirmedOccupied: 0, 
            confirmedVacant: 0, 
            unknownStatus: 0, 
            upcomingRenewals: 0 
          }}
          alerts={urgentAlerts}
          onAddProperty={() => setShowAddPropertyModal(true)}
        />
        <AddPropertyModal
          isOpen={showAddPropertyModal}
          onClose={() => setShowAddPropertyModal(false)}
          onPropertyAdded={handlePropertyAdded}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-primary p-6 rounded-lg text-white">
          <h1 className="text-3xl font-bold mb-2">מערכת ניהול נכסים</h1>
          <p className="text-white/80">סקירה כוללת של הנכסים והפעילות</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="סך הכל נכסים"
            value={stats?.total || 0}
            icon={Home}
            color="blue"
          />
          <StatsCard
            title="נכסים תפוסים"
            value={stats?.occupied || 0}
            icon={Building}
            color="green"
          />
          <StatsCard
            title="נכסים פנויים"
            value={stats?.vacant || 0}
            icon={Building}
            color="orange"
          />
          <StatsCard
            title="הכנסות חודשיות"
            value="₪45,800"
            icon={DollarSign}
            color="purple"
          />
          <StatsCard
            title="חידושי חוזים"
            value={stats?.upcomingRenewals || 0}
            icon={Calendar}
            color="orange"
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Urgent Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                התראות דחופות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {urgentAlerts.length > 0 ? (
                urgentAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 border rounded-lg bg-amber-50 border-amber-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">{alert.message}</p>
                        <p className="text-xs text-amber-600 mt-1">
                          {new Date(alert.createdAt).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">אין התראות דחופות</p>
              )}
              <Button variant="outline" size="sm" className="w-full mt-3">
                <Eye className="h-4 w-4 mr-2" />
                צפה בכל ההתראות
              </Button>
            </CardContent>
          </Card>

          {/* Quick Reports */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                דוחות מהירים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                דוח נכסים פעילים
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                דוח הכנסות חודשי
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                דוח חידושי חוזים
              </Button>
            </CardContent>
          </Card>

          {/* Quick Message */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                הודעה מהירה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">תבנית הודעה פופולרית:</label>
                <div className="p-3 bg-muted/50 rounded border text-sm">
                  "שלום, רציתי לבדוק איתך לגבי תשלום שכר הדירה לחודש הנוכחי. תודה!"
                </div>
              </div>
              <Button className="w-full">
                <Send className="h-4 w-4 mr-2" />
                שלח הודעה לכל השוכרים
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">פעילות אחרונה</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityLogsList />
            </CardContent>
          </Card>

        </div>

        {/* Properties Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              סקירת נכסים
              <Button onClick={() => setShowAddPropertyModal(true)}>
                הוסף נכס
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {properties.slice(0, 5).map((property) => (
              <div key={property.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div>
                  <p className="font-medium">{property.address}</p>
                  <p className="text-sm text-muted-foreground">
                    בעלים: {property.ownerName} | שוכר: {property.tenantName || 'פנוי'}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  property.status === 'occupied' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {property.status === 'occupied' ? 'תפוס' : 'פנוי'}
                </div>
              </div>
            ))}
            {properties.length > 5 && (
              <div className="pt-3">
                <Button variant="outline" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  צפה בכל הנכסים ({properties.length})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
      
      <AddPropertyModal
        isOpen={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        onPropertyAdded={handlePropertyAdded}
      />
    </>
  );
});

export default Index;