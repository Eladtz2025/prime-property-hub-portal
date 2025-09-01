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
  
  // No alerts yet - system is ready for first use
  const alerts: Alert[] = [];

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