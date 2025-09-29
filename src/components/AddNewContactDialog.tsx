import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePropertyData } from '@/hooks/usePropertyData';
import { useTenantData } from '@/hooks/useTenantData';
import { useToast } from '@/hooks/use-toast';
import { formatPhoneForWhatsApp } from '@/utils/whatsappHelper';
import { User, Home } from 'lucide-react';

interface AddNewContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPhone?: string;
  onContactAdded: (contact: { phone: string; name: string; type: 'tenant' | 'owner'; propertyId?: string }) => void;
}

export const AddNewContactDialog: React.FC<AddNewContactDialogProps> = ({
  open,
  onOpenChange,
  initialPhone = '',
  onContactAdded
}) => {
  const [phone, setPhone] = useState(initialPhone);
  const [name, setName] = useState('');
  const [contactType, setContactType] = useState<'tenant' | 'owner'>('tenant');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { properties } = usePropertyData();
  const { createTenant } = useTenantData();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!phone.trim() || !name.trim()) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    if (contactType === 'tenant' && !selectedPropertyId) {
      toast({
        title: "שגיאה", 
        description: "יש לבחור נכס עבור דייר",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (contactType === 'tenant') {
        // Create tenant in database
        await createTenant({
          name: name.trim(),
          phone: phone.trim(),
          property_id: selectedPropertyId,
          is_active: true,
          email: null,
          monthly_rent: null,
          deposit_amount: null,
          lease_start_date: null,
          lease_end_date: null
        });
      }

      // Notify parent component
      onContactAdded({
        phone: phone.trim(),
        name: name.trim(),
        type: contactType,
        propertyId: contactType === 'tenant' ? selectedPropertyId : undefined
      });

      toast({
        title: "הצלחה",
        description: `${contactType === 'tenant' ? 'הדייר' : 'בעל הנכס'} ${name} נוסף בהצלחה`
      });

      // Reset form
      setPhone('');
      setName('');
      setContactType('tenant');
      setSelectedPropertyId('');
      onOpenChange(false);

    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו להוסיף את איש הקשר",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update phone when dialog opens with initial value
  React.useEffect(() => {
    if (open && initialPhone) {
      setPhone(initialPhone);
    }
  }, [open, initialPhone]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            הוספת איש קשר חדש
          </DialogTitle>
          <DialogDescription>
            הוסף איש קשר חדש למערכת כדי לשלוח לו הודעות WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">מספר טלפון</Label>
            <Input
              id="phone"
              placeholder="054-123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
            />
            {phone && (
              <p className="text-xs text-muted-foreground">
                מנורמל: {formatPhoneForWhatsApp(phone)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">שם</Label>
            <Input
              id="name"
              placeholder="שם מלא"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">סוג איש הקשר</Label>
            <Select value={contactType} onValueChange={(value: 'tenant' | 'owner') => setContactType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tenant">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    דייר
                  </div>
                </SelectItem>
                <SelectItem value="owner">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    בעל נכס
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {contactType === 'tenant' && (
            <div className="space-y-2">
              <Label htmlFor="property">נכס</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר נכס" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'מוסיף...' : 'הוסף איש קשר'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};