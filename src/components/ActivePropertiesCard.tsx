import React from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base">הדירות שלנו ({activeProperties.length})</h3>
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
      </div>
      
      {/* Properties List */}
      <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 lg:grid-cols-4">
        {activeProperties.map((property) => (
          <PropertyQuickCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
};
