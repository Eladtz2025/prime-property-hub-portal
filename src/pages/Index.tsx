import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddPropertyModal } from '../components/AddPropertyModal';
import { Alert } from '../types/property';
import { usePropertyData, usePropertyStats } from '../hooks/usePropertyData';
import { Skeleton } from '@/components/ui/skeleton';
import { propertiesRawData } from '../data/propertiesData';

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

  // For mobile users, show demo mode instead of forcing login
  if (!isAuthenticated) {
    // Check if mobile - import hook at top
    const isMobileDevice = window.innerWidth < 768;
    
    if (isMobileDevice) {
      // Demo mode with sample data for mobile - proper Property interface
      const demoProperties = propertiesRawData.slice(0, 20).map((prop, index) => ({
        id: `demo-${index}`,
        address: prop.address,
        city: 'תל אביב',
        ownerName: prop.owner_name,
        ownerPhone: prop.owner_phone,
        tenantName: prop.tenant_name !== 'nan' ? prop.tenant_name : undefined,
        tenantPhone: prop.tenant_phone !== 'nan' ? prop.tenant_phone : undefined,
        status: (Math.random() > 0.5 ? 'occupied' : 'vacant') as 'occupied' | 'vacant',
        contactStatus: (Math.random() > 0.7 ? 'called_answered' : 'not_contacted') as 'called_answered' | 'not_contacted',
        contactAttempts: Math.floor(Math.random() * 3),
        monthlyRent: Math.floor(Math.random() * 5000) + 3000,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }));

      const demoStats = {
        totalProperties: demoProperties.length,
        contactedProperties: Math.floor(demoProperties.length * 0.6),
        notContactedProperties: Math.floor(demoProperties.length * 0.4),
        confirmedOccupied: demoProperties.filter(p => p.status === 'occupied').length,
        confirmedVacant: demoProperties.filter(p => p.status === 'vacant').length,
        unknownStatus: 0,
        upcomingRenewals: 3
      };

      return (
        <>
          <Dashboard 
            properties={demoProperties} 
            stats={demoStats}
            alerts={alerts} 
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

    // Desktop users get login prompt
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
    const isMobileDevice = window.innerWidth < 768;
    
    if (isMobileDevice) {
      return (
        <div className="w-full min-h-screen bg-background pb-20">
          <div className="space-y-6 px-4 py-6 max-w-lg mx-auto">
            <div className="bg-gradient-primary rounded-2xl p-6 text-white shadow-elevated animate-pulse">
              <div className="h-6 bg-white/20 rounded mb-2"></div>
              <div className="h-4 bg-white/20 rounded w-3/4"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      );
    }
    
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
      <AddPropertyModal
        isOpen={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        onPropertyAdded={handlePropertyAdded}
      />
    </>
  );
});

export default Index;