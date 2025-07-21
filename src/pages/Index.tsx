
import React, { useState, useEffect } from 'react';
import { Dashboard } from '../components/Dashboard';
import { processPropertiesData, calculatePropertyStats } from '../utils/dataProcessor';
import { Property, PropertyStats, Alert } from '../types/property';

const Index = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const propertiesData = await processPropertiesData();
        setProperties(propertiesData);
      } catch (error) {
        console.error('Failed to load properties:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
      createdAt: new Date().toISOString()
    },
    {
      id: 'alert-2',
      type: 'maintenance',
      message: 'נדרשת בדיקת מערכת חימום',
      priority: 'urgent',
      propertyAddress: 'זנגביל 24',
      ownerName: 'מייק',
      createdAt: new Date().toISOString()
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">טוען נתונים...</div>
      </div>
    );
  }

  return <Dashboard properties={properties} stats={stats} alerts={alerts} />;
};

export default Index;
