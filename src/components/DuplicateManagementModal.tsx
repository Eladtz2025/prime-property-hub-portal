import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Phone, 
  User, 
  MapPin, 
  Eye,
  Edit,
  AlertTriangle,
  Users
} from 'lucide-react';
import { Property } from '../types/property';
import { DuplicateGroup } from '../utils/duplicateDetection';
import { useToast } from "@/hooks/use-toast";

interface DuplicateManagementModalProps {
  duplicateGroups: DuplicateGroup[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateProperty: (property: Property) => void;
  onViewProperty: (property: Property) => void;
}

export const DuplicateManagementModal: React.FC<DuplicateManagementModalProps> = ({
  duplicateGroups,
  isOpen,
  onClose,
  onUpdateProperty,
  onViewProperty
}) => {
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');

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

  const handleUpdatePhone = () => {
    if (!editingProperty || !newPhoneNumber.trim()) return;

    const updatedProperty = {
      ...editingProperty,
      ownerPhone: newPhoneNumber.trim(),
      lastUpdated: new Date().toISOString()
    };

    onUpdateProperty(updatedProperty);
    setEditingProperty(null);
    setNewPhoneNumber('');
    
    toast({
      title: "מספר הטלפון עודכן בהצלחה",
      description: `מספר הטלפון של ${editingProperty.ownerName} עודכן`,
    });
  };

  const handleMergeProperties = (primaryProperty: Property, secondaryProperty: Property) => {
    const mergedProperty = {
      ...primaryProperty,
      // Keep the most complete information
      ownerEmail: primaryProperty.ownerEmail || secondaryProperty.ownerEmail,
      tenantName: primaryProperty.tenantName || secondaryProperty.tenantName,
      tenantPhone: primaryProperty.tenantPhone || secondaryProperty.tenantPhone,
      tenantEmail: primaryProperty.tenantEmail || secondaryProperty.tenantEmail,
      monthlyRent: primaryProperty.monthlyRent || secondaryProperty.monthlyRent,
      leaseStartDate: primaryProperty.leaseStartDate || secondaryProperty.leaseStartDate,
      leaseEndDate: primaryProperty.leaseEndDate || secondaryProperty.leaseEndDate,
      rooms: primaryProperty.rooms || secondaryProperty.rooms,
      floor: primaryProperty.floor || secondaryProperty.floor,
      propertySize: primaryProperty.propertySize || secondaryProperty.propertySize,
      notes: primaryProperty.notes || secondaryProperty.notes,
      lastUpdated: new Date().toISOString()
    };

    onUpdateProperty(mergedProperty);
    
    toast({
      title: "הנכסים מוזגו בהצלחה",
      description: `הנתונים מוזגו לנכס ${primaryProperty.address}`,
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            ניהול כפיליות במספרי טלפון
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {duplicateGroups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">לא נמצאו כפיליות</h3>
              <p className="text-muted-foreground">כל מספרי הטלפון ייחודיים</p>
            </div>
          ) : (
            <>
              <div className="bg-orange-50 border-orange-200 border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-800">
                    נמצאו {duplicateGroups.length} מספרי טלפון כפולים
                  </h3>
                </div>
                <p className="text-sm text-orange-700">
                  בחר קבוצה לניהול הכפיליות
                </p>
              </div>

              <div className="grid gap-4">
                {duplicateGroups.map((group, index) => (
                  <Card key={index} className="border-orange-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Phone className="h-4 w-4" />
                        {group.phoneNumber}
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          {group.properties.length} נכסים
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-3">
                        {group.properties.map((property) => (
                          <div 
                            key={property.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">{property.address}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">{property.ownerName}</span>
                                  <Badge className={getStatusColor(property.status)}>
                                    {getStatusText(property.status)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewProperty(property)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingProperty(property);
                                  setNewPhoneNumber(property.ownerPhone || '');
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (group.properties.length === 2) {
                              handleMergeProperties(group.properties[0], group.properties[1]);
                            }
                          }}
                          disabled={group.properties.length !== 2}
                        >
                          מזג נכסים
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        {editingProperty && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">עריכת מספר טלפון</h3>
              <div className="space-y-4">
                <div>
                  <Label>בעל הנכס</Label>
                  <p className="text-sm text-gray-600">{editingProperty.ownerName}</p>
                </div>
                <div>
                  <Label>כתובת</Label>
                  <p className="text-sm text-gray-600">{editingProperty.address}</p>
                </div>
                <div>
                  <Label htmlFor="phoneNumber">מספר טלפון חדש</Label>
                  <Input
                    id="phoneNumber"
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value)}
                    placeholder="הכנס מספר טלפון"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={handleUpdatePhone}>
                  שמור שינויים
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditingProperty(null);
                    setNewPhoneNumber('');
                  }}
                >
                  ביטול
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
