-- Create appointments table for scheduling property viewings and meetings
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  title TEXT,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  appointment_type TEXT NOT NULL DEFAULT 'viewing' CHECK (appointment_type IN ('viewing', 'signing', 'handover', 'meeting', 'other')),
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "Admins and managers can manage all appointments" 
ON public.appointments 
FOR ALL 
USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

CREATE POLICY "Users can view appointments assigned to them" 
ON public.appointments 
FOR SELECT 
USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Users can create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own appointments" 
ON public.appointments 
FOR UPDATE 
USING (created_by = auth.uid() OR assigned_to = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_property ON public.appointments(property_id);
CREATE INDEX idx_appointments_assigned ON public.appointments(assigned_to);