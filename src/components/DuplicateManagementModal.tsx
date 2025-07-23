
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
  Users,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { Property } from '../types/property';
import { DuplicateGroup } from '../utils/duplicateDetection';
import { DuplicateMergeManager } from './DuplicateMergeManager';
import { useToast } from "@/hooks/use-toast";

interface DuplicateManagementModalProps {
  duplicateGroups: DuplicateGroup[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateProperty: (property: Property) => void;
  onDeleteProperty: (propertyId: string) => void;
  onViewProperty: (property: Property) => void;
}

export const DuplicateManagementModal: React.FC<DuplicateManagementModalProps> = ({
  duplicateGroups,
  isOpen,
  onClose,
  onUpdateProperty,
  onDeleteProperty,
  onViewProperty
}) => {
  const { toast } = useToast();
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleUpdatePhone = async () => {
    if (!editingProperty || !newPhoneNumber.trim()) return;

    setIsLoading(true);
    try {
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
    } catch (error) {
      toast({
        title: "שגיאה בעדכון",
        description: "לא הצלחנו לעדכן את מספר הטלפון",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMergeProperties = async (primaryProperty: Property, secondaryProperty: Property) => {
    setIsLoading(true);
    try {
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
      onDeleteProperty(secondaryProperty.id);
      
      toast({
        title: "הנכסים מוזגו בהצלחה",
        description: `הנתונים מוזגו לנכס ${primaryProperty.address}`,
      });
    } catch (error) {
      toast({
        title: "שגיאה במיזוג",
        description: "לא הצלחנו למזג את הנכסים",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPropertyInternal = (property: Property) => {
    setViewingProperty(property);
    onViewProperty(property);
  };

  const handleEditPropertyInternal = (property: Property) => {
    setEditingProperty(property);
    setNewPhoneNumber(property.ownerPhone || '');
  };

  const handleBackToMain = () => {
    setViewingProperty(null);
    setEditingProperty(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
                    בחר את הפעולה הרצויה עבור כל קבוצה. ניתן למזג נכסים או לערוך מספרי טלפון.
                  </p>
                </div>

                <div className="grid gap-4">
                  {duplicateGroups.map((group, index) => (
                    <div key={index} className="space-y-4">
                      <DuplicateMergeManager
                        properties={group.properties}
                        phoneNumber={group.phoneNumber}
                        onMerge={handleMergeProperties}
                        isLoading={isLoading}
                      />
                      
                      {/* Individual property actions */}
                      <div className="grid gap-2 ml-4">
                        {group.properties.map((property) => (
                          <div 
                            key={property.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded border-r-4 border-orange-300"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium text-sm">{property.address}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <span className="text-xs text-gray-600">{property.ownerName}</span>
                                  <Badge className={`${getStatusColor(property.status)} text-xs`}>
                                    {getStatusText(property.status)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewPropertyInternal(property)}
                                disabled={isLoading}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPropertyInternal(property)}
                                disabled={isLoading}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Phone Dialog */}
      <Dialog open={!!editingProperty} onOpenChange={() => !isLoading && setEditingProperty(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeft 
                className="h-4 w-4 cursor-pointer hover:text-primary" 
                onClick={handleBackToMain}
              />
              עריכת מספר טלפון
            </DialogTitle>
          </DialogHeader>
          
          {editingProperty && (
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
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              onClick={handleUpdatePhone} 
              disabled={isLoading || !newPhoneNumber.trim()}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור שינויים'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBackToMain}
              disabled={isLoading}
            >
              חזור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
