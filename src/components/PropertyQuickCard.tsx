import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from 'lucide-react';
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
        {/* Square Image - smaller cards */}
        <div className="w-full aspect-square overflow-hidden relative bg-muted">
          <img 
            src={primaryImage} 
            alt={property.address}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Price Badge - bottom right */}
          {formatPrice() && (
            <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-xs font-bold shadow-md">
              {formatPrice()}
            </div>
          )}
          {/* Property ID Badge - bottom left */}
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-1.5 py-0.5 rounded text-xs font-medium shadow-md">
            #{property.id?.slice(-4).toUpperCase() || '0000'}
          </div>
        </div>
        
        {/* Minimal Content */}
        <div className="p-1.5 text-right">
          <p className="font-medium text-xs truncate">{property.address}</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {property.city} {property.rooms && `| ${property.rooms} חד׳`}
          </p>
          
          {/* Brokerage Form Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-[10px] h-6 mt-1 px-1"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/brokerage-form/${property.id}`, '_blank');
            }}
          >
            <FileText className="h-3 w-3 ml-1" />
            טופס תיווך
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
