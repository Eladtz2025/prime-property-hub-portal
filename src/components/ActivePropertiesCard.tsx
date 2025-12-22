import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, ArrowLeft } from 'lucide-react';
import { Property } from '@/types/property';
import { PropertyQuickCard } from './PropertyQuickCard';

interface ActivePropertiesCardProps {
  properties: Property[];
  maxDisplay?: number;
}

export const ActivePropertiesCard: React.FC<ActivePropertiesCardProps> = ({ 
  properties, 
  maxDisplay = 6 
}) => {
  const navigate = useNavigate();

  // Filter active properties (occupied or available/vacant)
  const activeProperties = React.useMemo(() => {
    return properties
      .filter(p => p.status === 'occupied' || p.status === 'vacant' || p.property_type)
      .slice(0, maxDisplay);
  }, [properties, maxDisplay]);

  if (activeProperties.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          <CardTitle>הדירות שלנו</CardTitle>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/admin-dashboard/properties')}
          className="gap-1"
        >
          <span className="text-sm">ראה הכל</span>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeProperties.map((property) => (
            <PropertyQuickCard key={property.id} property={property} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
