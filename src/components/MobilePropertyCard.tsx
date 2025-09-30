
import React, { memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Eye, User, Calendar, MessageSquare, Mail, Edit } from 'lucide-react';
import { Property } from '@/types/property';
import { SearchHighlight } from './SearchHighlight';
import { sendWhatsAppMessage } from '@/utils/whatsappHelper';
import { useAuth } from '@/contexts/AuthContext';
import { canViewPhoneNumbers, formatPhoneDisplay } from '@/utils/permissions';

interface MobilePropertyCardProps {
  property: Property;
  onViewDetails: (id: string) => void;
  ownerPropertyCount?: number;
  searchTerm?: string;
}

export const MobilePropertyCard: React.FC<MobilePropertyCardProps> = memo(({ 
  property, 
  onViewDetails,
  ownerPropertyCount = 1,
  searchTerm = ''
}) => {
  const { permissions } = useAuth();
  const canViewPhone = canViewPhoneNumbers(permissions);
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
      case 'unknown': return 'לא ידוע';
      default: return 'לא ידוע';
    }
  };

  return (
    <Card className="mb-3 shadow-card hover:shadow-elevated transition-all duration-200 bg-card border border-border/50 rounded-xl overflow-hidden relative isolate">
      <CardContent className="p-4 space-y-3">
        {/* Address and Status Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-sm text-foreground truncate block">
              <SearchHighlight text={property.address} searchTerm={searchTerm} />
            </span>
          </div>
          <Badge className={`${getStatusColor(property.status)} text-xs px-2 py-1 flex-shrink-0 whitespace-nowrap`}>
            {getStatusText(property.status)}
          </Badge>
        </div>

        {/* Owner Information Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground truncate block">
                <SearchHighlight text={property.ownerName} searchTerm={searchTerm} />
              </span>
              {ownerPropertyCount > 1 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 flex-shrink-0 whitespace-nowrap">
                  {ownerPropertyCount} נכסים
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {property.ownerPhone && canViewPhone && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    const whatsappUrl = `https://wa.me/972${property.ownerPhone!.replace(/^0/, '')}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="h-9 w-9 p-0 flex-shrink-0"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-green-600" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.open(`tel:${property.ownerPhone}`, '_self')}
                  className="h-9 w-9 p-0 flex-shrink-0"
                >
                  <Phone className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            {property.ownerEmail && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => window.open(`mailto:${property.ownerEmail}`, '_self')}
                className="h-9 w-9 p-0 flex-shrink-0"
              >
                <Mail className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Tenant Information Row */}
        {property.tenantName && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground truncate block">
                שוכר: <SearchHighlight text={property.tenantName} searchTerm={searchTerm} />
              </span>
            </div>
            {property.tenantPhone && canViewPhone && (
              <div className="flex gap-1 flex-shrink-0">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    const whatsappUrl = `https://wa.me/972${property.tenantPhone!.replace(/^0/, '')}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="h-9 w-9 p-0 flex-shrink-0"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-green-600" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.open(`tel:${property.tenantPhone}`, '_self')}
                  className="h-9 w-9 p-0 flex-shrink-0"
                >
                  <Phone className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Rent Information */}
        {property.monthlyRent && property.monthlyRent > 0 && (
          <div className="text-sm font-medium text-primary">
            שכירות: ₪{property.monthlyRent.toLocaleString('he-IL')}
          </div>
        )}

        {/* Lease End Date */}
        {property.leaseEndDate && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-foreground">
              סיום: {new Date(property.leaseEndDate).toLocaleDateString('he-IL')}
            </span>
          </div>
        )}

        {/* View Details Button */}
        <div className="pt-2">
          <Button 
            onClick={() => onViewDetails(property.id)}
            className="w-full h-10"
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            צפה בפרטים
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
