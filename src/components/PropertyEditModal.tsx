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
import { ImageUpload } from './ImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import { canViewPhoneNumbers, formatPhoneDisplay } from '@/utils/permissions';
import { usePropertyData } from '@/hooks/usePropertyData';
import { supabase } from '@/integrations/supabase/client';

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
    
    // Load images from property_images table when modal opens
    if (isOpen && property.id) {
      loadPropertyImages();
    }
  }, [property, isOpen]);

  const loadPropertyImages = async () => {
    try {
      console.log('🔍 Loading images for property:', property.id);
      const { data, error } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', property.id)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('❌ Error loading images:', error);
        return;
      }

      console.log('✅ Loaded', data?.length || 0, 'images from DB');
      
      if (data && data.length > 0) {
        const images: PropertyImage[] = data.map(img => ({
          id: img.id,
          name: img.alt_text || 'תמונת נכס',
          url: img.image_url,
          isPrimary: img.is_main || false,
          uploadedAt: img.created_at || new Date().toISOString(),
        }));

        setFormData(prev => ({
          ...prev,
          images
        }));
      }
    } catch (error) {
      console.error('❌ Error loading property images:', error);
    }
  };

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
    try {
      setLoading(true);
      
      // Update property
      const { error: propertyError } = await supabase
        .from('properties')
        .update({
          address: formData.address,
          city: formData.city,
          owner_name: formData.ownerName,
          owner_phone: formData.ownerPhone,
          status: formData.status,
          contact_status: formData.contactStatus,
          contact_attempts: formData.contactAttempts,
          last_contact_date: formData.lastContactDate ? new Date(formData.lastContactDate).toISOString() : null,
          contact_notes: formData.contactNotes,
          property_size: formData.propertySize,
          floor: formData.floor,
          rooms: formData.rooms,
          monthly_rent: formData.monthlyRent,
          notes: formData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formData.id);

      if (propertyError) throw propertyError;

      // If tenant info exists, create or update tenant
      if (formData.tenantName || formData.tenantPhone || formData.tenantEmail) {
        const tenantData = {
          property_id: formData.id,
          name: formData.tenantName || '',
          phone: formData.tenantPhone,
          email: formData.tenantEmail,
          monthly_rent: formData.monthlyRent,
          lease_start_date: formData.leaseStartDate,
          lease_end_date: formData.leaseEndDate,
          is_active: true,
        };

        // Check if tenant exists
        const { data: existingTenants } = await supabase
          .from('tenants')
          .select('id')
          .eq('property_id', formData.id)
          .eq('is_active', true);

        if (existingTenants && existingTenants.length > 0) {
          // Update existing tenant
          const { error: tenantError } = await supabase
            .from('tenants')
            .update(tenantData)
            .eq('id', existingTenants[0].id);

          if (tenantError) throw tenantError;
        } else {
          // Create new tenant
          const { error: tenantError } = await supabase
            .from('tenants')
            .insert(tenantData);

          if (tenantError) throw tenantError;
        }
      }

      // Save images to property_images table and storage
      if (formData.images && formData.images.length > 0) {
        console.log('💾 Saving', formData.images.length, 'images to property_images');
        
        // Delete existing images for this property
        const { error: deleteError } = await supabase
          .from('property_images')
          .delete()
          .eq('property_id', formData.id);

        if (deleteError) {
          console.error('❌ Error deleting old images:', deleteError);
        }

        // Insert new images
        for (let i = 0; i < formData.images.length; i++) {
          const image = formData.images[i];
          let imageUrl = image.url;
          
          // If base64, upload to storage first
          if (image.url.startsWith('data:')) {
            console.log('📤 Uploading base64 image to storage:', image.name);
            
            try {
              // Convert base64 to blob
              const response = await fetch(image.url);
              const blob = await response.blob();
              
              // Upload to storage
              const fileExt = image.name.split('.').pop() || 'jpg';
              const fileName = `${formData.id}/${Date.now()}_${i}.${fileExt}`;
              
              const { error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(fileName, blob);

              if (uploadError) {
                console.error('❌ Storage upload error:', uploadError);
                continue;
              }

              // Get public URL
              const { data: { publicUrl } } = supabase.storage
                .from('property-images')
                .getPublicUrl(fileName);
              
              imageUrl = publicUrl;
              console.log('✅ Uploaded to storage:', publicUrl);
            } catch (uploadError) {
              console.error('❌ Error uploading image:', uploadError);
              continue;
            }
          }

          const imageData = {
            property_id: formData.id,
            image_url: imageUrl,
            alt_text: image.name || 'תמונת נכס',
            is_main: image.isPrimary || i === 0,
            order_index: i,
          };

          console.log('💾 Inserting image to DB:', imageData);
          const { error: imageError } = await supabase
            .from('property_images')
            .insert(imageData);

          if (imageError) {
            console.error('❌ Error saving image to DB:', imageError);
          } else {
            console.log('✅ Image saved successfully');
          }
        }
      }

      toast({
        title: "הנכס עודכן בהצלחה",
        description: "השינויים נשמרו במערכת",
      });
      
      onSave(formData);
      onClose();
    } catch (error: any) {
      toast({
        title: "שגיאה בשמירת הנתונים",
        description: error.message,
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
                    step="0.5"
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