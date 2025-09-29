import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddPropertyModal } from '../components/AddPropertyModal';
import { Alert } from '../types/property';
import { usePropertyData, usePropertyStats } from '../hooks/usePropertyData';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Building,
  Users,
  BarChart3,
  Download
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

  return (
    <>
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            לוח בקרה
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            דוחות
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <Dashboard 
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
            alerts={alerts} 
            onAddProperty={() => setShowAddPropertyModal(true)}
          />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          {/* Reports Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">הכנסות חודשיות</p>
                    <p className="text-2xl font-bold text-blue-700">₪45,800</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">נכסים פעילים</p>
                    <p className="text-2xl font-bold text-green-700">{stats?.occupied || 0}</p>
                  </div>
                  <Building className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">שוכרים פעילים</p>
                    <p className="text-2xl font-bold text-purple-700">{stats?.occupied || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">תפוסה</p>
                    <p className="text-2xl font-bold text-orange-700">
                      {stats?.total ? Math.round((stats.occupied / stats.total) * 100) : 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
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
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  דוח נכסים פנויים
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  תחזיות ותכנון
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium">חידושי חוזים הקרובים</div>
                  <div className="text-2xl font-bold text-orange-600">{stats?.upcomingRenewals || 0}</div>
                  <div className="text-xs text-muted-foreground">בשלושה חודשים הקרובים</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium">תחזית הכנסות חודש הבא</div>
                  <div className="text-2xl font-bold text-green-600">₪46,200</div>
                  <div className="text-xs text-muted-foreground">על בסיס נכסים קיימים</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <AddPropertyModal
        isOpen={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        onPropertyAdded={handlePropertyAdded}
      />
    </>
  );
});

export default Index;