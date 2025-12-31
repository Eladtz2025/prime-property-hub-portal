import { useEffect, useState, useRef } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Home, Maximize, Layers, Car, DoorOpen } from "lucide-react";
import LuxuryHero from "@/components/price-offer/luxury/LuxuryHero";
import LuxurySection from "@/components/price-offer/luxury/LuxurySection";
import LuxuryGallery from "@/components/price-offer/luxury/LuxuryGallery";
import LuxuryStats from "@/components/price-offer/luxury/LuxuryStats";
import LuxuryFeatures from "@/components/price-offer/luxury/LuxuryFeatures";
import LuxuryPropertyDetails from "@/components/price-offer/luxury/LuxuryPropertyDetails";
import LuxuryContact from "@/components/price-offer/luxury/LuxuryContact";
import LuxuryFloatingCTA from "@/components/price-offer/luxury/LuxuryFloatingCTA";

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

const PriceOfferLuxuryView = () => {
  const { token } = useParams<{ token: string }>();
  const [offer, setOffer] = useState<PriceOffer | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOffer = async () => {
      if (!token) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // Try to find by token or slug
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
        console.error('Error fetching offer:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [token]);

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (notFound || !offer) {
    return <Navigate to="/" replace />;
  }

  // Extract data from blocks
  const textBlocks = blocks.filter(b => b.block_type === 'text');
  const tableBlocks = blocks.filter(b => b.block_type === 'table');
  const imageBlocks = blocks.filter(b => b.block_type === 'images');
  const videoBlocks = blocks.filter(b => b.block_type === 'video');
  const mapBlocks = blocks.filter(b => b.block_type === 'map');
  const priceBlocks = blocks.filter(b => b.block_type === 'price_card' || b.block_type === 'price_quote');

  // Get hero image
  const heroImage = images.length > 0 ? images[0].image_url : undefined;
  const galleryImages = images.map(img => img.image_url);

  // Build stats from price data
  const stats = [];
  if (offer.suggested_price_min || offer.suggested_price_max) {
    const price = offer.suggested_price_max || offer.suggested_price_min;
    if (price) stats.push({ label: "מחיר מומלץ", value: price, prefix: "₪" });
  }
  if (offer.price_per_sqm_min || offer.price_per_sqm_max) {
    const ppsqm = offer.price_per_sqm_max || offer.price_per_sqm_min;
    if (ppsqm) stats.push({ label: "מחיר למ״ר", value: ppsqm, prefix: "₪" });
  }
  if (offer.expected_income_min || offer.expected_income_max) {
    const income = offer.expected_income_max || offer.expected_income_min;
    if (income) stats.push({ label: "הכנסה צפויה", value: income, prefix: "₪" });
  }

  // Extract features from text blocks (look for bullet points or list items)
  const features = textBlocks
    .filter(b => b.block_data?.title?.includes('יתרון') || b.block_data?.title?.includes('למה'))
    .flatMap(b => {
      const content = b.block_data?.content || '';
      const lines = content.split('\n').filter((line: string) => line.trim().startsWith('-') || line.trim().startsWith('•'));
      return lines.map((line: string) => ({
        title: line.replace(/^[-•]\s*/, '').trim(),
        icon: 'default'
      }));
    });

  // Get property details from table blocks or offer.property_details
  const propertyDetails: { icon: React.ReactNode; label: string; value: string | number }[] = [];
  tableBlocks.forEach(block => {
    const rows = block.block_data?.rows || [];
    rows.forEach((row: { label: string; value: string }) => {
      if (row.label && row.value) {
        propertyDetails.push({
          icon: <Home className="h-6 w-6" />,
          label: row.label,
          value: row.value
        });
      }
    });
  });

  // WhatsApp number (could be extracted from blocks or hardcoded)
  const whatsappNumber = "972547669985"; // Default company number

  return (
    <div className="min-h-screen bg-white font-sans" dir="rtl">
      {/* Hero Section */}
      <LuxuryHero
        title={offer.property_title}
        subtitle={offer.property_details || undefined}
        backgroundImage={heroImage}
        onScrollDown={scrollToContent}
      />

      {/* Content Sections */}
      <div ref={contentRef}>
        {/* Property Details */}
        {propertyDetails.length > 0 && (
          <LuxurySection className="bg-gray-50">
            <LuxuryPropertyDetails
              title="פרטי הנכס"
              details={propertyDetails}
            />
          </LuxurySection>
        )}

        {/* Text Sections (Area info, etc.) */}
        {textBlocks.map((block, index) => (
          <LuxurySection key={block.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
            <div className="mx-auto max-w-3xl text-center">
              {block.block_data?.title && (
                <h2 className="mb-8 font-serif text-3xl font-light text-gray-900 md:text-4xl">
                  {block.block_data.title}
                </h2>
              )}
              {block.block_data?.content && (
                <div 
                  className="prose prose-lg mx-auto font-light leading-relaxed text-gray-600"
                  dangerouslySetInnerHTML={{ __html: block.block_data.content.replace(/\n/g, '<br/>') }}
                />
              )}
            </div>
          </LuxurySection>
        ))}

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <LuxurySection className="bg-white">
            <LuxuryGallery
              title="גלריה"
              images={galleryImages}
            />
          </LuxurySection>
        )}

        {/* Map */}
        {mapBlocks.map((block) => (
          <LuxurySection key={block.id} className="bg-gray-50 !py-0">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-8 pt-20 text-center font-serif text-3xl font-light text-gray-900 md:text-4xl">
                מיקום
              </h2>
              <div className="aspect-[16/9] overflow-hidden rounded-lg shadow-lg">
                <iframe
                  src={block.block_data?.embedUrl || `https://maps.google.com/maps?q=${encodeURIComponent(block.block_data?.address || '')}&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </LuxurySection>
        ))}

        {/* Features */}
        {features.length > 0 && (
          <LuxurySection className="bg-white">
            <LuxuryFeatures
              title="למה לרכוש כאן?"
              features={features}
            />
          </LuxurySection>
        )}

        {/* Stats / Pricing */}
        {stats.length > 0 && (
          <LuxurySection className="bg-gray-900 text-white">
            <div className="text-center">
              <h2 className="mb-16 font-serif text-3xl font-light text-white md:text-4xl">
                המספרים
              </h2>
              <LuxuryStats stats={stats} />
            </div>
          </LuxurySection>
        )}

        {/* Video */}
        {videoBlocks.map((block) => (
          <LuxurySection key={block.id} className="bg-white">
            <div className="mx-auto max-w-4xl">
              <div className="aspect-video overflow-hidden rounded-lg shadow-lg">
                <iframe
                  src={block.block_data?.embedUrl}
                  width="100%"
                  height="100%"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            </div>
          </LuxurySection>
        ))}

        {/* Contact */}
        <LuxurySection className="bg-gray-50">
          <LuxuryContact
            title="מעוניינים לשמוע עוד?"
            subtitle="נשמח לספר לכם עוד על הנכס ולענות על כל שאלה"
            whatsappNumber={whatsappNumber}
            propertyTitle={offer.property_title}
          />
        </LuxurySection>

        {/* Footer */}
        <footer className="bg-gray-900 py-8 text-center">
          <a 
            href="https://nadlan-dev-project.lovable.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-light text-gray-400 transition-colors hover:text-white"
          >
            Nadlan
          </a>
        </footer>
      </div>

      {/* Floating WhatsApp Button */}
      <LuxuryFloatingCTA
        whatsappNumber={whatsappNumber}
        propertyTitle={offer.property_title}
      />
    </div>
  );
};

export default PriceOfferLuxuryView;
