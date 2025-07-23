import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Property } from '../types/property';
import { Eye, Edit, Phone, Mail, MessageSquare, User, Calendar, Merge } from 'lucide-react';

interface DuplicateGroup {
  key: string;
  properties: Property[];
  duplicateType: 'phone';
}

interface DuplicateViewModalProps {
  group: DuplicateGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onViewProperty: (property: Property) => void;
  onEditProperty: (property: Property) => void;
  onMergeGroup: (group: DuplicateGroup) => void;
}

export const DuplicateViewModal: React.FC<DuplicateViewModalProps> = ({
  group,
  isOpen,
  onClose,
  onViewProperty,
  onEditProperty,
  onMergeGroup
}) => {
  if (!group) return null;

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

  const getDuplicateTypeText = (type: 'phone') => {
    return 'מספר טלפון זהה';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center justify-between">
            <div>
              <span>כפילויות נמצאו - {getDuplicateTypeText(group.duplicateType)}</span>
              <div className="text-sm text-muted-foreground font-normal">
                {group.properties.length} נכסים כפולים
              </div>
            </div>
            <Button
              onClick={() => onMergeGroup(group)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Merge className="h-4 w-4 ml-1" />
              מזג נכסים
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {group.properties.map((property, index) => (
            <Card key={property.id} className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{property.address}</h3>
                      <Badge className={getStatusColor(property.status)}>
                        {getStatusText(property.status)}
                      </Badge>
                      {index === 0 && (
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          עיקרי
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">בעל הנכס:</span>
                          <span>{property.ownerName}</span>
                        </div>
                        
                        {property.ownerPhone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{property.ownerPhone}</span>
                          </div>
                        )}
                        
                        {property.ownerEmail && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{property.ownerEmail}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {property.tenantName && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">דייר:</span>
                            <span>{property.tenantName}</span>
                          </div>
                        )}
                        
                        {property.leaseEndDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">סיום חוזה:</span>
                            <span>{new Date(property.leaseEndDate).toLocaleDateString('he-IL')}</span>
                          </div>
                        )}
                        
                        {property.monthlyRent && (
                          <div className="text-sm">
                            <span className="font-medium">שכירות חודשית:</span>
                            <span className="mr-2">₪{property.monthlyRent.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {property.notes && (
                      <div className="text-sm bg-muted p-2 rounded">
                        <span className="font-medium">הערות:</span>
                        <p className="mt-1">{property.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mr-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewProperty(property)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditProperty(property)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    {property.ownerPhone && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://wa.me/${property.ownerPhone}`, '_blank')}
                        >
                          <MessageSquare className="h-4 w-4 text-green-600" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`tel:${property.ownerPhone}`, '_self')}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};