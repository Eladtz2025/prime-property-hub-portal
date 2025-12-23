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

  return (
    <Card className="group hover:shadow-sm transition-all duration-200 hover:border-primary/30">
      <CardContent className="p-2 sm:p-2.5">
        {/* Mobile: Single row layout | Desktop: Stacked layout */}
        <div className="flex items-center gap-2 sm:block sm:space-y-1.5">
          {/* Address */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <p className="font-medium text-xs leading-tight truncate">
              {property.address}, {property.city}
            </p>
          </div>

          {/* Details - inline on mobile, below on desktop */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
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

          {/* Brokerage Form Button - icon only on mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 sm:w-full sm:gap-1.5 text-xs text-muted-foreground hover:text-primary shrink-0"
            onClick={() => window.open(buildBrokerageFormUrl(), '_blank')}
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">טופס תיווך</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
