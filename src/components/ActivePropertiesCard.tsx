import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building } from 'lucide-react';
import { Property } from '@/types/property';
import { PropertyQuickCard } from './PropertyQuickCard';
import { PropertyDetailModal } from './PropertyDetailModal';

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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {activeProperties.map((property) => (
            <PropertyQuickCard 
              key={property.id} 
              property={property} 
              onClick={handlePropertyClick}
            />
          ))}
        </div>
      )}

      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onEdit={handleEditProperty}
        />
      )}
    </div>
  );
};
