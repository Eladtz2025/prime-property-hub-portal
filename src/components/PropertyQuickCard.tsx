import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CalendarPlus } from 'lucide-react';
import { Property } from '@/types/property';
import { AddAppointmentModal } from './AddAppointmentModal';

interface PropertyQuickCardProps {
  property: Property;
  onClick?: (property: Property) => void;
}

export const PropertyQuickCard: React.FC<PropertyQuickCardProps> = ({ property, onClick }) => {
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  
  const formatPrice = () => {
    if (!property.monthlyRent) return null;
    return `₪${property.monthlyRent.toLocaleString('he-IL')}`;
  };

  // Get the primary image or the first image from the album
  const primaryImage = property.images?.find(img => img.isPrimary)?.url 
                     || property.images?.[0]?.url
                     || '/placeholder.svg';

  return (
    <Card className="group hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer" onClick={() => onClick?.(property)}>
      <CardContent className="p-0">
        {/* Square Image - smaller cards */}
        <div className="w-full aspect-square overflow-hidden relative bg-muted">
          <img 
            src={primaryImage} 
            alt={property.address}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Price Badge */}
          {formatPrice() && (
            <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-xs font-bold shadow-md">
              {formatPrice()}
            </div>
          )}
        </div>
        
        {/* Minimal Content */}
        <div className="p-1.5 text-right">
          <p className="font-medium text-xs truncate">{property.address}</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {property.city} {property.rooms && `| ${property.rooms} חד׳`}
          </p>
          
          {/* Action Buttons */}
          <div className="flex gap-1 mt-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs sm:text-[10px] h-8 sm:h-6 px-2 font-medium"
              onClick={(e) => {
                e.stopPropagation();
                const params = new URLSearchParams({
                  address: property.address || '',
                  city: property.city || '',
                  rooms: property.rooms?.toString() || '',
                  floor: property.floor?.toString() || '',
                  price: property.monthlyRent?.toString() || '',
                  type: property.property_type || 'rental'
                });
                window.open(`/brokerage-form/new?${params.toString()}`, '_blank');
              }}
            >
              <FileText className="h-4 w-4 sm:h-3 sm:w-3 ml-1" />
              תיווך
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs sm:text-[10px] h-8 sm:h-6 px-2 font-medium"
              onClick={(e) => {
                e.stopPropagation();
                setIsAppointmentModalOpen(true);
              }}
            >
              <CalendarPlus className="h-4 w-4 sm:h-3 sm:w-3 ml-1" />
              פגישה
            </Button>
          </div>
        </div>
      </CardContent>
      
      <AddAppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        property={property}
      />
    </Card>
  );
};
