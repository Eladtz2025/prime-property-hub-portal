import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Building, 
  AlertTriangle, 
  Users, 
  Calendar,
  TrendingUp,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Loader2
} from 'lucide-react';
import { Property } from '../types/property';
import { processPropertiesData } from '../utils/dataProcessor';
import { StatsCard } from './StatsCard';
import { AlertCard } from './AlertCard';
import { DuplicateManagementModal } from './DuplicateManagementModal';
import { findDuplicatePhoneNumbers } from '../utils/duplicateDetection';
import { useToast } from "@/hooks/use-toast";

export const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateModalKey, setDuplicateModalKey] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await processPropertiesData();
      setProperties(data);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast({
        title: "שגיאה בטעינת הנתונים",
        description: "לא הצלחנו לטעון את רשימת הנכסים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyUpdate = (updatedProperty: Property) => {
    setProperties(prev => 
      prev.map(p => p.id === updatedProperty.id ? updatedProperty : p)
    );
    setDuplicateModalKey(prev => prev + 1);
    loadData();
  };

  const handlePropertyDelete = (propertyId: string) => {
    setProperties(prev => prev.filter(p => p.id !== propertyId));
    setDuplicateModalKey(prev => prev + 1);
    loadData();
  };

  const handleViewProperty = (property: Property) => {
    // This can be implemented later if needed
    console.log('View property:', property);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <div className="text-lg">טוען נתונים...</div>
        </div>
      </div>
    );
  }

  const totalProperties = properties.length;
  const occupiedProperties = properties.filter(p => p.status === 'occupied').length;
  const vacantProperties = properties.filter(p => p.status === 'vacant').length;
  const maintenanceProperties = properties.filter(p => p.status === 'maintenance').length;
  
  const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;
  
  const propertiesWithRent = properties.filter(p => p.monthlyRent && p.monthlyRent > 0);
  const totalMonthlyRevenue = propertiesWithRent.reduce((sum, p) => sum + (p.monthlyRent || 0), 0);
  const averageRent = propertiesWithRent.length > 0 ? totalMonthlyRevenue / propertiesWithRent.length : 0;

  const expiringSoonLeases = properties.filter(property => {
    if (!property.leaseEndDate) return false;
    const endDate = new Date(property.leaseEndDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  });

  const expiredLeases = properties.filter(property => {
    if (!property.leaseEndDate) return false;
    const endDate = new Date(property.leaseEndDate);
    const today = new Date();
    return endDate < today;
  });

  const duplicateGroups = findDuplicatePhoneNumbers(properties);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Home className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">דשבורד</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="סה״כ נכסים"
          value={totalProperties}
          icon={Building}
          trend={`${occupancyRate.toFixed(1)}% תפוסה`}
          color="blue"
        />
        <StatsCard
          title="נכסים תפוסים"
          value={occupiedProperties}
          icon={Users}
          trend={`${((occupiedProperties / totalProperties) * 100).toFixed(1)}% מהנכסים`}
          color="green"
        />
        <StatsCard
          title="נכסים פנויים"
          value={vacantProperties}
          icon={Building}
          trend={`${((vacantProperties / totalProperties) * 100).toFixed(1)}% מהנכסים`}
          color="orange"
        />
        <StatsCard
          title="הכנסה חודשית"
          value={`₪${totalMonthlyRevenue.toLocaleString()}`}
          icon={TrendingUp}
          trend={`ממוצע ₪${averageRent.toLocaleString()}`}
          color="purple"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AlertCard
          title="חוזים שפגו"
          count={expiredLeases.length}
          icon={AlertTriangle}
          color="red"
          items={expiredLeases.map(p => ({
            title: p.address,
            subtitle: `${p.ownerName} - פג ב-${new Date(p.leaseEndDate!).toLocaleDateString('he-IL')}`
          }))}
        />
        
        <AlertCard
          title="חוזים שיפגו בקרוב"
          count={expiringSoonLeases.length}
          icon={Calendar}
          color="orange"
          items={expiringSoonLeases.map(p => ({
            title: p.address,
            subtitle: `${p.ownerName} - יפוג ב-${new Date(p.leaseEndDate!).toLocaleDateString('he-IL')}`
          }))}
        />
      </div>

      {duplicateGroups.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              כפילויות במספרי טלפון
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  נמצאו {duplicateGroups.length} מספרי טלפון כפולים
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  כפיליות עלולות ליצור בעיות בניהול הנכסים
                </p>
              </div>
              <Button
                onClick={() => setShowDuplicateModal(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                נהל כפיליות
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DuplicateManagementModal
        key={duplicateModalKey}
        duplicateGroups={duplicateGroups}
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onUpdateProperty={handlePropertyUpdate}
        onDeleteProperty={handlePropertyDelete}
        onViewProperty={handleViewProperty}
      />
    </div>
  );
};
