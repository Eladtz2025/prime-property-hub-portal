import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { notifyNewLead } from '@/utils/notifyNewLead';

interface ContactFormProps {
  propertyId?: string;
  propertyTitle?: string;
}

const contactSchema = z.object({
  name: z.string().trim().min(2, 'שם חייב להכיל לפחות 2 תווים').max(100),
  email: z.string().trim().email('כתובת אימייל לא תקינה').max(255),
  phone: z.string().trim().optional(),
  message: z.string().trim().min(10, 'הודעה חייבת להכיל לפחות 10 תווים').max(1000),
});

const ContactForm = ({ propertyId, propertyTitle }: ContactFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: propertyTitle ? `מעוניין/ת לקבל מידע נוסף על: ${propertyTitle}` : '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      const validatedData = contactSchema.parse(formData);

      const { error } = await supabase
        .from('contact_leads')
        .insert({
          property_id: propertyId || null,
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone || null,
          message: validatedData.message,
        });

      if (error) throw error;

      // Send WhatsApp notification to Tali (async, don't wait)
      notifyNewLead({
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        message: validatedData.message,
        source: propertyTitle ? `נכס: ${propertyTitle}` : 'טופס יצירת קשר',
      });

      toast({
        title: 'הפנייה נשלחה בהצלחה!',
        description: 'ניצור איתך קשר בהקדם האפשרי',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: propertyTitle ? `מעוניין/ת לקבל מידע נוסף על: ${propertyTitle}` : '',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'שגיאה בטופס',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'שגיאה',
          description: 'אירעה שגיאה בשליחת הפנייה. אנא נסה שנית.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-2xl font-bold mb-6">השאירו פרטים ונחזור אליכם</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">שם מלא *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            maxLength={100}
          />
        </div>
        <div>
          <Label htmlFor="email">אימייל *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            maxLength={255}
          />
        </div>
        <div>
          <Label htmlFor="phone">טלפון</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            maxLength={20}
          />
        </div>
        <div>
          <Label htmlFor="message">הודעה *</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            rows={5}
            maxLength={1000}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'שולח...' : 'שלח פנייה'}
        </Button>
      </form>
    </Card>
  );
};

export default ContactForm;