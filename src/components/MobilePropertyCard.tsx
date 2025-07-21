
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Eye, User, Calendar, MessageSquare, Mail, Edit } from 'lucide-react';
import { Property } from '@/types/property';
import { openWhatsApp } from '@/utils/whatsappHelper';

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

  return (
    <Card className="mb-4 shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-sm truncate">{property.address}</span>
          </div>
          <Badge className={`${getStatusColor(property.status)} text-xs flex-shrink-0`}>
            {getStatusText(property.status)}
          </Badge>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium truncate">{property.ownerName}</span>
            </div>
            <div className="flex gap-1">
              {property.ownerPhone && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => openWhatsApp(property.ownerPhone!)}
                    className="h-7 w-7 p-0"
                  >
                    <MessageSquare className="h-3 w-3 text-green-600" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => window.open(`tel:${property.ownerPhone}`, '_self')}
                    className="h-7 w-7 p-0"
                  >
                    <Phone className="h-3 w-3" />
                  </Button>
                </>
              )}
              {property.ownerEmail && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.open(`mailto:${property.ownerEmail}`, '_self')}
                  className="h-7 w-7 p-0"
                >
                  <Mail className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {property.tenantName && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate">שוכר: {property.tenantName}</span>
              </div>
              {property.tenantPhone && (
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => openWhatsApp(property.tenantPhone!)}
                    className="h-7 w-7 p-0"
                  >
                    <MessageSquare className="h-3 w-3 text-green-600" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => window.open(`tel:${property.tenantPhone}`, '_self')}
                    className="h-7 w-7 p-0"
                  >
                    <Phone className="h-3 w-3" />
                  </Button>
                </div>
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

        <div className="flex gap-2">
          <Button 
            onClick={() => onViewDetails(property.id)}
            className="flex-1"
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            צפה בפרטים
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
