import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Users, 
  Calendar, 
  DollarSign,
  AlertTriangle,
  Eye,
  Edit
} from 'lucide-react';
import type { PropertyWithTenant } from '@/types/owner-portal';

interface PropertyCardProps {
  property: PropertyWithTenant;
  detailed?: boolean;
  onView?: (property: PropertyWithTenant) => void;
  onEdit?: (property: PropertyWithTenant) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property, 
  detailed = false,
  onView,
  onEdit 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-green-500 text-white';
      case 'vacant': return 'bg-red-500 text-white';
      case 'maintenance': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'occupied': return 'מושכר';
      case 'vacant': return 'פנוי';
      case 'maintenance': return 'תחזוקה';
      default: return 'לא ידוע';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'לא מוגדר';
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'לא מוגדר';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const needsAttention = 
    property.status === 'maintenance' || 
    property.contact_status === 'needs_callback';

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${
      needsAttention ? 'border-yellow-300 bg-yellow-50' : ''
    }`}>
      {needsAttention && (
        <div className="absolute top-2 right-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Address and Status */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-lg leading-tight">{property.address}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                {property.city}
              </div>
            </div>
            <Badge className={getStatusColor(property.status)}>
              {getStatusText(property.status)}
            </Badge>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {property.rooms && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">חדרים:</span>
                <span className="font-medium">{property.rooms}</span>
              </div>
            )}
            {property.floor && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">קומה:</span>
                <span className="font-medium">{property.floor}</span>
              </div>
            )}
            {property.property_size && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">גודל:</span>
                <span className="font-medium">{property.property_size} מ"ר</span>
              </div>
            )}
          </div>

          {/* Tenant Information */}
          {property.tenant ? (
            <div className="bg-white/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{property.tenant.name}</span>
              </div>
              {detailed && (
                <>
                  {property.tenant.monthly_rent && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        שכירות: {formatCurrency(property.tenant.monthly_rent)}
                      </span>
                    </div>
                  )}
                  {property.tenant.lease_end_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">
                        סיום חוזה: {formatDate(property.tenant.lease_end_date)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <span className="text-sm text-red-700">אין שוכר פעיל</span>
            </div>
          )}

          {/* Financial Summary */}
          {detailed && property.financial_summary && (
            <div className="bg-green-50 rounded-lg p-3 space-y-1">
              <div className="text-sm font-medium text-green-800">סיכום פיננסי חודשי</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-green-600">הכנסות: </span>
                  <span className="font-medium">
                    {formatCurrency(property.financial_summary.total_income)}
                  </span>
                </div>
                <div>
                  <span className="text-red-600">הוצאות: </span>
                  <span className="font-medium">
                    {formatCurrency(property.financial_summary.total_expenses)}
                  </span>
                </div>
              </div>
              <div className="pt-1 border-t border-green-200">
                <span className="text-green-800 font-medium">רווח נקי: </span>
                <span className="font-bold">
                  {formatCurrency(property.financial_summary.net_profit)}
                </span>
              </div>
            </div>
          )}

          {/* Market Value */}
          {detailed && property.current_market_value && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-800">שווי שוק נוכחי</div>
              <div className="text-lg font-bold text-blue-900">
                {formatCurrency(property.current_market_value)}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onView?.(property)}
            >
              <Eye className="h-4 w-4 mr-1" />
              צפה
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onEdit?.(property)}
            >
              <Edit className="h-4 w-4 mr-1" />
              ערוך
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};