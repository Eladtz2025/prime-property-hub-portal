import React, { useState, memo, useMemo } from 'react';
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
import { BrokerageFormCard } from '../components/BrokerageFormCard';
import { BrokerageFormsList } from '../components/BrokerageFormsList';
import { ContactLeadsList } from '../components/ContactLeadsList';

const AdminDashboard = memo(() => {
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
  
  // Generate alerts from properties data
  const alerts = useMemo(() => {
    const alertsList: Alert[] = [];
    const now = new Date();
    
    properties.forEach(property => {
      if (property.leaseEndDate) {
        const endDate = new Date(property.leaseEndDate);
        const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        
        if (daysUntilEnd <= 60 && daysUntilEnd > 0) {
          let priority: 'urgent' | 'high' | 'medium' = 'medium';
          let message = '';
          
          if (daysUntilEnd <= 14) {
            priority = 'urgent';
            message = `חוזה מסתיים בעוד ${daysUntilEnd} ימים - דרושה פעולה מיידית!`;
          } else if (daysUntilEnd <= 30) {
            priority = 'high';
            message = `חוזה מסתיים בעוד ${daysUntilEnd} ימים - יש להתחיל תיאום חידוש`;
          } else {
            priority = 'medium';
            message = `חוזה מסתיים בעוד ${daysUntilEnd} ימים - תכנון מוקדם לחידוש`;
          }
          
          alertsList.push({
            id: `lease-${property.id}`,
            type: 'lease_expiry',
            priority,
            message,
            propertyAddress: property.address,
            ownerName: property.ownerName,
            tenantName: property.tenantName,
            dueDate: property.leaseEndDate,
            createdAt: now.toISOString()
          });
        }
      }
      
      // Check for vacant properties
      if (property.status === 'vacant') {
        alertsList.push({
          id: `vacant-${property.id}`,
          type: 'vacancy',
          priority: 'high',
          message: 'נכס פנוי - דרושה השכרה',
          propertyAddress: property.address,
          ownerName: property.ownerName,
          createdAt: now.toISOString()
        });
      }
      
      // Check for maintenance
      if (property.status === 'maintenance') {
        alertsList.push({
          id: `maintenance-${property.id}`,
          type: 'maintenance',
          priority: 'medium',
          message: 'נכס בתחזוקה - בדיקת התקדמות',
          propertyAddress: property.address,
          ownerName: property.ownerName,
          tenantName: property.tenantName,
          createdAt: now.toISOString()
        });
      }
    });
    
    return alertsList.sort((a, b) => {
      const priorityOrder = { urgent: 3, high: 2, medium: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [properties]);

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
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">דשבורד</TabsTrigger>
          <TabsTrigger value="leads">פניות מהאתר</TabsTrigger>
          <TabsTrigger value="brokerage">טפסי תיווך</TabsTrigger>
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

        <TabsContent value="leads">
          <ContactLeadsList />
        </TabsContent>

        <TabsContent value="brokerage">
          <div className="space-y-6">
            <BrokerageFormCard />
            <BrokerageFormsList />
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

export default AdminDashboard;
