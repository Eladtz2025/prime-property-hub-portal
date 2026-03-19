import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building } from 'lucide-react';
import { Property } from '@/types/property';
import { PropertyQuickCard } from './PropertyQuickCard';
import { PropertyDetailModal } from './PropertyDetailModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface ActivePropertiesCardProps {
  properties: Property[];
}

export const ActivePropertiesCard: React.FC<ActivePropertiesCardProps> = ({ 
  properties
}) => {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter only vacant properties (available for rent/sale)
  const activeProperties = React.useMemo(() => {
    return properties.filter(p => p.status === 'vacant');
  }, [properties]);

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  const handleEditProperty = (property: Property) => {
    setIsModalOpen(false);
    setSelectedProperty(null);
    navigate(`/admin-dashboard/properties?edit=${property.id}`);
  };

  return (
    <Card className="border border-white/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building className="h-5 w-5 text-primary" />
          הדירות האקטואליות שלנו ({activeProperties.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeProperties.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">אין דירות פנויות כרגע</p>
        ) : (
          <Carousel
            opts={{
              align: "start",
              direction: "rtl",
            }}
            className="w-full"
          >
            <CarouselContent className="-mr-2">
              {activeProperties.map((property) => (
                <CarouselItem key={property.id} className="pr-2 basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                  <PropertyQuickCard 
                    property={property} 
                    onClick={handlePropertyClick}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4" />
            <CarouselNext className="-right-4" />
          </Carousel>
        )}

        {selectedProperty && (
          <PropertyDetailModal
            property={selectedProperty}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onEdit={handleEditProperty}
          />
        )}
      </CardContent>
    </Card>
  );
};
