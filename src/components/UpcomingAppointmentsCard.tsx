import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Phone, User, MapPin, ExternalLink, ArrowLeft, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isTomorrow, parseISO, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";

interface Appointment {
  id: string;
  title: string | null;
  client_name: string;
  client_phone: string | null;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  notes: string | null;
  status: string;
  property_id: string | null;
  properties?: {
    address: string;
    city: string;
  } | null;
}

interface UpcomingAppointmentsCardProps {
  limit?: number;
  onAddAppointment?: () => void;
  showViewAll?: boolean;
}

const appointmentTypeLabels: Record<string, string> = {
  viewing: 'צפייה',
  signing: 'חתימה',
  handover: 'מסירה',
  meeting: 'פגישה',
  other: 'אחר'
};

const appointmentTypeColors: Record<string, string> = {
  viewing: 'bg-blue-100 text-blue-800',
  signing: 'bg-green-100 text-green-800',
  handover: 'bg-purple-100 text-purple-800',
  meeting: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800'
};

export const UpcomingAppointmentsCard: React.FC<UpcomingAppointmentsCardProps> = ({
  limit = 5,
  onAddAppointment,
  showViewAll = true
}) => {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['upcoming-appointments', limit],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekFromNow = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          properties (
            address,
            city
          )
        `)
        .gte('appointment_date', today)
        .lte('appointment_date', weekFromNow)
        .eq('status', 'scheduled')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Appointment[];
    },
    refetchInterval: 60000 // Refetch every minute
  });

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'היום';
    if (isTomorrow(date)) return 'מחר';
    return format(date, 'EEEE dd/MM', { locale: he });
  };

  const openGoogleCalendar = (appointment: Appointment) => {
    const startDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d{3}/g, '');
    };

    const title = encodeURIComponent(appointment.title || `פגישה עם ${appointment.client_name}`);
    const location = encodeURIComponent(
      appointment.properties 
        ? `${appointment.properties.address}, ${appointment.properties.city}` 
        : ''
    );
    const details = encodeURIComponent(
      `לקוח: ${appointment.client_name}\n` +
      `טלפון: ${appointment.client_phone || 'לא צוין'}\n` +
      (appointment.notes ? `הערות: ${appointment.notes}` : '')
    );

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${details}&location=${location}`;

    window.open(googleCalendarUrl, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            פגישות קרובות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          פגישות קרובות
        </CardTitle>
        <div className="flex items-center gap-2">
          {onAddAppointment && (
            <Button variant="ghost" size="sm" onClick={onAddAppointment} className="gap-1">
              <Plus className="h-4 w-4" />
              <span className="text-sm">הוסף</span>
            </Button>
          )}
          {showViewAll && (
            <Button variant="ghost" size="sm" className="gap-1">
              <span className="text-sm">ראה הכל</span>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!appointments || appointments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>אין פגישות קרובות</p>
            {onAddAppointment && (
              <Button variant="link" onClick={onAddAppointment} className="mt-2">
                קבע פגישה חדשה
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div 
                key={appointment.id} 
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                {/* Date & Time */}
                <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-2 min-w-[60px]">
                  <span className="text-xs font-medium text-primary">
                    {getDateLabel(appointment.appointment_date)}
                  </span>
                  <span className="text-lg font-bold">
                    {appointment.appointment_time.slice(0, 5)}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1 text-right">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={appointmentTypeColors[appointment.appointment_type]}>
                      {appointmentTypeLabels[appointment.appointment_type]}
                    </Badge>
                    <span className="font-medium flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {appointment.client_name}
                    </span>
                  </div>
                  
                  {appointment.properties && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {appointment.properties.address}, {appointment.properties.city}
                    </p>
                  )}
                  
                  {appointment.client_phone && (
                    <a 
                      href={`tel:${appointment.client_phone}`}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      {appointment.client_phone}
                    </a>
                  )}
                </div>

                {/* Google Calendar Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openGoogleCalendar(appointment)}
                  title="הוסף ליומן גוגל"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
