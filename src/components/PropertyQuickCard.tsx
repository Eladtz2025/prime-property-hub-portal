import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, FileText } from 'lucide-react';
import { Property } from '@/types/property';

interface PropertyQuickCardProps {
  property: Property;
}

export const PropertyQuickCard: React.FC<PropertyQuickCardProps> = ({ property }) => {
  // Build query params for the brokerage form
  const buildBrokerageFormUrl = () => {
    const params = new URLSearchParams();
    
    if (property.address) params.set('address', property.address);
    if (property.city) params.set('city', property.city);
    if (property.rooms) params.set('rooms', String(property.rooms));
    if (property.floor !== undefined && property.floor !== null) params.set('floor', String(property.floor));
    if (property.monthlyRent) params.set('price', String(property.monthlyRent));
    if (property.property_type) params.set('type', property.property_type);
    
    return `/brokerage-form/new?${params.toString()}`;
  };

  const getPropertyTypeLabel = () => {
    switch (property.property_type) {
      case 'rental': return 'שכירות';
      case 'sale': return 'מכירה';
      case 'management': return 'ניהול';
      default: return '';
    }
  };

  const formatPrice = () => {
    if (!property.monthlyRent) return null;
    return `₪${property.monthlyRent.toLocaleString('he-IL')}`;
  };

  // Get the primary image or the first image from the album
  const primaryImage = property.images?.find(img => img.isPrimary)?.url 
                     || property.images?.[0]?.url;

  return (
    <Card className="group hover:shadow-sm transition-all duration-200 hover:border-primary/30 overflow-hidden">
      <CardContent className="p-0">
        {/* Mobile: Row with small image | Desktop: Stacked with large image */}
        <div className="flex items-center gap-2 p-2 sm:block sm:p-0">
          {/* Image */}
          {primaryImage && (
            <div className="w-14 h-14 rounded overflow-hidden shrink-0 sm:w-full sm:h-28 sm:rounded-none">
              <img 
                src={primaryImage} 
                alt={property.address}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 sm:p-2.5 sm:space-y-1.5">
            {/* Address */}
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="font-medium text-xs leading-tight truncate">
                {property.address}, {property.city}
              </p>
            </div>

            {/* Details */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 sm:mt-0">
              {property.rooms && (
                <span>{property.rooms} חד׳</span>
              )}
              {property.floor !== undefined && property.floor !== null && (
                <span className="hidden sm:inline">ק׳ {property.floor}</span>
              )}
              {formatPrice() && (
                <span className="font-medium text-primary">{formatPrice()}</span>
              )}
              {getPropertyTypeLabel() && (
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded hidden sm:inline">
                  {getPropertyTypeLabel()}
                </span>
              )}
            </div>

            {/* Brokerage Form Button - styled as a real button */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 mt-1 sm:w-full sm:mt-1.5 gap-1.5 text-xs border-primary/30 bg-primary/5 hover:bg-primary/10 hover:text-primary hover:border-primary/50 shrink-0"
              onClick={() => window.open(buildBrokerageFormUrl(), '_blank')}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>טופס תיווך</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
