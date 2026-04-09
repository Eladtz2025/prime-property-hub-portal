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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Property, PropertyImage } from '../types/property';
import { ImageUpload } from './ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { phoneSchema, emailSchema, validateField } from '@/utils/formValidation';
import { cn } from '@/lib/utils';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyAdded: (property: Omit<Property, 'id'>) => Promise<string>;
}

type OwnerSourceType = 'manual' | 'existing_owner' | 'existing_broker';

interface ExistingOwner {
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  isOpen,
  onClose,
  onPropertyAdded
}) => {
  const [formData, setFormData] = useState({
    // Basic property
    address: '',
    city: 'תל אביב-יפו',
    property_type: 'rental' as 'rental' | 'sale' | 'management' | 'project' | 'tracked_project',
    title: '',
    description: '',
    status: 'vacant' as Property['status'],
    
    // Property features
    rooms: '',
    bathrooms: '',
    propertySize: '',
    floor: '',
    buildingFloors: '',
    parking: false,
    elevator: false,
    balcony: false,
    yard: false,
    balconyYardSize: '',
    
    // Owner
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    
    // Agent
    assignedUserId: null as string | null,
    
    // Tenant
    tenantName: '',
    tenantPhone: '',
    
    // Rental/Sale
    monthlyRent: '',
    leaseStartDate: '',
    leaseEndDate: '',
    municipalTax: '',
    buildingCommitteeFee: '',
    acquisitionCost: '',
    renovationCosts: '',
    currentMarketValue: '',
    featured: false,
    
    // Project-specific
    roomsRange: '',
    sizeRange: '',
    unitsCount: '',
    hasStorage: false,
    projectStatus: 'under_construction' as 'pre_sale' | 'under_construction' | 'ready',
    trackingUrl: '',
    
    // Notes
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<PropertyImage[]>([]);
  const { logActivity } = useActivityLogger();
  const { toast } = useToast();
  const [errors, setErrors] = useState<{ ownerPhone?: string; ownerEmail?: string; tenantPhone?: string }>({});
  const [touched, setTouched] = useState<{ ownerPhone?: boolean; ownerEmail?: boolean; tenantPhone?: boolean }>({});
  const [ownerSource, setOwnerSource] = useState<OwnerSourceType>('manual');

  // Load existing owners (distinct from properties table)
  const { data: existingOwners = [] } = useQuery({
    queryKey: ['existing-owners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('owner_name, owner_phone, owner_email')
        .not('owner_name', 'is', null)
        .not('owner_name', 'eq', '');
      
      if (error) throw error;
      
      // Deduplicate by name+phone
      const seen = new Set<string>();
      const unique: ExistingOwner[] = [];
      for (const row of data || []) {
        const key = `${row.owner_name}-${row.owner_phone || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push({
            ownerName: row.owner_name || '',
            ownerPhone: row.owner_phone || '',
            ownerEmail: row.owner_email || '',
          });
        }
      }
      return unique.sort((a, b) => a.ownerName.localeCompare(b.ownerName, 'he'));
    },
    enabled: isOpen,
  });

  // Load existing brokers
  const { data: existingBrokers = [] } = useQuery({
    queryKey: ['existing-brokers-for-modal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brokers')
        .select('id, name, phone, office_name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  const handleFieldBlur = (field: 'ownerPhone' | 'ownerEmail' | 'tenantPhone') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = formData[field] || '';
    let error: string | null = null;
    
    if (field === 'ownerPhone' || field === 'tenantPhone') {
      error = validateField(phoneSchema, value);
    } else if (field === 'ownerEmail') {
      error = validateField(emailSchema, value);
    }
    
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const isTrackedProject = formData.property_type === 'tracked_project';
    
    if (isTrackedProject) {
      if (!formData.trackingUrl.trim() || !formData.city.trim()) {
        toast({
          title: "שגיאה",
          description: "יש למלא קישור לעמוד הפרויקט ועיר",
          variant: "destructive"
        });
        return;
      }
    } else if (!formData.address.trim() || !formData.city.trim() || !formData.ownerName.trim()) {
      toast({
        title: "שגיאה",
        description: "יש למלא כתובת, עיר ושם בעלים",
        variant: "destructive"
      });
      return;
    }

    // Validate phone and email fields
    const ownerPhoneError = validateField(phoneSchema, formData.ownerPhone);
    const ownerEmailError = validateField(emailSchema, formData.ownerEmail);
    const tenantPhoneError = validateField(phoneSchema, formData.tenantPhone);
    
    setTouched({ ownerPhone: true, ownerEmail: true, tenantPhone: true });
    setErrors({ 
      ownerPhone: ownerPhoneError || undefined, 
      ownerEmail: ownerEmailError || undefined, 
      tenantPhone: tenantPhoneError || undefined 
    });
    
    if (ownerPhoneError || ownerEmailError || tenantPhoneError) {
      toast({
        title: "שגיאה בטופס",
        description: "אנא תקן את השגיאות לפני השמירה",
        variant: "destructive"
      });
      return;
    }

    // Date validation
    if (formData.leaseStartDate && formData.leaseEndDate) {
      if (new Date(formData.leaseEndDate) <= new Date(formData.leaseStartDate)) {
        toast({
          title: "שגיאה",
          description: "תאריך סיום החוזה חייב להיות אחרי תאריך ההתחלה",
          variant: "destructive"
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const actualPropertyType = isTrackedProject ? 'project' : formData.property_type;
      
      const newProperty: Omit<Property, 'id'> & any = {
        // Basic
        address: isTrackedProject ? (formData.address.trim() || formData.title.trim() || 'פרויקט מעקב') : formData.address.trim(),
        city: formData.city,
        property_type: actualPropertyType,
        title: formData.title || undefined,
        description: formData.description || undefined,
        status: (actualPropertyType === 'project') ? 'unknown' : formData.status,
        contactStatus: 'not_contacted' as const,
        contactAttempts: 0,
        
        // Features (skip for tracked projects)
        ...(isTrackedProject ? {} : {
          rooms: formData.rooms ? parseFloat(formData.rooms) : undefined,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
          propertySize: formData.propertySize ? parseFloat(formData.propertySize) : undefined,
          floor: formData.floor ? parseInt(formData.floor) : undefined,
          buildingFloors: formData.buildingFloors ? parseInt(formData.buildingFloors) : undefined,
          parking: formData.parking,
          elevator: formData.elevator,
          balcony: formData.balcony,
          yard: formData.yard,
          balconyYardSize: (formData.balcony || formData.yard) && formData.balconyYardSize ? parseFloat(formData.balconyYardSize) : undefined,
        }),
        
        // Owner
        ownerName: isTrackedProject ? (formData.ownerName.trim() || 'יזם') : formData.ownerName.trim(),
        ownerPhone: formData.ownerPhone || undefined,
        ownerEmail: formData.ownerEmail || undefined,
        
        // Agent
        assigned_user_id: formData.assignedUserId || undefined,
        
        // Tenant
        tenantName: formData.tenantName || undefined,
        tenantPhone: formData.tenantPhone || undefined,
        
        // Rental/Sale
        monthlyRent: formData.monthlyRent ? parseFloat(formData.monthlyRent) : undefined,
        leaseStartDate: formData.leaseStartDate || undefined,
        leaseEndDate: formData.leaseEndDate || undefined,
        municipalTax: formData.municipalTax ? parseFloat(formData.municipalTax) : undefined,
        buildingCommitteeFee: formData.buildingCommitteeFee ? parseFloat(formData.buildingCommitteeFee) : undefined,
        acquisitionCost: formData.acquisitionCost ? parseFloat(formData.acquisitionCost) : undefined,
        renovationCosts: formData.renovationCosts ? parseFloat(formData.renovationCosts) : undefined,
        currentMarketValue: formData.currentMarketValue ? parseFloat(formData.currentMarketValue) : undefined,
        featured: formData.featured,
        
        // Project-specific
        roomsRange: isTrackedProject ? undefined : (formData.roomsRange || undefined),
        sizeRange: isTrackedProject ? undefined : (formData.sizeRange || undefined),
        unitsCount: isTrackedProject ? undefined : (formData.unitsCount ? parseInt(formData.unitsCount) : undefined),
        hasStorage: isTrackedProject ? false : formData.hasStorage,
        projectStatus: (actualPropertyType === 'project' && !isTrackedProject) ? formData.projectStatus : undefined,
        trackingUrl: (actualPropertyType === 'project' || isTrackedProject) ? (formData.trackingUrl || undefined) : undefined,
        
        // Notes
        notes: formData.notes || undefined,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      onPropertyAdded(newProperty);
      
      // Save images if uploaded
      if (uploadedImages.length > 0) {
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('address', formData.address.trim())
          .eq('city', formData.city)
          .order('created_at', { ascending: false })
          .limit(1);

        if (properties && properties.length > 0) {
          const propertyId = properties[0].id;
          
          const imageInserts = uploadedImages.map((img, index) => ({
            property_id: propertyId,
            image_url: img.url,
            order_index: index,
            is_main: img.isPrimary,
            alt_text: img.name
          }));

          const { error: imageError } = await supabase
            .from('property_images')
            .insert(imageInserts);

          if (imageError) {
            logger.error('Error saving images:', imageError, 'AddPropertyModal');
            toast({
              title: "שגיאה בשמירת תמונות",
              description: "הנכס נשמר אך התמונות לא נשמרו",
              variant: "destructive"
            });
          } else {
            toast({
              title: "הצלחה!",
              description: `הנכס נוסף עם ${uploadedImages.length} תמונות`,
            });
          }
        }
      } else {
        toast({
          title: "הנכס נוסף בהצלחה!",
          description: `הנכס ${newProperty.address} נוסף למערכת`,
        });
      }

      // Reset form
      setFormData({
        address: '',
        city: 'תל אביב-יפו',
        property_type: 'rental',
        title: '',
        description: '',
        status: 'vacant',
        rooms: '',
        bathrooms: '',
        propertySize: '',
        floor: '',
        buildingFloors: '',
        parking: false,
        elevator: false,
        balcony: false,
        yard: false,
        balconyYardSize: '',
        ownerName: '',
        ownerPhone: '',
        ownerEmail: '',
        assignedUserId: null,
        tenantName: '',
        tenantPhone: '',
        monthlyRent: '',
        leaseStartDate: '',
        leaseEndDate: '',
        municipalTax: '',
        buildingCommitteeFee: '',
        acquisitionCost: '',
        renovationCosts: '',
        currentMarketValue: '',
        featured: false,
        roomsRange: '',
        sizeRange: '',
        unitsCount: '',
        hasStorage: false,
        projectStatus: 'under_construction',
        trackingUrl: '',
        notes: ''
      });
      setUploadedImages([]);
      
    } catch (error) {
      logger.error('Error adding property:', error, 'AddPropertyModal');
      toast({
        title: "שגיאה בהוספת נכס",
        description: "אנא נסה שוב",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    if (typeof value === 'boolean') {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>הוספת נכס חדש</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Accordion type="single" collapsible defaultValue="property" className="w-full">
            {/* Property Details - Merged Basic + Features */}
            <AccordionItem value="property">
              <AccordionTrigger>🏠 פרטי הנכס</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {/* Row 1: Property Type, Status, City */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="property_type">סוג נכס *</Label>
                    <Select value={formData.property_type} onValueChange={(value) => handleInputChange('property_type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rental">השכרה</SelectItem>
                        <SelectItem value="sale">מכירה</SelectItem>
                        <SelectItem value="management">ניהול נכסים</SelectItem>
                        <SelectItem value="project">פרויקט חדש</SelectItem>
                        <SelectItem value="tracked_project">פרויקט מעקב</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">סטטוס</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">לא ידוע</SelectItem>
                        <SelectItem value="vacant">פנוי</SelectItem>
                        <SelectItem value="occupied">תפוס</SelectItem>
                        <SelectItem value="maintenance">תחזוקה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="city">עיר *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="תל אביב-יפו"
                      required
                    />
                  </div>
                </div>

                {/* Tracked Project: simplified form */}
                {formData.property_type === 'tracked_project' ? (
                  <>
                    <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
                      <div>
                        <Label htmlFor="trackingUrl" className="text-base font-semibold">🔗 קישור לעמוד הפרויקט (חובה)</Label>
                        <Input
                          id="trackingUrl"
                          type="url"
                          value={formData.trackingUrl}
                          onChange={(e) => handleInputChange('trackingUrl', e.target.value)}
                          placeholder="https://www.example.co.il/project/..."
                          dir="ltr"
                          required
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          המערכת תסרוק את העמוד ותחלץ את הדירות אוטומטית
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="title">שם הפרויקט</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="פרויקט בוטיק בפלורנטין"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">הערות</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="הערות נוספות..."
                        rows={2}
                      />
                    </div>
                  </>
                ) : (
                <>
                {/* Row 2: Address */}
                <div>
                  <Label htmlFor="address">
                    {formData.property_type === 'project' ? 'שכונה / כתובת פנימית *' : 'כתובת *'}
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder={formData.property_type === 'project' ? 'שם השכונה (למשל: פלורנטין)' : 'רחוב ומספר בית'}
                    required
                  />
                </div>

                {/* Row 3: Title */}
                <div>
                  <Label htmlFor="title">
                    {formData.property_type === 'project' ? 'שם הפרויקט' : 'כותרת'}
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder={formData.property_type === 'project' ? 'פרויקט בוטיק בפלורנטין' : 'דירת 3 חדרים מרווחת בלב העיר'}
                  />
                </div>

                {/* Row 4: Description */}
                <div>
                  <Label htmlFor="description">תיאור</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={formData.property_type === 'project' ? 'תיאור הפרויקט...' : 'תיאור מפורט של הנכס...'}
                    rows={2}
                  />
                </div>

                <Separator className="my-4" />

                {/* Project-specific fields */}
                {formData.property_type === 'project' ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="roomsRange">טווח חדרים</Label>
                        <Input
                          id="roomsRange"
                          value={formData.roomsRange}
                          onChange={(e) => handleInputChange('roomsRange', e.target.value)}
                          placeholder="3-5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="sizeRange">טווח שטח (מ"ר)</Label>
                        <Input
                          id="sizeRange"
                          value={formData.sizeRange}
                          onChange={(e) => handleInputChange('sizeRange', e.target.value)}
                          placeholder="80-140"
                        />
                      </div>
                      <div>
                        <Label htmlFor="buildingFloors">קומות בבניין</Label>
                        <Input
                          id="buildingFloors"
                          type="number"
                          value={formData.buildingFloors}
                          onChange={(e) => handleInputChange('buildingFloors', e.target.value)}
                          placeholder="8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="unitsCount">מספר יח"ד</Label>
                        <Input
                          id="unitsCount"
                          type="number"
                          value={formData.unitsCount}
                          onChange={(e) => handleInputChange('unitsCount', e.target.value)}
                          placeholder="24"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="projectStatus">סטטוס פרויקט</Label>
                        <Select value={formData.projectStatus} onValueChange={(value) => handleInputChange('projectStatus', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pre_sale">טרום מכירה</SelectItem>
                            <SelectItem value="under_construction">בבנייה</SelectItem>
                            <SelectItem value="ready">אכלוס מיידי</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Tracking URL for automatic scanning */}
                    <div>
                      <Label htmlFor="trackingUrl">🔗 קישור למעקב אוטומטי</Label>
                      <Input
                        id="trackingUrl"
                        type="url"
                        value={formData.trackingUrl}
                        onChange={(e) => handleInputChange('trackingUrl', e.target.value)}
                        placeholder="https://www.example.co.il/project/..."
                        dir="ltr"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        קישור לעמוד הפרויקט באתר חיצוני -- המערכת תסרוק אוטומטית ותעדכן יחידות
                      </p>
                    </div>

                    {/* Checkboxes for project */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id="parking"
                          checked={formData.parking}
                          onCheckedChange={(checked) => handleInputChange('parking', !!checked)}
                        />
                        <Label htmlFor="parking" className="cursor-pointer">חניה</Label>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id="elevator"
                          checked={formData.elevator}
                          onCheckedChange={(checked) => handleInputChange('elevator', !!checked)}
                        />
                        <Label htmlFor="elevator" className="cursor-pointer">מעלית</Label>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id="balcony"
                          checked={formData.balcony}
                          onCheckedChange={(checked) => handleInputChange('balcony', !!checked)}
                        />
                        <Label htmlFor="balcony" className="cursor-pointer">מרפסת</Label>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id="hasStorage"
                          checked={formData.hasStorage}
                          onCheckedChange={(checked) => handleInputChange('hasStorage', !!checked)}
                        />
                        <Label htmlFor="hasStorage" className="cursor-pointer">מחסן</Label>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Regular property fields: Rooms, Bathrooms, Size, Floor */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="rooms">חדרים</Label>
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
                        <Label htmlFor="bathrooms">חדרי רחצה</Label>
                        <Input
                          id="bathrooms"
                          type="number"
                          value={formData.bathrooms}
                          onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="propertySize">גודל מ״ר</Label>
                        <Input
                          id="propertySize"
                          type="number"
                          value={formData.propertySize}
                          onChange={(e) => handleInputChange('propertySize', e.target.value)}
                          placeholder="80"
                        />
                      </div>
                      <div>
                        <Label htmlFor="floor">קומה</Label>
                        <Input
                          id="floor"
                          type="number"
                          value={formData.floor}
                          onChange={(e) => handleInputChange('floor', e.target.value)}
                          placeholder="2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="buildingFloors">קומות בבניין</Label>
                        <Input
                          id="buildingFloors"
                          type="number"
                          value={formData.buildingFloors}
                          onChange={(e) => handleInputChange('buildingFloors', e.target.value)}
                          placeholder="4"
                        />
                      </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id="parking"
                          checked={formData.parking}
                          onCheckedChange={(checked) => handleInputChange('parking', !!checked)}
                        />
                        <Label htmlFor="parking" className="cursor-pointer">חניה</Label>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id="elevator"
                          checked={formData.elevator}
                          onCheckedChange={(checked) => handleInputChange('elevator', !!checked)}
                        />
                        <Label htmlFor="elevator" className="cursor-pointer">מעלית</Label>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id="balcony"
                          checked={formData.balcony}
                          onCheckedChange={(checked) => handleInputChange('balcony', !!checked)}
                        />
                        <Label htmlFor="balcony" className="cursor-pointer">מרפסת</Label>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id="yard"
                          checked={formData.yard}
                          onCheckedChange={(checked) => handleInputChange('yard', !!checked)}
                        />
                        <Label htmlFor="yard" className="cursor-pointer">חצר</Label>
                      </div>
                      {(formData.balcony || formData.yard) && (
                        <div>
                          <Label htmlFor="balconyYardSize" className="text-xs">גודל מרפסת/חצר</Label>
                          <Input
                            id="balconyYardSize"
                            type="number"
                            value={formData.balconyYardSize}
                            onChange={(e) => handleInputChange('balconyYardSize', e.target.value)}
                            placeholder="מ״ר"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
                </>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Owner Details - hide for tracked projects */}
            {formData.property_type !== 'tracked_project' && (
            <AccordionItem value="owner">
              <AccordionTrigger>👤 פרטי הבעלים</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="ownerPhone">טלפון בעלים</Label>
                    <Input
                      id="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                      onBlur={() => handleFieldBlur('ownerPhone')}
                      placeholder="050-1234567"
                      className={cn(touched.ownerPhone && errors.ownerPhone && 'border-destructive')}
                    />
                    {touched.ownerPhone && errors.ownerPhone && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span>{errors.ownerPhone}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="ownerEmail">אימייל בעלים</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                      onBlur={() => handleFieldBlur('ownerEmail')}
                      placeholder="email@example.com"
                      className={cn(touched.ownerEmail && errors.ownerEmail && 'border-destructive')}
                    />
                    {touched.ownerEmail && errors.ownerEmail && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span>{errors.ownerEmail}</span>
                      </p>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            )}

            {/* Agent Assignment */}
            <AccordionItem value="agent">
              <AccordionTrigger>👨‍💼 סוכן מופיע</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="assignedUser">סוכן מופיע</Label>
                  <Select 
                    value={formData.assignedUserId || 'none'} 
                    onValueChange={(value) => handleInputChange('assignedUserId', value === 'none' ? null : value)}
                  >
                    <SelectTrigger>
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
              </AccordionContent>
            </AccordionItem>

            {/* Tenant Details - Only for Rental */}
            {(formData.property_type === 'rental' || formData.property_type === 'management') && (
              <AccordionItem value="tenant">
                <AccordionTrigger>👤 פרטי השוכר</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="tenantName">שם השוכר</Label>
                    <Input
                      id="tenantName"
                      value={formData.tenantName}
                      onChange={(e) => handleInputChange('tenantName', e.target.value)}
                      placeholder="שם מלא"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="tenantPhone">טלפון</Label>
                      <Input
                        id="tenantPhone"
                        value={formData.tenantPhone}
                        onChange={(e) => handleInputChange('tenantPhone', e.target.value)}
                        onBlur={() => handleFieldBlur('tenantPhone')}
                        placeholder="050-1234567"
                        className={cn(touched.tenantPhone && errors.tenantPhone && 'border-destructive')}
                      />
                      {touched.tenantPhone && errors.tenantPhone && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 flex-shrink-0" />
                          <span>{errors.tenantPhone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Rental/Sale Details - hide for projects */}
            {formData.property_type !== 'project' && formData.property_type !== 'tracked_project' && (
            <AccordionItem value="rental-sale">
              <AccordionTrigger>
                {formData.property_type === 'rental' ? '🔑 פרטי השכירות' : '💰 פרטי מכירה'}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {formData.property_type === 'rental' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="monthlyRent">שכר דירה חודשי</Label>
                        <Input
                          id="monthlyRent"
                          type="number"
                          value={formData.monthlyRent}
                          onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                          placeholder="₪"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="municipalTax">ארנונה חודשית</Label>
                        <Input
                          id="municipalTax"
                          type="number"
                          value={formData.municipalTax}
                          onChange={(e) => handleInputChange('municipalTax', e.target.value)}
                          placeholder="₪"
                        />
                      </div>
                      <div>
                        <Label htmlFor="buildingCommitteeFee">ועד בית חודשי</Label>
                        <Input
                          id="buildingCommitteeFee"
                          type="number"
                          value={formData.buildingCommitteeFee}
                          onChange={(e) => handleInputChange('buildingCommitteeFee', e.target.value)}
                          placeholder="₪"
                        />
                      </div>
                    </div>
                  </>
                )}

                {formData.property_type === 'sale' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="acquisitionCost">עלות רכישה</Label>
                        <Input id="acquisitionCost" type="number" value={formData.acquisitionCost} onChange={(e) => handleInputChange('acquisitionCost', e.target.value)} placeholder="₪" />
                      </div>
                      <div>
                        <Label htmlFor="renovationCosts">עלויות שיפוץ</Label>
                        <Input id="renovationCosts" type="number" value={formData.renovationCosts} onChange={(e) => handleInputChange('renovationCosts', e.target.value)} placeholder="₪" />
                      </div>
                      <div>
                        <Label htmlFor="currentMarketValue">שווי שוק נוכחי</Label>
                        <Input id="currentMarketValue" type="number" value={formData.currentMarketValue} onChange={(e) => handleInputChange('currentMarketValue', e.target.value)} placeholder="₪" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="municipalTax">ארנונה חודשית</Label>
                        <Input id="municipalTax" type="number" value={formData.municipalTax} onChange={(e) => handleInputChange('municipalTax', e.target.value)} placeholder="₪" />
                      </div>
                      <div>
                        <Label htmlFor="buildingCommitteeFee">ועד בית חודשי</Label>
                        <Input id="buildingCommitteeFee" type="number" value={formData.buildingCommitteeFee} onChange={(e) => handleInputChange('buildingCommitteeFee', e.target.value)} placeholder="₪" />
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse pt-7">
                        <Checkbox id="featured" checked={formData.featured} onCheckedChange={(checked) => handleInputChange('featured', !!checked)} />
                        <Label htmlFor="featured" className="cursor-pointer">נכס מומלץ</Label>
                      </div>
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
            )}

            {/* Notes */}
            <AccordionItem value="notes">
              <AccordionTrigger>📝 הערות נוספות</AccordionTrigger>
              <AccordionContent className="pt-4">
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
              </AccordionContent>
            </AccordionItem>

            {/* Images */}
            <AccordionItem value="images">
              <AccordionTrigger>📸 תמונות הנכס</AccordionTrigger>
              <AccordionContent className="pt-4">
                <ImageUpload
                  images={uploadedImages}
                  onImagesChange={setUploadedImages}
                  maxImages={10}
                  maxSizePerImage={20}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Submit Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'שומר...' : formData.property_type === 'tracked_project' ? 'הוסף פרויקט מעקב' : 'הוסף נכס'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};