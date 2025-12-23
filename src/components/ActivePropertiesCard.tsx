import React from 'react';
import { Building } from 'lucide-react';
import { Property } from '@/types/property';
import { PropertyQuickCard } from './PropertyQuickCard';

interface ActivePropertiesCardProps {
  properties: Property[];
}

export const ActivePropertiesCard: React.FC<ActivePropertiesCardProps> = ({ 
  properties
}) => {
  // Filter only vacant properties (available for rent/sale)
  const activeProperties = React.useMemo(() => {
    return properties.filter(p => p.status === 'vacant');
  }, [properties]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Building className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-base">הדירות האקטואליות שלנו ({activeProperties.length})</h3>
      </div>
      
      {/* Properties List */}
      {activeProperties.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">אין דירות פנויות כרגע</p>
      ) : (
        <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 lg:grid-cols-4">
          {activeProperties.map((property) => (
            <PropertyQuickCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
};
