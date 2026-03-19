import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Phone, User, MapPin, ExternalLink, ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isTomorrow, parseISO, addDays, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  created_at: string;
  location?: string | null;
  properties?: {
    address: string;
    city: string;
  } | null;
}

interface UpcomingAppointmentsCardProps {
  limit?: number;
  onAddAppointment?: () => void;
  onEditAppointment?: (appointment: Appointment) => void;
  showViewAll?: boolean;
}

const appointmentTypeLabels: Record<string, string> = {
  viewing: 'צפייה',
  signing: 'חתימה',
  handover: 'מסירה',
  new_property: 'נכס חדש',
  client_meeting: 'פגישת לקוח',
  office: 'משרד',
  meeting: 'פגישה',
  other: 'אחר'
};

const appointmentTypeColors: Record<string, string> = {
  viewing: 'bg-blue-100 text-blue-800',
  signing: 'bg-green-100 text-green-800',
  handover: 'bg-purple-100 text-purple-800',
  new_property: 'bg-amber-100 text-amber-800',
  client_meeting: 'bg-cyan-100 text-cyan-800',
  office: 'bg-indigo-100 text-indigo-800',
  meeting: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800'
};

export const UpcomingAppointmentsCard: React.FC<UpcomingAppointmentsCardProps> = ({
  limit = 5,
  onAddAppointment,
  onEditAppointment,
  showViewAll = true
}) => {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['upcoming-appointments', limit],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekFromNow = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      
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
    const timeStr = appointment.appointment_time.slice(0, 5);
    const startDate = new Date(`${appointment.appointment_date}T${timeStr}:00`);
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

  // Delete mutation
  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-appointments'] });
      toast.success('הפגישה נמחקה');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('שגיאה במחיקת הפגישה');
    }
  });

  // Filter out appointments where time has passed
  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    const now = new Date();
    return appointments.filter(appointment => {
      const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
      return appointmentDateTime > now;
    });
  }, [appointments]);

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
    <Card className="h-full flex flex-col border-l-4 border-l-primary/60 overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-l from-transparent to-primary/5">
        <CardTitle className="flex items-center gap-3 text-lg">
          <span className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </span>
          פגישות קרובות
        </CardTitle>
        {(onAddAppointment || showViewAll) && (
          <div className="flex items-center gap-2 mt-2">
            {onAddAppointment && (
              <Button variant="outline" size="sm" onClick={onAddAppointment} className="gap-1">
                <Plus className="h-4 w-4" />
                הוסף
              </Button>
            )}
            {showViewAll && filteredAppointments.length > limit && (
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => window.location.href = '/appointments'}>
                ראה הכל
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="overflow-y-auto">
        {filteredAppointments.length === 0 ? (
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
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {filteredAppointments.map((appointment) => (
              <div 
                key={appointment.id} 
                className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                {/* Date & Time */}
                <div className="flex sm:flex-col items-center justify-between sm:justify-center bg-primary/10 rounded-lg p-2 sm:p-3 w-full sm:w-auto sm:min-w-[70px]">
                  <span className="text-sm sm:text-xs font-medium text-primary">
                    {getDateLabel(appointment.appointment_date)}
                  </span>
                  <span className="text-xl sm:text-lg font-bold">
                    {appointment.appointment_time.slice(0, 5)}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-2 text-right">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <Badge className={`${appointmentTypeColors[appointment.appointment_type]} w-fit`}>
                      {appointmentTypeLabels[appointment.appointment_type]}
                    </Badge>
                    <span className="font-medium flex items-center gap-1 truncate">
                      <User className="h-3 w-3 flex-shrink-0" />
                      {appointment.client_name}
                    </span>
                  </div>
                  
                  {appointment.properties && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 max-w-full">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {`${appointment.properties.address}, ${appointment.properties.city}`}
                      </span>
                    </p>
                  )}
                  {appointment.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-full">
                      {appointment.notes}
                    </p>
                  )}

                  {/* Created at */}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(parseISO(appointment.created_at), { locale: he, addSuffix: true })}
                  </p>
                  
                  {/* Phone + Actions */}
                  <div className="flex items-center justify-between gap-2">
                    {appointment.client_phone ? (
                      <a 
                        href={`tel:${appointment.client_phone}`}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        {appointment.client_phone}
                      </a>
                    ) : (
                      <span></span>
                    )}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openGoogleCalendar(appointment)}
                        title="הוסף ליומן גוגל"
                        className="gap-1 h-8 px-2"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline text-xs">יומן גוגל</span>
                      </Button>
                      {onEditAppointment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditAppointment(appointment)}
                          title="ערוך פגישה"
                          className="h-8 px-2 text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(appointment.id)}
                        title="מחק פגישה"
                        className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>מחיקת פגישה</AlertDialogTitle>
              <AlertDialogDescription>
                האם אתה בטוח שברצונך למחוק את הפגישה? פעולה זו לא ניתנת לביטול.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteAppointment.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                מחק
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
