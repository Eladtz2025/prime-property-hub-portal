import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Property } from '@/types/property';

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property;
  onSuccess?: () => void;
}

const appointmentTypes = [
  { value: 'viewing', label: 'צפייה בנכס' },
  { value: 'signing', label: 'חתימת חוזה' },
  { value: 'handover', label: 'מסירת מפתחות' },
  { value: 'meeting', label: 'פגישה כללית' },
  { value: 'other', label: 'אחר' },
];

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

export const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({
  isOpen,
  onClose,
  property,
  onSuccess
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    appointmentDate: undefined as Date | undefined,
    appointmentTime: '',
    appointmentType: 'viewing',
    notes: ''
  });

  const handleSubmit = async (addToCalendar: boolean = false) => {
    if (!formData.clientName || !formData.appointmentDate || !formData.appointmentTime) {
      toast.error('נא למלא שם לקוח, תאריך ושעה');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from('appointments').insert({
        property_id: property?.id,
        title: property ? `${getAppointmentTypeLabel(formData.appointmentType)} - ${property.address}` : getAppointmentTypeLabel(formData.appointmentType),
        client_name: formData.clientName,
        client_phone: formData.clientPhone,
        appointment_date: format(formData.appointmentDate, 'yyyy-MM-dd'),
        appointment_time: formData.appointmentTime,
        appointment_type: formData.appointmentType,
        notes: formData.notes,
        created_by: user?.id,
        assigned_to: user?.id
      });

      if (error) throw error;

      toast.success('הפגישה נוספה בהצלחה');
      
      if (addToCalendar) {
        openGoogleCalendar();
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error adding appointment:', error);
      toast.error('שגיאה בהוספת הפגישה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      clientName: '',
      clientPhone: '',
      appointmentDate: undefined,
      appointmentTime: '',
      appointmentType: 'viewing',
      notes: ''
    });
    onClose();
  };

  const getAppointmentTypeLabel = (type: string) => {
    return appointmentTypes.find(t => t.value === type)?.label || type;
  };

  const openGoogleCalendar = () => {
    if (!formData.appointmentDate || !formData.appointmentTime) return;

    const startDate = new Date(formData.appointmentDate);
    const [hours, minutes] = formData.appointmentTime.split(':');
    startDate.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d{3}/g, '');
    };

    const title = encodeURIComponent(
      property 
        ? `${getAppointmentTypeLabel(formData.appointmentType)} - ${property.address}`
        : `פגישה עם ${formData.clientName}`
    );
    
    const location = encodeURIComponent(property?.address ? `${property.address}, ${property.city}` : '');
    
    const details = encodeURIComponent(
      `לקוח: ${formData.clientName}\n` +
      `טלפון: ${formData.clientPhone || 'לא צוין'}\n` +
      (formData.notes ? `הערות: ${formData.notes}` : '')
    );

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${details}&location=${location}`;

    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">קביעת פגישה</DialogTitle>
          {property && (
            <p className="text-sm text-muted-foreground text-right">
              {property.address}, {property.city}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Client Name */}
          <div className="space-y-2">
            <Label className="text-right block">שם הלקוח *</Label>
            <Input
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="הזן שם לקוח"
              className="text-right"
            />
          </div>

          {/* Client Phone */}
          <div className="space-y-2">
            <Label className="text-right block">טלפון</Label>
            <Input
              value={formData.clientPhone}
              onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              placeholder="050-0000000"
              className="text-right"
              dir="ltr"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div className="space-y-2">
              <Label className="text-right block">תאריך *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-right"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.appointmentDate 
                      ? format(formData.appointmentDate, 'dd/MM/yyyy', { locale: he })
                      : 'בחר תאריך'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.appointmentDate}
                    onSelect={(date) => setFormData({ ...formData, appointmentDate: date })}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label className="text-right block">שעה *</Label>
              <Select
                value={formData.appointmentTime}
                onValueChange={(value) => setFormData({ ...formData, appointmentTime: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר שעה">
                    {formData.appointmentTime && (
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {formData.appointmentTime}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Appointment Type */}
          <div className="space-y-2">
            <Label className="text-right block">סוג הפגישה</Label>
            <Select
              value={formData.appointmentType}
              onValueChange={(value) => setFormData({ ...formData, appointmentType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-right block">הערות</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="הערות נוספות..."
              className="text-right resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleClose}>
            ביטול
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={isLoading}>
            {isLoading ? 'שומר...' : 'שמור'}
          </Button>
          <Button 
            onClick={() => handleSubmit(true)} 
            disabled={isLoading}
            className="gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            שמור והוסף ליומן
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
