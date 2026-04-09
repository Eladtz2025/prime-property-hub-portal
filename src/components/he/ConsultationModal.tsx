import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from '@/utils/logger';

interface ConsultationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConsultationModal = ({ open, onOpenChange }: ConsultationModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save to contact_leads
      const { error: leadError } = await supabase
        .from('contact_leads')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
        });

      if (leadError) throw leadError;

      // Notify admins
      const { error: notifyError } = await supabase.functions.invoke('notify-admins', {
        body: {
          type: 'consultation_request',
          title: 'בקשת ייעוץ חדשה',
          message: `בקשת ייעוץ חדשה מ-${formData.name} - ${formData.phone}`,
          action_url: '/admin-dashboard',
        },
      });

      if (notifyError) {
        logger.error('Error notifying admins:', notifyError);
      }

      toast.success("הבקשה נשלחה בהצלחה!");
      setFormData({ name: "", phone: "", email: "", message: "" });
      onOpenChange(false);
    } catch (error) {
      logger.error('Error submitting consultation request:', error);
      toast.error("שליחת הבקשה נכשלה. אנא נסה שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-playfair text-2xl">קבלו ייעוץ חינם</DialogTitle>
          <DialogDescription className="font-montserrat">
            מלאו את הטופס ונחזור אליכם בהקדם
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 px-1">
          <Input
            placeholder="שם מלא"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="text-right"
          />
          <Input
            type="tel"
            placeholder="טלפון"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            className="text-right"
          />
          <Input
            type="email"
            placeholder="אימייל"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="text-right"
          />
          <Textarea
            placeholder="ההודעה שלך..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="min-h-[100px] text-right"
          />
          <div className="flex gap-2 flex-row-reverse">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "שולח..." : "שלח"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
