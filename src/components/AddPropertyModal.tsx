import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Property } from '../types/property';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyAdded: (property: Property) => void;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  isOpen,
  onClose,
  onPropertyAdded
}) => {
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    tenantName: '',
    tenantPhone: '',
    tenantEmail: '',
    status: 'vacant' as Property['status'],
    monthlyRent: '',
    leaseStartDate: '',
    leaseEndDate: '',
    rooms: '',
    propertySize: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newProperty: Property = {
        id: `property-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        address: formData.address,
        city: formData.city,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone || undefined,
        ownerEmail: formData.ownerEmail || undefined,
        tenantName: formData.tenantName || undefined,
        tenantPhone: formData.tenantPhone || undefined,
        tenantEmail: formData.tenantEmail || undefined,
        status: formData.status,
        monthlyRent: formData.monthlyRent ? parseFloat(formData.monthlyRent) : undefined,
        leaseStartDate: formData.leaseStartDate || undefined,
        leaseEndDate: formData.leaseEndDate || undefined,
        rooms: formData.rooms ? parseFloat(formData.rooms) : undefined,
        propertySize: formData.propertySize ? parseFloat(formData.propertySize) : undefined,
        notes: formData.notes || undefined,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      // Here you would typically save to your backend
      // For now, we'll use local storage and notify parent
      onPropertyAdded(newProperty);
      
      // Reset form
      setFormData({
        address: '',
        city: '',
        ownerName: '',
        ownerPhone: '',
        ownerEmail: '',
        tenantName: '',
        tenantPhone: '',
        tenantEmail: '',
        status: 'vacant',
        monthlyRent: '',
        leaseStartDate: '',
        leaseEndDate: '',
        rooms: '',
        propertySize: '',
        notes: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding property:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>הוספת נכס חדש</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">פרטי הנכס</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">כתובת *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="רחוב ומספר בית"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="city">עיר *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="תל אביב"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">סטטוס</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant">פנוי</SelectItem>
                    <SelectItem value="occupied">תפוס</SelectItem>
                    <SelectItem value="maintenance">תחזוקה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="rooms">מספר חדרים</Label>
                <Input
                  id="rooms"
                  type="number"
                  step="0.5"
                  value={formData.rooms}
                  onChange={(e) => handleInputChange('rooms', e.target.value)}
                  placeholder="3.5"
                />
              </div>
              
              <div>
                <Label htmlFor="propertySize">גודל (מ״ר)</Label>
                <Input
                  id="propertySize"
                  type="number"
                  value={formData.propertySize}
                  onChange={(e) => handleInputChange('propertySize', e.target.value)}
                  placeholder="80"
                />
              </div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">פרטי הבעלים</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ownerName">שם הבעלים *</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  placeholder="שם מלא"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="ownerPhone">טלפון בעלים</Label>
                <Input
                  id="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                  placeholder="050-1234567"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="ownerEmail">אימייל בעלים</Label>
              <Input
                id="ownerEmail"
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Tenant Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">פרטי השוכר (אופציונלי)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tenantName">שם השוכר</Label>
                <Input
                  id="tenantName"
                  value={formData.tenantName}
                  onChange={(e) => handleInputChange('tenantName', e.target.value)}
                  placeholder="שם מלא"
                />
              </div>
              
              <div>
                <Label htmlFor="tenantPhone">טלפון שוכר</Label>
                <Input
                  id="tenantPhone"
                  value={formData.tenantPhone}
                  onChange={(e) => handleInputChange('tenantPhone', e.target.value)}
                  placeholder="050-1234567"
                />
              </div>
            </div>
          </div>

          {/* Lease Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">פרטי השכירות</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="monthlyRent">שכר דירה חודשי (₪)</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={formData.monthlyRent}
                  onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                  placeholder="5000"
                />
              </div>
              
              <div>
                <Label htmlFor="leaseStartDate">תחילת חוזה</Label>
                <Input
                  id="leaseStartDate"
                  type="date"
                  value={formData.leaseStartDate}
                  onChange={(e) => handleInputChange('leaseStartDate', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="leaseEndDate">סיום חוזה</Label>
                <Input
                  id="leaseEndDate"
                  type="date"
                  value={formData.leaseEndDate}
                  onChange={(e) => handleInputChange('leaseEndDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="הערות נוספות על הנכס..."
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'שומר...' : 'הוסף נכס'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};