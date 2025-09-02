import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Property } from '../types/property';
import { Phone, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { canViewPhoneNumbers, formatPhoneDisplay } from '@/utils/permissions';

interface ContactOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onUpdateProperty: (updatedProperty: Property) => void;
}

export const ContactOwnerModal: React.FC<ContactOwnerModalProps> = ({
  isOpen,
  onClose,
  property,
  onUpdateProperty
}) => {
  const { toast } = useToast();
  const { permissions } = useAuth();
  const canViewPhone = canViewPhoneNumbers(permissions);
  const [contactResult, setContactResult] = useState<'called_no_answer' | 'called_answered' | 'needs_callback'>('called_answered');
  const [propertyStatus, setPropertyStatus] = useState<'occupied' | 'vacant' | 'unknown'>(property.status as any);
  const [tenantName, setTenantName] = useState(property.tenantName || '');
  const [tenantPhone, setTenantPhone] = useState(property.tenantPhone || '');
  const [notes, setNotes] = useState('');

  const handleSaveContact = () => {
    const updatedProperty: Property = {
      ...property,
      contactStatus: contactResult,
      lastContactDate: new Date().toISOString(),
      contactNotes: notes,
      contactAttempts: property.contactAttempts + 1,
      status: propertyStatus,
      tenantName: propertyStatus === 'occupied' ? tenantName : undefined,
      tenantPhone: propertyStatus === 'occupied' ? tenantPhone : undefined,
      lastUpdated: new Date().toISOString()
    };

    onUpdateProperty(updatedProperty);
    
    toast({
      title: "פרטי יצירת הקשר נשמרו",
      description: `הקשר עם ${property.ownerName} תועד במערכת בהצלחה`,
    });

    onClose();
  };

  const getContactResultIcon = (result: string) => {
    switch (result) {
      case 'called_answered': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'called_no_answer': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'needs_callback': return <Clock className="h-4 w-4 text-warning" />;
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            יצירת קשר עם בעל הנכס
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="font-medium">{property.address}</div>
            <div className="text-sm text-muted-foreground">בעלים: {property.ownerName}</div>
            <div className="text-sm text-muted-foreground">טלפון: {formatPhoneDisplay(property.ownerPhone, canViewPhone)}</div>
          </div>

          <div className="space-y-2">
            <Label>תוצאת השיחה</Label>
            <Select value={contactResult} onValueChange={(value: any) => setContactResult(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="called_answered">
                  <div className="flex items-center gap-2">
                    {getContactResultIcon('called_answered')}
                    נענה לטלפון
                  </div>
                </SelectItem>
                <SelectItem value="called_no_answer">
                  <div className="flex items-center gap-2">
                    {getContactResultIcon('called_no_answer')}
                    לא ענו לטלפון
                  </div>
                </SelectItem>
                <SelectItem value="needs_callback">
                  <div className="flex items-center gap-2">
                    {getContactResultIcon('needs_callback')}
                    נדרש מעקב נוסף
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {contactResult === 'called_answered' && (
            <>
              <div className="space-y-2">
                <Label>סטטוס הנכס</Label>
                <Select value={propertyStatus} onValueChange={(value: any) => setPropertyStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="occupied">תפוס</SelectItem>
                    <SelectItem value="vacant">פנוי</SelectItem>
                    <SelectItem value="unknown">לא ידוע</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {propertyStatus === 'occupied' && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>שם הדייר</Label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      placeholder="הזן שם הדייר..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>טלפון הדייר</Label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      value={tenantPhone}
                      onChange={(e) => setTenantPhone(e.target.value)}
                      placeholder="הזן מספר טלפון הדייר..."
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label>הערות</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הזן הערות על השיחה או מידע נוסף..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSaveContact} className="flex-1">
              שמור פרטים
            </Button>
            <Button variant="outline" onClick={onClose}>
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};