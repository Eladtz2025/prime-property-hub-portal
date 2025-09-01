import React, { useState, memo } from 'react';
import { Dashboard } from '../components/Dashboard';
import { AddPropertyModal } from '../components/AddPropertyModal';
import { Alert } from '../types/property';
import { usePropertyData, usePropertyStats } from '../hooks/usePropertyData';
import { Skeleton } from '@/components/ui/skeleton';

const Index = memo(() => {
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
  
  // Mock alerts for demonstration
  const alerts: Alert[] = [
    {
      id: 'alert-1',
      type: 'lease_expiry',
      message: 'חוזה השכירות מסתיים בעוד 30 יום',
      priority: 'high',
      propertyAddress: 'בן יהודה 107',
      ownerName: 'שחר',
      tenantName: 'דייר נוכחי',
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'alert-2',
      type: 'maintenance',
      message: 'נדרשת בדיקת מערכת חימום',
      priority: 'urgent',
      propertyAddress: 'זנגביל 24',
      ownerName: 'מייק',
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

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
      <Dashboard 
        properties={properties} 
        stats={stats ? {
          totalProperties: stats.total,
          occupiedProperties: stats.occupied,
          vacantProperties: stats.vacant,
          upcomingRenewals: stats.upcomingRenewals
        } : { totalProperties: 0, occupiedProperties: 0, vacantProperties: 0, upcomingRenewals: 0 }} 
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