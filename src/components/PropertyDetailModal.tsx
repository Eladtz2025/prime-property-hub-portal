import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Phone, Mail, MapPin, Calendar, Home, FileText, History, User, Image as ImageIcon, Car, Building2, DoorOpen, Shield, Trees, Wallet, CalendarPlus } from 'lucide-react';
import { Property, PropertyImage } from '../types/property';
import { ImageCarousel } from './ImageCarousel';
import { useAuth } from '@/contexts/AuthContext';
import { canViewPhoneNumbers, formatPhoneDisplay } from '@/utils/permissions';
import { supabase } from '@/integrations/supabase/client';
import { AddAppointmentModal } from './AddAppointmentModal';
import { logger } from '@/utils/logger';

interface PropertyDetailModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (property: Property) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  isOpen,
  onClose,
  onEdit
}) => {
  const { permissions, hasPermission } = useAuth();
  const canViewPhone = canViewPhoneNumbers(permissions);
  const canEdit = hasPermission('properties', 'update');
  const [images, setImages] = useState<PropertyImage[]>(property.images || []);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && property.id) {
      loadPropertyImages();
    }
  }, [property.id, isOpen]);

  const loadPropertyImages = async () => {
    try {
      logger.info('🔍 Loading images for property:', property.id);
      const { data, error } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', property.id)
        .order('order_index', { ascending: true });

      if (error) {
        logger.error('❌ Error loading images:', error);
        return;
      }

      logger.info('✅ Loaded', data?.length || 0, 'images from DB');
      
      if (data && data.length > 0) {
        const loadedImages: PropertyImage[] = data.map(img => ({
          id: img.id,
          name: img.alt_text || 'תמונת נכס',
          url: img.image_url,
          isPrimary: img.is_main || false,
          uploadedAt: img.created_at || new Date().toISOString(),
        }));

        setImages(loadedImages);
      } else {
        setImages([]);
      }
    } catch (error) {
      logger.error('❌ Error loading property images:', error);
    }
  };
  
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

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" dir="rtl">
        <DialogHeader className="pt-2 pb-0">
          <div className="flex flex-col gap-3">
            {/* Title + Status row */}
            <div className="flex items-start justify-between gap-2">
              <div className="text-right flex-1 min-w-0">
                <DialogTitle className="text-base sm:text-xl leading-tight">{property.address}</DialogTitle>
                <p className="text-muted-foreground text-xs sm:text-sm">{property.city}</p>
              </div>
              <Badge className={`${getStatusColor(property.status)} text-xs shrink-0`}>
                {getStatusText(property.status)}
              </Badge>
            </div>
            
            {/* Action buttons - separate row on mobile */}
            <div className="flex items-center gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setIsAppointmentModalOpen(true)} className="text-xs h-7 px-2">
                <CalendarPlus className="h-3 w-3 ml-1" />
                פגישה
              </Button>
              {canEdit && (
                <Button size="sm" onClick={() => onEdit(property)} className="text-xs h-7 px-2">
                  <Edit className="h-3 w-3 ml-1" />
                  עריכה
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full mt-2" dir="rtl">
          <TabsList className="grid w-full grid-cols-5 h-8">
            <TabsTrigger value="general" className="text-xs px-1">כללי</TabsTrigger>
            <TabsTrigger value="images" className="text-xs px-1">תמונות</TabsTrigger>
            <TabsTrigger value="contract" className="text-xs px-1">חוזה</TabsTrigger>
            <TabsTrigger value="history" className="text-xs px-1">היסטוריה</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs px-1">הערות</TabsTrigger>
          </TabsList>

          {/* General Details */}
          <TabsContent value="general" className="space-y-3 text-right mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Property Info */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    פרטי הנכס
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-1.5 text-right text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{property.address}, {property.city}</span>
                  </div>
                  {property.propertySize && (
                    <div>
                      <span className="font-medium">גודל:</span>
                      <span className="mr-1">{property.propertySize} מ"ר</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                    {property.rooms && (
                      <span><span className="font-medium">חדרים:</span> {property.rooms}</span>
                    )}
                    {property.floor !== undefined && property.floor !== null && (
                      <span><span className="font-medium">קומה:</span> {property.floor}{property.buildingFloors ? `/${property.buildingFloors}` : ''}</span>
                    )}
                    {property.bathrooms && (
                      <span><span className="font-medium">מקלחות:</span> {property.bathrooms}</span>
                    )}
                  </div>
                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                    {property.parking && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground">
                        <Car className="h-2.5 w-2.5 ml-0.5" />חניה
                      </Badge>
                    )}
                    {property.elevator && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground">
                        <Building2 className="h-2.5 w-2.5 ml-0.5" />מעלית
                      </Badge>
                    )}
                    {property.balcony && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground">
                        <DoorOpen className="h-2.5 w-2.5 ml-0.5" />מרפסת
                      </Badge>
                    )}
                    {property.mamad && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground">
                        <Shield className="h-2.5 w-2.5 ml-0.5" />ממ"ד
                      </Badge>
                    )}
                    {property.yard && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground">
                        <Trees className="h-2.5 w-2.5 ml-0.5" />חצר
                      </Badge>
                    )}
                  </div>
                  {property.balconyYardSize && (
                    <div className="text-xs text-muted-foreground">
                      מרפסת/חצר: {property.balconyYardSize} מ"ר
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Owner Info */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <User className="h-4 w-4 text-muted-foreground" />
                    פרטי הבעלים
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-1.5 text-right text-sm">
                  <div>
                    <span className="font-medium">שם:</span>
                    <span className="mr-1">{property.ownerName}</span>
                  </div>
                  {property.ownerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {canViewPhone ? (
                        <a href={`tel:${property.ownerPhone}`} className="text-primary hover:underline">
                          {formatPhoneNumber(property.ownerPhone)}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">{formatPhoneDisplay(property.ownerPhone, canViewPhone)}</span>
                      )}
                    </div>
                  )}
                  {property.ownerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <a href={`mailto:${property.ownerEmail}`} className="text-primary hover:underline truncate">
                        {property.ownerEmail}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Additional Notes */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    הערות נוספות
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-1.5 text-right text-sm">
                  {property.notes ? (
                    <p className="text-sm whitespace-pre-wrap">{property.notes}</p>
                  ) : (
                    <p className="text-muted-foreground text-xs">אין הערות נוספות</p>
                  )}
                </CardContent>
              </Card>

              {/* Financial Info */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    מידע כספי
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-1 text-right text-sm">
                  {property.monthlyRent ? (
                    <div>
                      <span className="font-medium">שכירות:</span>
                      <span className="mr-1 font-bold text-primary">₪{property.monthlyRent.toLocaleString()}</span>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs">לא הוגדר מחיר</p>
                  )}
                  {property.municipalTax && (
                    <div className="text-xs">
                      <span className="font-medium">ארנונה:</span>
                      <span className="mr-1">₪{property.municipalTax.toLocaleString()}/חודש</span>
                    </div>
                  )}
                  {property.buildingCommitteeFee && (
                    <div className="text-xs">
                      <span className="font-medium">ועד בית:</span>
                      <span className="mr-1">₪{property.buildingCommitteeFee.toLocaleString()}/חודש</span>
                    </div>
                  )}
                  {(property.monthlyRent || property.municipalTax || property.buildingCommitteeFee) && (
                    <div className="pt-1.5 border-t mt-1.5 text-xs">
                      <span className="font-medium">סה"כ:</span>
                      <span className="mr-1 font-bold">
                        ₪{((property.monthlyRent || 0) + (property.municipalTax || 0) + (property.buildingCommitteeFee || 0)).toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Images */}
          <TabsContent value="images" className="space-y-4">
            <ImageCarousel images={images} />
          </TabsContent>

          {/* Contract Details */}
          <TabsContent value="contract" className="text-right">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 flex-row-reverse justify-end">
                  <FileText className="h-4 w-4" />
                  פרטי חוזה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-right">
                {property.leaseStartDate && (
                  <div className="flex items-center gap-2 flex-row-reverse justify-end">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">תאריך התחלה:</span>
                    <span>{new Date(property.leaseStartDate).toLocaleDateString('he-IL')}</span>
                  </div>
                )}
                {property.leaseEndDate && (
                  <div className="flex items-center gap-2 flex-row-reverse justify-end">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">תאריך סיום:</span>
                    <span>{new Date(property.leaseEndDate).toLocaleDateString('he-IL')}</span>
                  </div>
                )}
                {!property.leaseStartDate && !property.leaseEndDate && (
                  <p className="text-muted-foreground">לא הוגדרו תאריכי חוזה</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="text-right">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 flex-row-reverse justify-end">
                  <History className="h-4 w-4" />
                  היסטוריית שינויים
                </CardTitle>
              </CardHeader>
              <CardContent className="text-right">
                <div className="space-y-2">
                  {property.createdAt && (
                    <div className="text-sm text-muted-foreground">
                      נוצר: {new Date(property.createdAt).toLocaleDateString('he-IL')}
                    </div>
                  )}
                  {property.lastUpdated && (
                    <div className="text-sm text-muted-foreground">
                      עודכן לאחרונה: {new Date(property.lastUpdated).toLocaleDateString('he-IL')}
                    </div>
                  )}
                  {!property.createdAt && !property.lastUpdated && (
                    <p className="text-muted-foreground">אין שינויים להצגה</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes */}
          <TabsContent value="notes" className="text-right">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">הערות</CardTitle>
              </CardHeader>
              <CardContent className="text-right">
                {property.notes ? (
                  <p className="whitespace-pre-wrap">{property.notes}</p>
                ) : (
                  <p className="text-muted-foreground">אין הערות</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <AddAppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          property={property}
        />
      </DialogContent>
    </Dialog>
  );
};
