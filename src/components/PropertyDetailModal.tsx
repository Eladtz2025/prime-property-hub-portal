import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Phone, Mail, MapPin, Calendar, Home, FileText, History, User, Image as ImageIcon } from 'lucide-react';
import { Property, PropertyImage } from '../types/property';
import { ImageCarousel } from './ImageCarousel';
import { useAuth } from '@/contexts/AuthContext';
import { canViewPhoneNumbers, formatPhoneDisplay } from '@/utils/permissions';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    if (isOpen && property.id) {
      loadPropertyImages();
    }
  }, [property.id, isOpen]);

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
      console.error('❌ Error loading property images:', error);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{property.address}</DialogTitle>
              <p className="text-muted-foreground">{property.city}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(property.status)}>
                {getStatusText(property.status)}
              </Badge>
              {canEdit && (
                <Button size="sm" onClick={() => onEdit(property)}>
                  <Edit className="h-4 w-4 mr-2" />
                  עריכה
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">כללי</TabsTrigger>
            <TabsTrigger value="images">תמונות</TabsTrigger>
            <TabsTrigger value="contract">חוזה</TabsTrigger>
            <TabsTrigger value="history">היסטוריה</TabsTrigger>
            <TabsTrigger value="notes">הערות</TabsTrigger>
          </TabsList>

          {/* General Details */}
          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Property Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Home className="h-4 w-4" />
                    פרטי הנכס
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">כתובת:</span>
                    <span>{property.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">עיר:</span>
                    <span>{property.city}</span>
                  </div>
                  {property.propertySize && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">גודל:</span>
                      <span>{property.propertySize} מ"ר</span>
                    </div>
                  )}
                  {property.floor && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">קומה:</span>
                      <span>{property.floor}</span>
                    </div>
                  )}
                  {property.rooms && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">חדרים:</span>
                      <span>{property.rooms}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Owner Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    פרטי הבעלים
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium">שם:</span>
                    <span className="mr-2">{property.ownerName}</span>
                  </div>
                  {property.ownerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {canViewPhone ? (
                        <a href={`tel:${property.ownerPhone}`} className="text-blue-600 hover:underline">
                          {formatPhoneNumber(property.ownerPhone)}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">{formatPhoneDisplay(property.ownerPhone, canViewPhone)}</span>
                      )}
                    </div>
                  )}
                  {property.ownerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${property.ownerEmail}`} className="text-blue-600 hover:underline">
                        {property.ownerEmail}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tenant Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    פרטי השוכר
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {property.tenantName ? (
                    <>
                      <div>
                        <span className="font-medium">שם:</span>
                        <span className="mr-2">{property.tenantName}</span>
                      </div>
                      {property.tenantPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {canViewPhone ? (
                            <a href={`tel:${property.tenantPhone}`} className="text-blue-600 hover:underline">
                              {formatPhoneNumber(property.tenantPhone)}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">{formatPhoneDisplay(property.tenantPhone, canViewPhone)}</span>
                          )}
                        </div>
                      )}
                      {property.tenantEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${property.tenantEmail}`} className="text-blue-600 hover:underline">
                            {property.tenantEmail}
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">אין שוכר כרגע</p>
                  )}
                </CardContent>
              </Card>

              {/* Financial Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">מידע כספי</CardTitle>
                </CardHeader>
                <CardContent>
                  {property.monthlyRent ? (
                    <div>
                      <span className="font-medium">שכירות חודשית:</span>
                      <span className="mr-2 text-lg font-bold">₪{property.monthlyRent.toLocaleString()}</span>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">לא הוגדר מחיר</p>
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
          <TabsContent value="contract">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  פרטי חוזה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.leaseStartDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">תאריך התחלה:</span>
                    <span>{new Date(property.leaseStartDate).toLocaleDateString('he-IL')}</span>
                  </div>
                )}
                {property.leaseEndDate && (
                  <div className="flex items-center gap-2">
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
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  היסטוריית שינויים
                </CardTitle>
              </CardHeader>
              <CardContent>
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
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>הערות</CardTitle>
              </CardHeader>
              <CardContent>
                {property.notes ? (
                  <p className="whitespace-pre-wrap">{property.notes}</p>
                ) : (
                  <p className="text-muted-foreground">אין הערות</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
