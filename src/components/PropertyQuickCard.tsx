import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Property } from '@/types/property';

interface PropertyQuickCardProps {
  property: Property;
}

export const PropertyQuickCard: React.FC<PropertyQuickCardProps> = ({ property }) => {
  const formatPrice = () => {
    if (!property.monthlyRent) return null;
    return `₪${property.monthlyRent.toLocaleString('he-IL')}`;
  };

  // Get the primary image or the first image from the album
  const primaryImage = property.images?.find(img => img.isPrimary)?.url 
                     || property.images?.[0]?.url
                     || '/placeholder.svg';

  return (
    <Card className="group hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer">
      <CardContent className="p-0">
        {/* Portrait Image */}
        <div className="w-full aspect-[3/4] overflow-hidden relative bg-muted">
          <img 
            src={primaryImage} 
            alt={property.address}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Price Badge */}
          {formatPrice() && (
            <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm font-bold shadow-md">
              {formatPrice()}
            </div>
          )}
        </div>
        
        {/* Minimal Content */}
        <div className="p-2 text-right">
          <p className="font-medium text-sm truncate">{property.address}</p>
          <p className="text-xs text-muted-foreground">
            {property.city} {property.rooms && `| ${property.rooms} חד׳`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
