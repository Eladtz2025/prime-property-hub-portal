import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Property } from '../types/property';
import { Phone, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ContactOwnerModal } from './ContactOwnerModal';

import { useAuth } from '@/contexts/AuthContext';
import { canViewPhoneNumbers, formatPhoneDisplay } from '@/utils/permissions';
import { useActivityLogger } from '@/hooks/useActivityLogger';

interface ContactOwnerCardProps {
  property: Property;
  onUpdateProperty: (property: Property) => void;
}

export const ContactOwnerCard: React.FC<ContactOwnerCardProps> = ({
  property,
  onUpdateProperty
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { permissions } = useAuth();
  const canViewPhone = canViewPhoneNumbers(permissions);
  const { logActivity } = useActivityLogger();

  const getContactStatusBadge = (status: Property['contactStatus']) => {
    switch (status) {
      case 'not_contacted':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">טרם נוצר קשר</Badge>;
      case 'called_no_answer':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">לא ענו לטלפון</Badge>;
      case 'called_answered':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">נענה לטלפון</Badge>;
      case 'needs_callback':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">נדרש מעקב</Badge>;
    }
  };

  const getStatusBadge = (status: Property['status']) => {
    switch (status) {
      case 'occupied':
        return <Badge className="bg-green-100 text-green-800">תפוס</Badge>;
      case 'vacant':
        return <Badge className="bg-orange-100 text-orange-800">פנוי</Badge>;
      case 'unknown':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">לא ידוע</Badge>;
      case 'maintenance':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">תחזוקה</Badge>;
    }
  };

  const handleWhatsApp = async () => {
    if (property.ownerPhone) {
      const message = `שלום ${property.ownerName},\nאני פונה אליך בנוגע לנכס שלך ברחוב ${property.address}.\nנוח לך לשוחח?`;
      const whatsappUrl = `https://wa.me/972${property.ownerPhone.replace(/^0/, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      // Log WhatsApp activity
      await logActivity({
        action: 'whatsapp_sent',
        resourceType: 'property',
        resourceId: property.id,
        details: {
          propertyAddress: property.address,
          ownerName: property.ownerName,
          ownerPhone: property.ownerPhone
        }
      });
    }
  };

  const isPriorityContact = property.contactStatus === 'not_contacted' || property.contactStatus === 'needs_callback';

  return (
    <>
      <Card className={`transition-all hover:shadow-md ${isPriorityContact ? 'border-orange-200 bg-orange-50/30' : ''}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{property.address}</h3>
                <p className="text-sm text-muted-foreground">בעלים: {property.ownerName}</p>
                <p className="text-sm text-muted-foreground">טלפון: {formatPhoneDisplay(property.ownerPhone, canViewPhone)}</p>
              </div>
              <div className="flex flex-col gap-2">
                {getContactStatusBadge(property.contactStatus)}
                {getStatusBadge(property.status)}
              </div>
            </div>

            {property.lastContactDate && (
              <div className="text-xs text-muted-foreground">
                קשר אחרון: {new Date(property.lastContactDate).toLocaleDateString('he-IL')}
                {property.contactNotes && ` • ${property.contactNotes}`}
              </div>
            )}

            {property.tenantName && (
              <div className="text-sm text-muted-foreground">
                דייר: {property.tenantName}
                {property.tenantPhone && ` • ${formatPhoneDisplay(property.tenantPhone, canViewPhone)}`}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2"
                variant={isPriorityContact ? "default" : "outline"}
              >
                <Phone className="h-4 w-4" />
                התקשר
              </Button>
              
              {property.ownerPhone && canViewPhone && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ContactOwnerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        property={property}
        onUpdateProperty={onUpdateProperty}
      />
    </>
  );
};