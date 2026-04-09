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
import { AlertCircle } from "lucide-react";
import { logger } from '@/utils/logger';

interface ConsultationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Simple validation helpers
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone: string) => {
  const cleaned = phone.replace(/[-\s]/g, '');
  return /^(\+?972|0)?[2-9]\d{7,8}$/.test(cleaned);
};

type FormFields = 'name' | 'phone' | 'email';
type FormErrors = Partial<Record<FormFields, string>>;
type FormTouched = Partial<Record<FormFields, boolean>>;

export const ConsultationModal = ({ open, onOpenChange }: ConsultationModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});

  const validateField = (field: FormFields, value: string): string | null => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return null;
      case 'phone':
        if (!value.trim()) return 'Phone is required';
        if (!isValidPhone(value)) return 'Invalid phone number. Example: 050-1234567';
        return null;
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!isValidEmail(value)) return 'Invalid email address';
        return null;
    }
  };

  const handleFieldChange = (field: FormFields, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }
  };

  const handleFieldBlur = (field: FormFields) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    const nameError = validateField('name', formData.name);
    const phoneError = validateField('phone', formData.phone);
    const emailError = validateField('email', formData.email);
    
    setTouched({ name: true, phone: true, email: true });
    setErrors({ 
      name: nameError || undefined, 
      phone: phoneError || undefined, 
      email: emailError || undefined 
    });

    if (nameError || phoneError || emailError) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
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
          title: 'New Consultation Request',
          message: `New consultation request from ${formData.name} - ${formData.phone}`,
          action_url: '/admin-dashboard',
        },
      });

      if (notifyError) {
        logger.error('Error notifying admins:', notifyError);
      }

      toast.success("Your request has been submitted successfully!");
      setFormData({ name: "", phone: "", email: "", message: "" });
      onOpenChange(false);
    } catch (error) {
      logger.error('Error submitting consultation request:', error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="ltr">
        <DialogHeader>
          <DialogTitle className="font-playfair text-2xl">Get Free Consultation</DialogTitle>
          <DialogDescription className="font-montserrat">
            Fill out the form below and we'll get back to you shortly.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 px-1">
          <div className="space-y-1">
            <Input
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onBlur={() => handleFieldBlur('name')}
              required
              className={`text-left ${touched.name && errors.name ? 'border-destructive' : ''}`}
            />
            {touched.name && errors.name && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              onBlur={() => handleFieldBlur('phone')}
              required
              className={`text-left ${touched.phone && errors.phone ? 'border-destructive' : ''}`}
            />
            {touched.phone && errors.phone && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.phone}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              onBlur={() => handleFieldBlur('email')}
              required
              className={`text-left ${touched.email && errors.email ? 'border-destructive' : ''}`}
            />
            {touched.email && errors.email && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
          </div>
          <Textarea
            placeholder="Your message..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="min-h-[100px] text-left"
            dir="auto"
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
