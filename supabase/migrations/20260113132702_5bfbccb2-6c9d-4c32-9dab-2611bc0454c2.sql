-- Create pitch_decks table for storing presentation data
CREATE TABLE public.pitch_decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'he',
  is_active BOOLEAN NOT NULL DEFAULT false,
  theme_color TEXT DEFAULT '#f5c242',
  overlay_opacity NUMERIC DEFAULT 0.85,
  contact_phone TEXT,
  contact_whatsapp TEXT,
  agent_names TEXT,
  views_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pitch_deck_slides table for storing individual slide data
CREATE TABLE public.pitch_deck_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES public.pitch_decks(id) ON DELETE CASCADE,
  slide_type TEXT NOT NULL,
  slide_order INTEGER NOT NULL DEFAULT 0,
  background_image TEXT,
  slide_data JSONB NOT NULL DEFAULT '{}',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_pitch_decks_slug ON public.pitch_decks(slug);
CREATE INDEX idx_pitch_decks_property_id ON public.pitch_decks(property_id);
CREATE INDEX idx_pitch_decks_created_by ON public.pitch_decks(created_by);
CREATE INDEX idx_pitch_deck_slides_deck_id ON public.pitch_deck_slides(deck_id);
CREATE INDEX idx_pitch_deck_slides_order ON public.pitch_deck_slides(deck_id, slide_order);

-- Enable RLS
ALTER TABLE public.pitch_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_deck_slides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pitch_decks
-- Public can view active decks
CREATE POLICY "Anyone can view active pitch decks" 
ON public.pitch_decks 
FOR SELECT 
USING (is_active = true);

-- Authenticated users can view all their own decks
CREATE POLICY "Users can view their own pitch decks" 
ON public.pitch_decks 
FOR SELECT 
USING (auth.uid() = created_by);

-- Admins and managers can view all decks
CREATE POLICY "Admins can view all pitch decks" 
ON public.pitch_decks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'manager')
  )
);

-- Users can create their own decks
CREATE POLICY "Authenticated users can create pitch decks" 
ON public.pitch_decks 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Users can update their own decks
CREATE POLICY "Users can update their own pitch decks" 
ON public.pitch_decks 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Admins can update all decks
CREATE POLICY "Admins can update all pitch decks" 
ON public.pitch_decks 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'manager')
  )
);

-- Users can delete their own decks
CREATE POLICY "Users can delete their own pitch decks" 
ON public.pitch_decks 
FOR DELETE 
USING (auth.uid() = created_by);

-- Admins can delete all decks
CREATE POLICY "Admins can delete all pitch decks" 
ON public.pitch_decks 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'manager')
  )
);

-- RLS Policies for pitch_deck_slides
-- Anyone can view slides of active decks
CREATE POLICY "Anyone can view slides of active decks" 
ON public.pitch_deck_slides 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.pitch_decks 
    WHERE id = deck_id AND is_active = true
  )
);

-- Users can view slides of their own decks
CREATE POLICY "Users can view slides of their own decks" 
ON public.pitch_deck_slides 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.pitch_decks 
    WHERE id = deck_id AND created_by = auth.uid()
  )
);

-- Admins can view all slides
CREATE POLICY "Admins can view all slides" 
ON public.pitch_deck_slides 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'manager')
  )
);

-- Users can insert slides to their own decks
CREATE POLICY "Users can insert slides to their own decks" 
ON public.pitch_deck_slides 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pitch_decks 
    WHERE id = deck_id AND created_by = auth.uid()
  )
);

-- Admins can insert slides to any deck
CREATE POLICY "Admins can insert slides to any deck" 
ON public.pitch_deck_slides 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'manager')
  )
);

-- Users can update slides of their own decks
CREATE POLICY "Users can update slides of their own decks" 
ON public.pitch_deck_slides 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.pitch_decks 
    WHERE id = deck_id AND created_by = auth.uid()
  )
);

-- Admins can update all slides
CREATE POLICY "Admins can update all slides" 
ON public.pitch_deck_slides 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'manager')
  )
);

-- Users can delete slides of their own decks
CREATE POLICY "Users can delete slides of their own decks" 
ON public.pitch_deck_slides 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.pitch_decks 
    WHERE id = deck_id AND created_by = auth.uid()
  )
);

-- Admins can delete all slides
CREATE POLICY "Admins can delete all slides" 
ON public.pitch_deck_slides 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'manager')
  )
);

-- Trigger for updating updated_at on pitch_decks
CREATE TRIGGER update_pitch_decks_updated_at
BEFORE UPDATE ON public.pitch_decks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating updated_at on pitch_deck_slides
CREATE TRIGGER update_pitch_deck_slides_updated_at
BEFORE UPDATE ON public.pitch_deck_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();