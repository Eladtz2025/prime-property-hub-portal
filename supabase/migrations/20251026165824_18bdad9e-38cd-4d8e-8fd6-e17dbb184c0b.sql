-- Create price_offers table
CREATE TABLE IF NOT EXISTS public.price_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  property_title TEXT NOT NULL,
  property_details TEXT,
  suggested_price_min NUMERIC,
  suggested_price_max NUMERIC,
  price_per_sqm_min NUMERIC,
  price_per_sqm_max NUMERIC,
  expected_income_min NUMERIC,
  expected_income_max NUMERIC,
  language TEXT NOT NULL DEFAULT 'he' CHECK (language IN ('he', 'en')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  views_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create price_offer_blocks table
CREATE TABLE IF NOT EXISTS public.price_offer_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.price_offers(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN ('header', 'text', 'table', 'image', 'price_card', 'divider')),
  block_order INTEGER NOT NULL,
  block_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create price_offer_images table
CREATE TABLE IF NOT EXISTS public.price_offer_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.price_offers(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.price_offer_blocks(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for price offer images
INSERT INTO storage.buckets (id, name, public)
VALUES ('price-offer-images', 'price-offer-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_price_offers_token ON public.price_offers(token);
CREATE INDEX IF NOT EXISTS idx_price_offers_is_active ON public.price_offers(is_active);
CREATE INDEX IF NOT EXISTS idx_price_offer_blocks_offer_id ON public.price_offer_blocks(offer_id);
CREATE INDEX IF NOT EXISTS idx_price_offer_blocks_order ON public.price_offer_blocks(offer_id, block_order);
CREATE INDEX IF NOT EXISTS idx_price_offer_images_offer_id ON public.price_offer_images(offer_id);
CREATE INDEX IF NOT EXISTS idx_price_offer_images_block_id ON public.price_offer_images(block_id);

-- Enable RLS
ALTER TABLE public.price_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_offer_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_offer_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_offers
CREATE POLICY "Admins can manage all price offers"
ON public.price_offers
FOR ALL
TO authenticated
USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'))
WITH CHECK (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

CREATE POLICY "Anyone can view active price offers by token"
ON public.price_offers
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- RLS Policies for price_offer_blocks
CREATE POLICY "Admins can manage all price offer blocks"
ON public.price_offer_blocks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.price_offers po
    WHERE po.id = price_offer_blocks.offer_id
    AND get_current_user_role() IN ('admin', 'super_admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.price_offers po
    WHERE po.id = price_offer_blocks.offer_id
    AND get_current_user_role() IN ('admin', 'super_admin', 'manager')
  )
);

CREATE POLICY "Anyone can view blocks of active offers"
ON public.price_offer_blocks
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.price_offers po
    WHERE po.id = price_offer_blocks.offer_id
    AND po.is_active = true
  )
);

-- RLS Policies for price_offer_images
CREATE POLICY "Admins can manage all price offer images"
ON public.price_offer_images
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.price_offers po
    WHERE po.id = price_offer_images.offer_id
    AND get_current_user_role() IN ('admin', 'super_admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.price_offers po
    WHERE po.id = price_offer_images.offer_id
    AND get_current_user_role() IN ('admin', 'super_admin', 'manager')
  )
);

CREATE POLICY "Anyone can view images of active offers"
ON public.price_offer_images
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.price_offers po
    WHERE po.id = price_offer_images.offer_id
    AND po.is_active = true
  )
);

-- Storage policies for price-offer-images bucket
CREATE POLICY "Admins can upload price offer images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'price-offer-images'
  AND get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

CREATE POLICY "Admins can update price offer images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'price-offer-images'
  AND get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

CREATE POLICY "Admins can delete price offer images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'price-offer-images'
  AND get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

CREATE POLICY "Anyone can view price offer images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'price-offer-images');

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_price_offers_updated_at
  BEFORE UPDATE ON public.price_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_offer_blocks_updated_at
  BEFORE UPDATE ON public.price_offer_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.price_offers IS 'Main table for property price offers with dynamic block-based content';
COMMENT ON TABLE public.price_offer_blocks IS 'Blocks of content for price offers (header, table, image, text, price_card, divider)';
COMMENT ON TABLE public.price_offer_images IS 'Images associated with price offers and their blocks';