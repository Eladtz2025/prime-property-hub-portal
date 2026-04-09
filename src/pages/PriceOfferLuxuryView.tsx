import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import PitchDeck from "@/components/price-offer/pitch/PitchDeck";
import { logger } from '@/utils/logger';

interface PriceOffer {
  id: string;
  property_title: string;
  property_details: string | null;
  language: string;
  suggested_price_min: number | null;
  suggested_price_max: number | null;
  price_per_sqm_min: number | null;
  price_per_sqm_max: number | null;
  expected_income_min: number | null;
  expected_income_max: number | null;
}

interface Block {
  id: string;
  block_type: string;
  block_data: any;
  block_order: number;
}

interface Image {
  id: string;
  image_url: string;
  block_id: string | null;
  image_order: number;
}

// Static offer data for known slugs
const STATIC_OFFERS: Record<string, PriceOffer> = {
  'yitzhak-elhanan-14': {
    id: 'static-yitzhak-elhanan-14',
    property_title: 'יצחק אלחנן 14, נווה צדק',
    property_details: 'דירת גן יוקרתית בלב נווה צדק',
    language: 'he',
    suggested_price_min: null,
    suggested_price_max: null,
    price_per_sqm_min: null,
    price_per_sqm_max: null,
    expected_income_min: null,
    expected_income_max: null,
  }
};

const PriceOfferLuxuryView = () => {
  const { token } = useParams<{ token: string }>();
  const [offer, setOffer] = useState<PriceOffer | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchOffer = async () => {
      if (!token) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Check for static offer first
      if (STATIC_OFFERS[token]) {
        setOffer(STATIC_OFFERS[token]);
        setLoading(false);
        return;
      }

      try {
        // Try to find by token or slug in database
        let { data: offerData, error } = await supabase
          .from('price_offers')
          .select('*')
          .or(`token.eq.${token},slug.eq.${token}`)
          .eq('is_active', true)
          .single();

        if (error || !offerData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setOffer(offerData);

        // Fetch blocks
        const { data: blocksData } = await supabase
          .from('price_offer_blocks')
          .select('*')
          .eq('offer_id', offerData.id)
          .order('block_order');

        setBlocks(blocksData || []);

        // Fetch images
        const { data: imagesData } = await supabase
          .from('price_offer_images')
          .select('*')
          .eq('offer_id', offerData.id)
          .order('image_order');

        setImages(imagesData || []);

        // Increment view count
        await supabase
          .from('price_offers')
          .update({ 
            views_count: (offerData.views_count || 0) + 1,
            last_viewed_at: new Date().toISOString()
          })
          .eq('id', offerData.id);

      } catch (err) {
        logger.error('Error fetching offer:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (notFound || !offer) {
    return <Navigate to="/" replace />;
  }

  return <PitchDeck offer={offer} blocks={blocks} images={images} />;
};

export default PriceOfferLuxuryView;
