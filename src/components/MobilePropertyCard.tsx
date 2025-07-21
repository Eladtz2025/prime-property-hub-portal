
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Eye, User, Calendar } from 'lucide-react';
import { Property } from '@/types/property';

interface MobilePropertyCardProps {
  property: Property;
  onViewDetails: (id: string) => void;
}

export const MobilePropertyCard: React.FC<MobilePropertyCardProps> = ({ 
  property, 
  onViewDetails 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-green-100 text-green-800 border-green-200';
      case 'vacant': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'maintenance': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'occupied': return 'תפוס';
      case 'vacant': return 'פנוי';
      case 'maintenance': return 'תחזוקה';
      default: return status;
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <Card className="mb-4 shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 flex-1">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-sm">{property.address}</span>
          </div>
          <Badge className={`${getStatusColor(property.status)} text-xs`}>
            {getStatusText(property.status)}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{property.ownerName}</span>
            {property.ownerPhone && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => window.open(`tel:${property.ownerPhone}`, '_self')}
                className="h-6 px-2"
              >
                <Phone className="h-3 w-3" />
              </Button>
            )}
          </div>

          {property.tenantName && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">שוכר: {property.tenantName}</span>
              {property.tenantPhone && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.open(`tel:${property.tenantPhone}`, '_self')}
                  className="h-6 px-2"
                >
                  <Phone className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {property.monthlyRent && (
            <div className="text-sm font-medium text-primary">
              שכירות: ₪{property.monthlyRent.toLocaleString()}
            </div>
          )}

          {property.leaseEndDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                סיום: {new Date(property.leaseEndDate).toLocaleDateString('he-IL')}
              </span>
            </div>
          )}
        </div>

        <Button 
          onClick={() => onViewDetails(property.id)}
          className="w-full"
          size="sm"
        >
          <Eye className="h-4 w-4 mr-2" />
          צפה בפרטים
        </Button>
      </CardContent>
    </Card>
  );
};
