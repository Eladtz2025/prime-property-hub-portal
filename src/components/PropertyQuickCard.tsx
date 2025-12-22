import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Home, Layers, FileText } from 'lucide-react';
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
    <Card className="group hover:shadow-md transition-all duration-200 hover:border-primary/30">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Address */}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-sm leading-tight truncate">
                {property.address}
              </p>
              <p className="text-xs text-muted-foreground">{property.city}</p>
            </div>
          </div>

          {/* Details */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {property.rooms && (
              <div className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                <span>{property.rooms} חד׳</span>
              </div>
            )}
            {property.floor !== undefined && property.floor !== null && (
              <div className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                <span>קומה {property.floor}</span>
              </div>
            )}
          </div>

          {/* Price & Type */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {formatPrice() && (
                <span className="font-semibold text-sm text-primary">
                  {formatPrice()}
                </span>
              )}
              {getPropertyTypeLabel() && (
                <span className="text-xs text-muted-foreground">
                  | {getPropertyTypeLabel()}
                </span>
              )}
            </div>
          </div>

          {/* Brokerage Form Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={() => window.open(buildBrokerageFormUrl(), '_blank')}
          >
            <FileText className="h-3.5 w-3.5" />
            טופס תיווך
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
