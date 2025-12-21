import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Mail, Phone, MessageCircle, X, Calendar } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
}

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LeadDetailSheet: React.FC<LeadDetailSheetProps> = ({ 
  lead, 
  open, 
  onOpenChange 
}) => {
  if (!lead) return null;

  const formattedDate = format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: he });

  const handleEmail = () => {
    window.location.href = `mailto:${lead.email}`;
  };

  const handleCall = () => {
    if (lead.phone) {
      window.location.href = `tel:${lead.phone}`;
    }
  };

  const handleWhatsApp = () => {
    if (lead.phone) {
      const cleanPhone = lead.phone.replace(/\D/g, '');
      const israelPhone = cleanPhone.startsWith('0') 
        ? '972' + cleanPhone.slice(1) 
        : cleanPhone;
      window.open(`https://wa.me/${israelPhone}`, '_blank');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="text-right pb-4">
          <SheetTitle className="text-xl">{lead.name}</SheetTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
        </SheetHeader>

        <div className="space-y-4">
          {/* Contact Info */}
          <div className="space-y-3">
            <a 
              href={`mailto:${lead.email}`}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <Mail className="h-5 w-5 text-primary" />
              <span className="text-sm">{lead.email}</span>
            </a>
            
            {lead.phone && (
              <a 
                href={`tel:${lead.phone}`}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-sm">{lead.phone}</span>
              </a>
            )}
          </div>

          <Separator />

          {/* Message */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">הודעה</h4>
            <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
              {lead.message}
            </p>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleEmail}
              variant="outline" 
              className="flex-1 gap-2"
            >
              <Mail className="h-4 w-4" />
              אימייל
            </Button>
            
            {lead.phone && (
              <>
                <Button 
                  onClick={handleCall}
                  variant="outline" 
                  className="flex-1 gap-2"
                >
                  <Phone className="h-4 w-4" />
                  התקשר
                </Button>
                
                <Button 
                  onClick={handleWhatsApp}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
