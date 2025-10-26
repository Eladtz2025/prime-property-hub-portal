import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PriceOfferHeader from '@/components/price-offer/PriceOfferHeader';
import PriceOfferTable from '@/components/price-offer/PriceOfferTable';
import PriceOfferImageGallery from '@/components/price-offer/PriceOfferImageGallery';
import PriceOfferTextBlock from '@/components/price-offer/PriceOfferTextBlock';
import PriceOfferPriceCard from '@/components/price-offer/PriceOfferPriceCard';
import PriceOfferDivider from '@/components/price-offer/PriceOfferDivider';

interface PriceOffer {
  id: string;
  property_title: string;
  property_details: string | null;
  suggested_price_min: number | null;
  suggested_price_max: number | null;
  price_per_sqm_min: number | null;
  price_per_sqm_max: number | null;
  expected_income_min: number | null;
  expected_income_max: number | null;
  language: string;
  is_active: boolean;
  views_count: number;
  created_at: string;
}

interface Block {
  id: string;
  block_type: string;
  block_order: number;
  block_data: any;
}

interface Image {
  id: string;
  image_url: string;
  image_order: number;
  block_id: string | null;
}

const PriceOfferView = () => {
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

      try {
        // Fetch offer
        const { data: offerData, error: offerError } = await supabase
          .from('price_offers')
          .select('*')
          .eq('token', token)
          .eq('is_active', true)
          .single();

        if (offerError || !offerData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setOffer(offerData);

        // Update views count
        await supabase
          .from('price_offers')
          .update({ 
            views_count: offerData.views_count + 1,
            last_viewed_at: new Date().toISOString()
          })
          .eq('id', offerData.id);

        // Fetch blocks
        const { data: blocksData } = await supabase
          .from('price_offer_blocks')
          .select('*')
          .eq('offer_id', offerData.id)
          .order('block_order', { ascending: true });

        if (blocksData) {
          setBlocks(blocksData);
        }

        // Fetch images
        const { data: imagesData } = await supabase
          .from('price_offer_images')
          .select('*')
          .eq('offer_id', offerData.id)
          .order('image_order', { ascending: true });

        if (imagesData) {
          setImages(imagesData);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching offer:', error);
        setNotFound(true);
        setLoading(false);
      }
    };

    fetchOffer();
  }, [token]);

  const handleWhatsApp = () => {
    const message = offer?.language === 'he' 
      ? `היי, ראיתי את הצעת המחיר לנכס ${offer.property_title}. אשמח לשמוע פרטים נוספים.`
      : `Hi, I saw the price offer for ${offer.property_title}. I'd like to hear more details.`;
    
    const whatsappNumber = '972502000000'; // Replace with actual WhatsApp number
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !offer) {
    return <Navigate to="/" replace />;
  }

  const isRTL = offer.language === 'he';
  const galleryImages = images.filter(img => !img.block_id);

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : ''}`}>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <PriceOfferHeader
          title={offer.property_title}
          details={offer.property_details}
          priceMin={offer.suggested_price_min}
          priceMax={offer.suggested_price_max}
          incomeMin={offer.expected_income_min}
          incomeMax={offer.expected_income_max}
          language={offer.language}
        />

        {/* Gallery Images (not attached to blocks) */}
        {galleryImages.length > 0 && (
          <div className="mt-8">
            <PriceOfferImageGallery images={galleryImages.map(img => img.image_url)} />
          </div>
        )}

        {/* Dynamic Blocks */}
        <div className="mt-8 space-y-6">
          {blocks.map((block) => {
            const blockImages = images.filter(img => img.block_id === block.id);

            switch (block.block_type) {
              case 'text':
                return (
                  <PriceOfferTextBlock
                    key={block.id}
                    title={block.block_data.title}
                    content={block.block_data.content}
                  />
                );

              case 'table':
                return (
                  <PriceOfferTable
                    key={block.id}
                    title={block.block_data.title}
                    data={block.block_data.data}
                  />
                );

              case 'images':
                return blockImages.length > 0 ? (
                  <PriceOfferImageGallery
                    key={block.id}
                    images={blockImages.map(img => img.image_url)}
                  />
                ) : null;

              case 'price_card':
                return (
                  <PriceOfferPriceCard
                    key={block.id}
                    price={block.block_data.price}
                    description={block.block_data.description}
                  />
                );

              case 'divider':
                return <PriceOfferDivider key={block.id} />;

              default:
                return null;
            }
          })}
        </div>

        {/* WhatsApp Contact Button */}
        <div className="mt-12 text-center">
          <Button
            onClick={handleWhatsApp}
            size="lg"
            className="bg-[#25D366] hover:bg-[#20BD5A] text-white gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            {isRTL ? 'יש שאלות? דבר איתנו' : 'Questions? Contact Us'}
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-muted-foreground text-sm border-t border-border pt-6">
          <p>City Market Properties</p>
        </div>
      </div>
    </div>
  );
};

export default PriceOfferView;
