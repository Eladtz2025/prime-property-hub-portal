import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CalendarPlus, ChevronDown } from 'lucide-react';
import { Property } from '@/types/property';
import { AddAppointmentModal } from './AddAppointmentModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const primaryImage = property.images?.find(img => img.isPrimary)?.url 
                     || property.images?.[0]?.url
                     || '/placeholder.svg';

  return (
    <>
      <Card className="group hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer" onClick={() => onClick?.(property)}>
        <CardContent className="p-0">
          {/* Image - aspect-[4/3] on mobile, square on desktop */}
          <div className="w-full aspect-[4/3] md:aspect-square overflow-hidden relative bg-muted">
            <img 
              src={primaryImage} 
              alt={property.address}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Price Badge - larger on mobile */}
            {formatPrice() && (
              <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground px-2 py-1 md:px-1.5 md:py-0.5 rounded text-sm md:text-xs font-bold shadow-md">
                {formatPrice()}
              </div>
            )}
          </div>
          
          {/* Content - more padding on mobile */}
          <div className="p-2.5 md:p-1.5 text-right">
            <p className="font-medium text-sm md:text-xs truncate">{property.address}</p>
            <p className="text-xs md:text-[10px] text-muted-foreground truncate">
              {property.city} {property.rooms && `| ${property.rooms} חד׳`}
            </p>
            
            {/* Mobile: icon buttons row | Desktop: dropdown */}
            <div className="mt-2">
              {/* Mobile icon buttons */}
              <div className="flex gap-1.5 md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-xs font-medium border-primary/30 hover:bg-primary/10"
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
                  <FileText className="h-4 w-4 ml-1" />
                  תיווך
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-xs font-medium border-primary/30 hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAppointmentModalOpen(true);
                  }}
                >
                  <CalendarPlus className="h-4 w-4 ml-1" />
                  פגישה
                </Button>
              </div>

              {/* Desktop dropdown */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 px-3 font-medium border-primary/30 hover:bg-primary/10"
                    >
                      <ChevronDown className="h-4 w-4 ml-2" />
                      פעולות
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[140px]">
                    <DropdownMenuItem
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
                      <FileText className="h-4 w-4 ml-2" />
                      תיווך
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        const params = new URLSearchParams({
                          address: property.address || '',
                          city: property.city || '',
                          rooms: property.rooms?.toString() || '',
                          floor: property.floor?.toString() || '',
                          price: property.monthlyRent?.toString() || '',
                        });
                        const formPath = property.property_type === 'sale' 
                          ? '/sale-memorandum-form/new' 
                          : '/memorandum-form/new';
                        window.open(`${formPath}?${params.toString()}`, '_blank');
                      }}
                    >
                      <FileText className="h-4 w-4 ml-2" />
                      זכ״ד
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAppointmentModalOpen(true);
                      }}
                    >
                      <CalendarPlus className="h-4 w-4 ml-2" />
                      פגישה
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AddAppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        property={property}
      />
    </>
  );
};
