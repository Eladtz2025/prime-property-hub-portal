-- Create whatsapp_messages table for storing WhatsApp communications
CREATE TABLE public.whatsapp_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    whatsapp_message_id TEXT UNIQUE,
    property_id UUID REFERENCES public.properties(id),
    status TEXT NOT NULL DEFAULT 'pending',
    direction TEXT NOT NULL DEFAULT 'outbound', -- 'inbound' or 'outbound'
    message_type TEXT DEFAULT 'text',
    timestamp TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for WhatsApp messages
CREATE POLICY "Admins can manage all whatsapp messages" 
ON public.whatsapp_messages 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin', 'super_admin', 'manager']));

CREATE POLICY "Property owners can view their whatsapp messages" 
ON public.whatsapp_messages 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.property_owners po 
        WHERE po.property_id = whatsapp_messages.property_id 
        AND po.owner_id = auth.uid()
    ) 
    OR get_current_user_role() = ANY (ARRAY['admin', 'super_admin', 'manager'])
);

CREATE POLICY "Property owners can create whatsapp messages" 
ON public.whatsapp_messages 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.property_owners po 
        WHERE po.property_id = whatsapp_messages.property_id 
        AND po.owner_id = auth.uid()
    ) 
    OR get_current_user_role() = ANY (ARRAY['admin', 'super_admin', 'manager'])
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_whatsapp_messages_updated_at
    BEFORE UPDATE ON public.whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages(phone);
CREATE INDEX idx_whatsapp_messages_property_id ON public.whatsapp_messages(property_id);
CREATE INDEX idx_whatsapp_messages_timestamp ON public.whatsapp_messages(timestamp DESC);