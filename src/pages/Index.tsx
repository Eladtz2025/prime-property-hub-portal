
import React, { useState, useEffect } from 'react';
import { Dashboard } from '../components/Dashboard';
import { AddPropertyModal } from '../components/AddPropertyModal';
import { processPropertiesData, calculatePropertyStats } from '../utils/dataProcessor';
import { Property, PropertyStats, Alert } from '../types/property';

const Index = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const propertiesData = await processPropertiesData();
        setProperties(propertiesData);
      } catch (error) {
        // Error handling will be done by ErrorBoundary
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handlePropertyAdded = async (newProperty: Property) => {
    try {
      // Save to localStorage
      const { savePropertyToStorage } = await import('../utils/propertyStorage');
      await savePropertyToStorage(newProperty);
      
      // Update state
      setProperties(prev => [...prev, newProperty]);
    } catch (error) {
      // Error handling will be done by ErrorBoundary
    }
  };

  const stats: PropertyStats = calculatePropertyStats(properties);
  
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">טוען נתונים...</div>
      </div>
    );
  }

  return (
    <>
      <Dashboard 
        properties={properties} 
        stats={stats} 
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
};

export default Index;
