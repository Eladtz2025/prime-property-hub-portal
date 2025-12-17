import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { Languages, Loader2 } from 'lucide-react';
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface PropertyEditRowProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProperty: Property) => void;
}

export const PropertyEditRow: React.FC<PropertyEditRowProps> = ({
  property,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Property & { title_en?: string; description_en?: string; neighborhood_en?: string }>(property as any);
  const [loading, setLoading] = useState(false);
  const [translatingField, setTranslatingField] = useState<string | null>(null);
  const { toast } = useToast();
  const { permissions, hasPermission } = useAuth();
  const canViewPhone = canViewPhoneNumbers(permissions);
  const canEdit = hasPermission('properties', 'update');
  const queryClient = useQueryClient();

  // Load approved users for agent selection
  const { data: users = [] } = useQuery({
    queryKey: ['approved-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_approved', true)
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  useEffect(() => {
    const updatedProperty = {
      ...property,
      assignedUserId: (property as any).assigned_user_id || (property as any).assignedUserId,
      showOnWebsite: (property as any).show_on_website !== false,
      title_en: '',
      description_en: '',
      neighborhood_en: ''
    };
    setFormData(updatedProperty as any);
    
    if (isOpen && property.id) {
      loadPropertyImages();
      loadPropertyWebsiteFlag();
      loadEnglishFields();
    }
  }, [property, isOpen]);

  const loadEnglishFields = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('title_en, description_en, neighborhood_en')
        .eq('id', property.id)
        .single();

      if (!error && data) {
        setFormData(prev => ({
          ...prev,
          title_en: data.title_en || '',
          description_en: data.description_en || '',
          neighborhood_en: data.neighborhood_en || ''
        }));
      }
    } catch (error) {
      console.error('Error loading English fields:', error);
    }
  };

  const translateField = async (sourceField: string, targetField: string, direction: 'he-en' | 'en-he') => {
    const sourceValue = (formData as any)[sourceField];
    if (!sourceValue || sourceValue.trim() === '') {
      toast({
        title: "אין טקסט לתרגום",
        description: "נא למלא את השדה המקור לפני התרגום",
        variant: "destructive"
      });
      return;
    }

    setTranslatingField(targetField);
    
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { 
          text: sourceValue, 
          targetLanguage: direction === 'he-en' ? 'en' : 'he',
          context: sourceField.includes('title') ? 'property title' : sourceField.includes('description') ? 'property description' : 'neighborhood name'
        }
      });
      
      if (error) throw error;
      
      setFormData(prev => ({
        ...prev,
        [targetField]: data.translatedText || data.translated || ''
      }));
      
      toast({
        title: "תורגם בהצלחה",
        description: direction === 'he-en' ? "הטקסט תורגם לאנגלית" : "הטקסט תורגם לעברית"
      });
    } catch (error: any) {
      console.error('Translation error:', error);
      toast({
        title: "שגיאה בתרגום",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTranslatingField(null);
    }
  };

  const loadPropertyWebsiteFlag = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('show_on_website')
        .eq('id', property.id)
        .single();

      if (!error && data) {
        setFormData(prev => ({
          ...prev,
          showOnWebsite: data.show_on_website !== false
        }));
      }
    } catch (error) {
      console.error('Error loading show_on_website flag:', error);
    }
  };

  const loadPropertyImages = async () => {
    try {
      const { data, error } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', property.id)
        .order('order_index', { ascending: true });

      if (error) return;
      
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
      console.error('Error loading property images:', error);
    }
  };

  const handleInputChange = (field: keyof Property, value: string | number | boolean) => {
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
      
      const { error: propertyError } = await supabase
        .from('properties')
        .update({
          address: formData.address,
          city: formData.city,
          neighborhood: (formData as any).neighborhood || null,
          owner_name: formData.ownerName,
          owner_phone: formData.ownerPhone,
          assigned_user_id: (formData as any).assignedUserId || null,
          status: formData.status,
          contact_status: formData.contactStatus,
          contact_attempts: formData.contactAttempts,
          last_contact_date: formData.lastContactDate ? new Date(formData.lastContactDate).toISOString() : null,
          contact_notes: formData.contactNotes,
          property_size: formData.propertySize,
          floor: formData.floor === 0 ? 0 : (formData.floor || null),
          rooms: formData.rooms,
          monthly_rent: formData.monthlyRent,
          municipal_tax: formData.municipalTax || null,
          building_committee_fee: formData.buildingCommitteeFee || null,
          notes: formData.notes,
          parking: formData.parking || false,
          elevator: formData.elevator || false,
          balcony: formData.balcony || false,
          yard: formData.yard || false,
          balcony_yard_size: formData.balconyYardSize || null,
          bathrooms: (formData as any).bathrooms || null,
          building_floors: (formData as any).buildingFloors || null,
          title: (formData as any).title || null,
          title_en: (formData as any).title_en || null,
          description: (formData as any).description || null,
          description_en: (formData as any).description_en || null,
          acquisition_cost: (formData as any).acquisitionCost || null,
          renovation_costs: (formData as any).renovationCosts || null,
          current_market_value: (formData as any).currentMarketValue || null,
          featured: (formData as any).featured || false,
          show_management_badge: formData.showManagementBadge !== false,
          show_on_website: (formData as any).showOnWebsite !== false,
          neighborhood_en: (formData as any).neighborhood_en || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formData.id);

      if (propertyError) throw propertyError;

      // Handle tenant info
      if (formData.tenantName || formData.tenantPhone) {
        const tenantData = {
          property_id: formData.id,
          name: formData.tenantName || '',
          phone: formData.tenantPhone,
          monthly_rent: formData.monthlyRent,
          lease_start_date: formData.leaseStartDate,
          lease_end_date: formData.leaseEndDate,
          is_active: true,
        };

        const { data: existingTenants } = await supabase
          .from('tenants')
          .select('id')
          .eq('property_id', formData.id)
          .eq('is_active', true);

        if (existingTenants && existingTenants.length > 0) {
          await supabase.from('tenants').update(tenantData).eq('id', existingTenants[0].id);
        } else {
          await supabase.from('tenants').insert(tenantData);
        }
      }

      // Save images
      if (formData.images && formData.images.length > 0) {
        await supabase.from('property_images').delete().eq('property_id', formData.id);

        for (let i = 0; i < formData.images.length; i++) {
          const image = formData.images[i];
          let imageUrl = image.url;
          
          if (image.url.startsWith('data:')) {
            try {
              const response = await fetch(image.url);
              const blob = await response.blob();
              const fileExt = image.name.split('.').pop() || 'jpg';
              const fileName = `${formData.id}/${Date.now()}_${i}.${fileExt}`;
              
              const { error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(fileName, blob);

              if (uploadError) continue;

              const { data: { publicUrl } } = supabase.storage
                .from('property-images')
                .getPublicUrl(fileName);
              
              imageUrl = publicUrl;
            } catch (uploadError) {
              continue;
            }
          }

          await supabase.from('property_images').insert({
            property_id: formData.id,
            image_url: imageUrl,
            alt_text: image.name || 'תמונת נכס',
            is_main: image.isPrimary || i === 0,
            order_index: i,
          });
        }
      }

      toast({
        title: "הנכס עודכן בהצלחה",
        description: "השינויים נשמרו במערכת",
      });
      
      queryClient.invalidateQueries({ queryKey: ['public-property', property.id] });
      queryClient.invalidateQueries({ queryKey: ['public-properties'] });
      
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

  if (!canEdit) return null;

  return (
    <Collapsible open={isOpen}>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="bg-muted/30 border-t-2 border-primary/20 p-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="notes">הערות</TabsTrigger>
              <TabsTrigger value="images">תמונות</TabsTrigger>
              <TabsTrigger value="details">פרטי הנכס</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              {/* Row 1: Owner & Tenant Info (horizontal) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 rounded-lg border bg-background/50">
                {/* Tenant Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">שוכר</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="assignedUser" className="text-xs">סוכן מטפל</Label>
                      <Select 
                        value={(formData as any).assignedUserId || 'none'} 
                        onValueChange={(value) => handleInputChange('assignedUserId' as any, value === 'none' ? null : value)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="בחר סוכן" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">אין סוכן</SelectItem>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tenantPhone" className="text-xs">טלפון</Label>
                      <Input
                        id="tenantPhone"
                        value={canViewPhone ? (formData.tenantPhone || '') : formatPhoneDisplay(formData.tenantPhone, canViewPhone)}
                        onChange={(e) => handleInputChange('tenantPhone', e.target.value)}
                        disabled={!canViewPhone}
                        dir="ltr"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tenantName" className="text-xs">שם</Label>
                      <Input
                        id="tenantName"
                        value={formData.tenantName || ''}
                        onChange={(e) => handleInputChange('tenantName', e.target.value)}
                        dir="rtl"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Owner Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">בעל הנכס</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="ownerEmail" className="text-xs">אימייל</Label>
                      <Input
                        id="ownerEmail"
                        type="email"
                        value={formData.ownerEmail || ''}
                        onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                        dir="ltr"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerPhone" className="text-xs">טלפון</Label>
                      <Input
                        id="ownerPhone"
                        value={canViewPhone ? (formData.ownerPhone || '') : formatPhoneDisplay(formData.ownerPhone, canViewPhone)}
                        onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                        disabled={!canViewPhone}
                        dir="ltr"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerName" className="text-xs">שם</Label>
                      <Input
                        id="ownerName"
                        value={formData.ownerName}
                        onChange={(e) => handleInputChange('ownerName', e.target.value)}
                        dir="rtl"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Property Details */}
              <div className="space-y-3">
                {/* Address, City, Neighborhood */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor="neighborhood_en" className="text-xs">Neighborhood</Label>
                    <Input
                      id="neighborhood_en"
                      value={(formData as any).neighborhood_en || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, neighborhood_en: e.target.value }))}
                      placeholder="Old North..."
                      dir="ltr"
                      className="h-8 text-sm"
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="neighborhood" className="text-xs">שכונה</Label>
                    <Select 
                      value={(formData as any).neighborhood || ''} 
                      onValueChange={(value) => {
                        handleInputChange('neighborhood' as any, value);
                        // Auto-update English neighborhood
                        const neighborhoodMap: Record<string, string> = {
                          'מרכז': 'Center',
                          'הצפון הישן': 'Old North',
                          'הצפון החדש': 'New North',
                          'רוטשילד': 'Rothschild',
                          'דרום': 'South'
                        };
                        setFormData(prev => ({ ...prev, neighborhood_en: neighborhoodMap[value] || '' }));
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="בחר שכונה" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="מרכז">מרכז</SelectItem>
                        <SelectItem value="הצפון הישן">הצפון הישן</SelectItem>
                        <SelectItem value="הצפון החדש">הצפון החדש</SelectItem>
                        <SelectItem value="רוטשילד">רוטשילד</SelectItem>
                        <SelectItem value="דרום">דרום</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-xs">עיר</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      dir="rtl"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address" className="text-xs">כתובת (פנימי)</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      dir="rtl"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Property specs: Rooms, Bath, Floor, Size + Features + Toggles */}
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2 items-end">
                  <div className="flex items-center gap-1 p-1.5 border rounded bg-background h-8">
                    <Switch
                      id="showManagementBadge"
                      checked={formData.showManagementBadge !== false}
                      onCheckedChange={(checked) => handleInputChange('showManagementBadge', checked)}
                      className="scale-75"
                    />
                    <Label htmlFor="showManagementBadge" className="cursor-pointer text-xs">תג</Label>
                  </div>
                  <div className="flex items-center gap-1 p-1.5 border rounded bg-background h-8">
                    <Switch
                      id="showOnWebsite"
                      checked={(formData as any).showOnWebsite !== false}
                      onCheckedChange={(checked) => handleInputChange('showOnWebsite' as any, checked)}
                      className="scale-75"
                    />
                    <Label htmlFor="showOnWebsite" className="cursor-pointer text-xs">באתר</Label>
                  </div>
                  <div>
                    <Label className="text-xs">תוספות</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full h-8 text-xs justify-start">
                          תוספות ({[formData.parking, formData.elevator, formData.balcony, formData.mamad, formData.yard].filter(Boolean).length})
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40 p-3" align="start">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="parking"
                              checked={formData.parking || false}
                              onCheckedChange={(checked) => handleInputChange('parking', checked)}
                            />
                            <Label htmlFor="parking" className="text-sm cursor-pointer">חניה</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="elevator"
                              checked={formData.elevator || false}
                              onCheckedChange={(checked) => handleInputChange('elevator', checked)}
                            />
                            <Label htmlFor="elevator" className="text-sm cursor-pointer">מעלית</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="balcony"
                              checked={formData.balcony || false}
                              onCheckedChange={(checked) => handleInputChange('balcony', checked)}
                            />
                            <Label htmlFor="balcony" className="text-sm cursor-pointer">מרפסת</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="mamad"
                              checked={formData.mamad || false}
                              onCheckedChange={(checked) => handleInputChange('mamad', checked)}
                            />
                            <Label htmlFor="mamad" className="text-sm cursor-pointer">ממ"ד</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="yard"
                              checked={formData.yard || false}
                              onCheckedChange={(checked) => handleInputChange('yard', checked)}
                            />
                            <Label htmlFor="yard" className="text-sm cursor-pointer">חצר</Label>
                          </div>
                          {(formData.balcony || formData.yard) && (
                            <div className="mt-3 border-t pt-3">
                              <Label className="text-xs mb-1 block">גודל מרפסת/חצר (מ"ר)</Label>
                              <Input
                                type="number"
                                className="h-7 text-sm"
                                placeholder="0"
                                value={formData.balconyYardSize || ''}
                                onChange={(e) => handleInputChange('balconyYardSize', e.target.value ? Number(e.target.value) : null)}
                              />
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="propertySize" className="text-xs">מ"ר</Label>
                    <Input
                      id="propertySize"
                      type="number"
                      className="text-center h-8 text-sm"
                      value={formData.propertySize || ''}
                      onChange={(e) => handleInputChange('propertySize', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="floor" className="text-xs">קומה</Label>
                    <Input
                      id="floor"
                      type="number"
                      min="0"
                      className="text-center h-8 text-sm"
                      value={formData.floor === 0 ? '0' : (formData.floor || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleInputChange('floor', val === '' ? null : Number(val));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms" className="text-xs">רחצה</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min="0"
                      className="text-center h-8 text-sm"
                      value={(formData as any).bathrooms || ''}
                      onChange={(e) => handleInputChange('bathrooms' as any, e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rooms" className="text-xs">חדרים</Label>
                    <Input
                      id="rooms"
                      type="number"
                      step="0.5"
                      className="text-center h-8 text-sm"
                      value={formData.rooms || ''}
                      onChange={(e) => handleInputChange('rooms', Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Status, Rent, Fees, Dates */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  <div>
                    <Label htmlFor="leaseEndDate" className="text-xs">סיום חוזה</Label>
                    <Input
                      id="leaseEndDate"
                      type="date"
                      value={formData.leaseEndDate || ''}
                      onChange={(e) => handleInputChange('leaseEndDate', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="leaseStartDate" className="text-xs">התחלת חוזה</Label>
                    <Input
                      id="leaseStartDate"
                      type="date"
                      value={formData.leaseStartDate || ''}
                      onChange={(e) => handleInputChange('leaseStartDate', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="buildingCommitteeFee" className="text-xs">ועד בית</Label>
                    <Input
                      id="buildingCommitteeFee"
                      type="number"
                      value={formData.buildingCommitteeFee || ''}
                      onChange={(e) => handleInputChange('buildingCommitteeFee', e.target.value ? Number(e.target.value) : null)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="municipalTax" className="text-xs">ארנונה</Label>
                    <Input
                      id="municipalTax"
                      type="number"
                      value={formData.municipalTax || ''}
                      onChange={(e) => handleInputChange('municipalTax', e.target.value ? Number(e.target.value) : null)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthlyRent" className="text-xs">שכ"ד</Label>
                    <Input
                      id="monthlyRent"
                      type="number"
                      value={formData.monthlyRent || ''}
                      onChange={(e) => handleInputChange('monthlyRent', Number(e.target.value))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-xs">סטטוס</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="occupied">תפוס</SelectItem>
                        <SelectItem value="vacant">פנוי</SelectItem>
                        <SelectItem value="maintenance">תחזוקה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Title HE/EN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center gap-1">
                      <Label htmlFor="title_en" className="text-xs flex-1">Title</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-5 px-1 text-xs"
                        onClick={() => translateField('title_en', 'title', 'en-he')}
                        disabled={translatingField === 'title'}
                      >
                        {translatingField === 'title' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                        <span className="mr-1">→HE</span>
                      </Button>
                    </div>
                    <Input
                      id="title_en"
                      value={(formData as any).title_en || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                      placeholder="Beautiful Garden Apartment"
                      dir="ltr"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <Label htmlFor="title" className="text-xs flex-1">כותרת</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-5 px-1 text-xs"
                        onClick={() => translateField('title', 'title_en', 'he-en')}
                        disabled={translatingField === 'title_en'}
                      >
                        {translatingField === 'title_en' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                        <span className="mr-1">→EN</span>
                      </Button>
                    </div>
                    <Input
                      id="title"
                      value={(formData as any).title || ''}
                      onChange={(e) => handleInputChange('title' as any, e.target.value)}
                      placeholder="דירת גן מהממת בצפון הישן"
                      dir="rtl"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Description HE/EN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center gap-1">
                      <Label htmlFor="description_en" className="text-xs flex-1">Description</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-5 px-1 text-xs"
                        onClick={() => translateField('description_en', 'description', 'en-he')}
                        disabled={translatingField === 'description'}
                      >
                        {translatingField === 'description' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                        <span className="mr-1">→HE</span>
                      </Button>
                    </div>
                    <Textarea
                      id="description_en"
                      value={(formData as any).description_en || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                      placeholder="3 rooms with garden access..."
                      rows={2}
                      dir="ltr"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <Label htmlFor="description" className="text-xs flex-1">תיאור</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-5 px-1 text-xs"
                        onClick={() => translateField('description', 'description_en', 'he-en')}
                        disabled={translatingField === 'description_en'}
                      >
                        {translatingField === 'description_en' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                        <span className="mr-1">→EN</span>
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      value={(formData as any).description || ''}
                      onChange={(e) => handleInputChange('description' as any, e.target.value)}
                      placeholder="3 חדרים עם גישה לחצר..."
                      rows={2}
                      dir="rtl"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-4">
              <ImageUpload
                images={formData.images || []}
                onImagesChange={handleImagesChange}
                maxImages={10}
                maxSizePerImage={50}
              />
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={6}
                placeholder="הוסף הערות על הנכס..."
              />
            </TabsContent>
          </Tabs>

          {/* Footer with save/cancel */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'שומר...' : 'שמור שינויים'}
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
