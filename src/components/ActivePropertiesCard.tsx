import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, ArrowLeft } from 'lucide-react';
import { Property } from '@/types/property';
import { PropertyQuickCard } from './PropertyQuickCard';

interface ActivePropertiesCardProps {
  properties: Property[];
}

export const ActivePropertiesCard: React.FC<ActivePropertiesCardProps> = ({ 
  properties
}) => {
  const navigate = useNavigate();

  // Filter only vacant properties (available for rent/sale)
  const activeProperties = React.useMemo(() => {
    return properties.filter(p => p.status === 'vacant');
  }, [properties]);

  if (activeProperties.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">הדירות שלנו ({activeProperties.length})</CardTitle>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/admin-dashboard/properties')}
          className="gap-1 h-8"
        >
          <span className="text-sm">ראה הכל</span>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="max-h-[400px] overflow-y-auto pr-1">
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 lg:grid-cols-4">
            {activeProperties.map((property) => (
              <PropertyQuickCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
