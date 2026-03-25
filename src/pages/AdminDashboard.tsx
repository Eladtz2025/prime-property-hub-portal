import React, { useState, memo, useMemo } from 'react';
import { Dashboard } from '../components/Dashboard';
import { useAuth } from '@/contexts/AuthContext';


import { AddPropertyModal } from '../components/AddPropertyModal';
import { Alert } from '../types/property';
import { usePropertyData, usePropertyStats } from '../hooks/usePropertyData';
import { Skeleton } from '@/components/ui/skeleton';



const AdminDashboard = memo(() => {
  const { } = useAuth();
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
      <div className="space-y-6">
        
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

      </div>
      
      <AddPropertyModal
        isOpen={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        onPropertyAdded={handlePropertyAdded}
      />
    </>
  );
});

export default AdminDashboard;
