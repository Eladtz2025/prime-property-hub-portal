import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActivityLogger } from './useActivityLogger';
import { useToast } from '@/hooks/use-toast';
import { Property } from '@/types/property';

interface SendWhatsAppParams {
  phone: string;
  message: string;
  propertyId?: string;
  property?: Property;
  isOwner?: boolean;
}

interface SendWhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const useWhatsAppSender = () => {
  const [isSending, setIsSending] = useState(false);
  const { logActivity } = useActivityLogger();
  const { toast } = useToast();

  const createDefaultMessage = (property?: Property, isOwner: boolean = true) => {
    if (!property) return 'שלום, נעים להכיר!';
    
    if (isOwner) {
      return `שלום ${property.ownerName},

אני פונה אליך בנוגע לנכס שלך ב${property.address}.
${property.status === 'vacant' ? 'הבנתי שהנכס פנוי כרגע.' : ''}

אשמח לשוחח איתך.

תודה רבה!`;
    } else {
      return `שלום ${property.tenantName || ''},

אני פונה אליך בנוגע לנכס ב${property.address}.

אשמח לשוחח איתך.

תודה רבה!`;
    }
  };

  const sendWhatsAppMessage = async ({ 
    phone, 
    message, 
    propertyId, 
    property,
    isOwner = true
  }: SendWhatsAppParams): Promise<SendWhatsAppResponse> => {
    setIsSending(true);
    
    try {
      const finalMessage = message || createDefaultMessage(property, isOwner);
      
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          phone,
          message: finalMessage,
          propertyId,
          type: 'single'
        }
      });

      if (error) {
        console.error('WhatsApp send error:', error);
        const errorMsg = error.message || "אירעה שגיאה לא צפויה";
        const isNotConnected = errorMsg.includes('WhatsApp לא מחובר');
        toast({
          title: isNotConnected ? "WhatsApp לא מחובר" : "שגיאה בשליחת ההודעה",
          description: isNotConnected 
            ? "יש להגדיר את פרטי Green API בהגדרות הפרופיל שלך" 
            : errorMsg,
          variant: "destructive"
        });
        return { success: false, error: errorMsg };
      }

      if (data.success) {
        toast({
          title: "ההודעה נשלחה בהצלחה!",
          description: `ההודעה נשלחה ל-${phone}`,
        });

        // Log activity
        await logActivity({
          action: 'whatsapp_sent',
          resourceType: 'contact',
          resourceId: propertyId,
          details: {
            phone,
            message: finalMessage,
            property_address: property?.address,
            messageId: data.result?.messageId
          }
        });

        return { 
          success: true, 
          messageId: data.result?.messageId 
        };
      } else {
        toast({
          title: "שגיאה בשליחת ההודעה",
          description: "לא הצלחנו לשלוח את ההודעה",
          variant: "destructive"
        });
        return { success: false, error: "Failed to send message" };
      }
    } catch (error) {
      console.error('WhatsApp send error:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא צפויה';
      
      toast({
        title: "שגיאה בשליחת ההודעה",
        description: errorMessage,
        variant: "destructive"
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendWhatsAppMessage,
    isSending,
    createDefaultMessage
  };
};