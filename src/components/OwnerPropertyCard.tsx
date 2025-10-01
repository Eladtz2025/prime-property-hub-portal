import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Users, 
  Calendar, 
  DollarSign,
  AlertTriangle,
  Edit,
  FileText,
  CreditCard
} from 'lucide-react';
import type { PropertyWithTenant } from '@/types/owner-portal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DocumentManager } from './DocumentManager';

interface OwnerPropertyCardProps {
  property: PropertyWithTenant;
  onEdit: (property: PropertyWithTenant) => void;
  onQuickPayment: (property: PropertyWithTenant) => void;
}

export const OwnerPropertyCard: React.FC<OwnerPropertyCardProps> = ({ 
  property, 
  onEdit,
  onQuickPayment
}) => {
  const [showDocuments, setShowDocuments] = useState(false);

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
    <>
      <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
        needsAttention ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20' : ''
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
            </div>

            {/* Tenant Information */}
            {property.tenant ? (
              <div className="bg-white/50 dark:bg-white/5 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{property.tenant.name}</span>
                </div>
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
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 text-center">
                <span className="text-sm text-red-700 dark:text-red-400">אין שוכר פעיל</span>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(property)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDocuments(true)}
              >
                <FileText className="h-4 w-4" />
              </Button>
              {property.tenant && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onQuickPayment(property)}
                >
                  <CreditCard className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Modal */}
      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>מסמכים - {property.address}</DialogTitle>
          </DialogHeader>
          <DocumentManager 
            documents={[]} 
            onDelete={(id) => console.log('Delete document:', id)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};