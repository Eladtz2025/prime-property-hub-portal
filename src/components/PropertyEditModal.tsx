
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Property, PropertyImage } from '../types/property';
import { savePropertyToStorage } from '../utils/propertyStorage';
import { ImageUpload } from './ImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import { canViewPhoneNumbers, formatPhoneDisplay } from '@/utils/permissions';

interface PropertyEditModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProperty: Property) => void;
}

export const PropertyEditModal: React.FC<PropertyEditModalProps> = ({
  property,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Property>(property);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { permissions, hasPermission } = useAuth();
  const canViewPhone = canViewPhoneNumbers(permissions);
  const canEdit = hasPermission('properties', 'update');

  // If user can't edit, don't show the modal
  if (!canEdit) {
    return null;
  }

  useEffect(() => {
    setFormData(property);
  }, [property]);

  const handleInputChange = (field: keyof Property, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      lastUpdated: new Date().toISOString()
    }));
  };

  const handleImagesChange = (images: PropertyImage[]) => {
    setFormData(prev => ({
      ...prev,
      images,
      lastUpdated: new Date().toISOString()
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await savePropertyToStorage(formData);
      
      toast({
        title: "הנכס עודכן בהצלחה",
        description: "השינויים נשמרו",
      });
      
      onSave(formData);
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: "שגיאה בשמירה",
        description: "לא הצלחנו לשמור את השינויים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>עריכת נכס - {property.address}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">פרטי הנכס</TabsTrigger>
            <TabsTrigger value="images">תמונות</TabsTrigger>
            <TabsTrigger value="notes">הערות</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Property Details */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">כתובת</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="city">עיר</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="status">סטטוס</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="occupied">תפוס</SelectItem>
                      <SelectItem value="vacant">פנוי</SelectItem>
                      <SelectItem value="maintenance">תחזוקה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="propertySize">גודל (מ"ר)</Label>
                  <Input
                    id="propertySize"
                    type="number"
                    value={formData.propertySize || ''}
                    onChange={(e) => handleInputChange('propertySize', Number(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="floor">קומה</Label>
                  <Input
                    id="floor"
                    type="number"
                    value={formData.floor || ''}
                    onChange={(e) => handleInputChange('floor', Number(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="rooms">מספר חדרים</Label>
                  <Input
                    id="rooms"
                    type="number"
                    value={formData.rooms || ''}
                    onChange={(e) => handleInputChange('rooms', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Owner & Tenant Details */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ownerName">שם בעל הנכס</Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="ownerPhone">טלפון בעל הנכס</Label>
                  <Input
                    id="ownerPhone"
                    value={canViewPhone ? (formData.ownerPhone || '') : formatPhoneDisplay(formData.ownerPhone, canViewPhone)}
                    onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                    disabled={!canViewPhone}
                    placeholder={!canViewPhone ? "אין הרשאה לצפייה" : ""}
                  />
                </div>
                
                <div>
                  <Label htmlFor="ownerEmail">אימייל בעל הנכס</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={formData.ownerEmail || ''}
                    onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="tenantName">שם השוכר</Label>
                  <Input
                    id="tenantName"
                    value={formData.tenantName || ''}
                    onChange={(e) => handleInputChange('tenantName', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="tenantPhone">טלפון השוכר</Label>
                  <Input
                    id="tenantPhone"
                    value={canViewPhone ? (formData.tenantPhone || '') : formatPhoneDisplay(formData.tenantPhone, canViewPhone)}
                    onChange={(e) => handleInputChange('tenantPhone', e.target.value)}
                    disabled={!canViewPhone}
                    placeholder={!canViewPhone ? "אין הרשאה לצפייה" : ""}
                  />
                </div>
                
                <div>
                  <Label htmlFor="tenantEmail">אימייל השוכר</Label>
                  <Input
                    id="tenantEmail"
                    type="email"
                    value={formData.tenantEmail || ''}
                    onChange={(e) => handleInputChange('tenantEmail', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Financial & Contract Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <Label htmlFor="monthlyRent">שכירות חודשית (₪)</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={formData.monthlyRent || ''}
                  onChange={(e) => handleInputChange('monthlyRent', Number(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="leaseStartDate">תאריך התחלת חוזה</Label>
                <Input
                  id="leaseStartDate"
                  type="date"
                  value={formData.leaseStartDate || ''}
                  onChange={(e) => handleInputChange('leaseStartDate', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="leaseEndDate">תאריך סיום חוזה</Label>
                <Input
                  id="leaseEndDate"
                  type="date"
                  value={formData.leaseEndDate || ''}
                  onChange={(e) => handleInputChange('leaseEndDate', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <div>
              <Label>תמונות הנכס</Label>
              <ImageUpload
                images={formData.images || []}
                onImagesChange={handleImagesChange}
                maxImages={10}
                maxSizePerImage={5}
              />
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div>
              <Label htmlFor="notes">הערות</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={6}
                placeholder="הוסף הערות על הנכס..."
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'שומר...' : 'שמור'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
