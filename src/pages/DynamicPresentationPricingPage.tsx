import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Clock, ExternalLink, Loader2 } from "lucide-react";
import cityMarketLogo from "@/assets/city-market-icon.png";
import { usePitchDeckBySlug } from "@/hooks/usePitchDecks";
import { Step1PricingSlideData, Step1PropertyItem } from "@/types/pitch-deck";

const DynamicPresentationPricingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: deck, isLoading } = usePitchDeckBySlug(slug);
  const [language, setLanguage] = useState<'en' | 'he'>('en');
  
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  const translations = {
    en: {
      backToPresentation: "Back to Presentation",
      title: "Pricing Strategy",
      subtitle: "Market Analysis & Recommended Positioning",
      optionA: "Option A",
      optionB: "Option B",
      premiumDesc: "Premium price for location & renovation",
      competitiveDesc: "Competitive price for quick sale",
      estimatedTime: "Estimated time to sell",
      months: "months",
      recentlySold: "Recently Sold in Area",
      currentlyForSale: "Currently For Sale",
      continueToStep2: "Continue to Step 2",
      exclusiveAgreement: "Exclusive Agreement"
    },
    he: {
      backToPresentation: "חזרה למצגת",
      title: "אסטרטגיית תמחור",
      subtitle: "ניתוח שוק ומיצוב מומלץ",
      optionA: "אופציה א׳",
      optionB: "אופציה ב׳",
      premiumDesc: "מחיר פרימיום למיקום וחידוש",
      competitiveDesc: "מחיר תחרותי למכירה מהירה",
      estimatedTime: "זמן משוער למכירה",
      months: "חודשים",
      recentlySold: "נמכרו לאחרונה באזור",
      currentlyForSale: "כרגע למכירה",
      continueToStep2: "המשך לשלב 2",
      exclusiveAgreement: "הסכם בלעדיות"
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  // Get pricing data from the step1_pricing slide
  const step1Slide = deck?.slides?.find(s => s.slide_type === 'step1_pricing');
  const pricingData = step1Slide?.slide_data as Step1PricingSlideData | undefined;

  // Fallback values if slide data doesn't exist
  const recentlySoldProperties: Step1PropertyItem[] = pricingData?.recently_sold || [
    { address: "Ben Yehuda 98", price: "₪4.1M", builtSize: "60", balconySize: "8", pricePerSqm: "₪68,000" },
    { address: "Dizengoff 145", price: "₪3.8M", builtSize: "55", balconySize: "5", pricePerSqm: "₪69,000" },
    { address: "Ben Yehuda 122", price: "₪4.3M", builtSize: "65", balconySize: "10", pricePerSqm: "₪66,000" },
  ];

  const currentlyForSaleProperties: Step1PropertyItem[] = pricingData?.currently_for_sale || [
    { address: "Ben Yehuda 95", price: "₪4.4M", builtSize: "62", balconySize: "7", pricePerSqm: "₪71,000" },
    { address: "Dizengoff 130", price: "₪4.0M", builtSize: "58", balconySize: "6", pricePerSqm: "₪69,000" },
  ];

  // Helper to format size display
  const formatSize = (prop: Step1PropertyItem) => {
    const built = prop.builtSize || prop.size || '';
    const balcony = prop.balconySize;
    if (built && balcony) {
      return `${built} + ${balcony} ${isRTL ? 'מרפסת' : 'balcony'}`;
    }
    return built || prop.size || '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b7765 0%, #6d5a4a 100%)' }}>
        <Loader2 className="h-8 w-8 animate-spin text-[#f5c242]" />
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b7765 0%, #6d5a4a 100%)' }}>
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-2">Presentation Not Found</h1>
          <p className="text-white/70">The requested presentation could not be found.</p>
        </div>
      </div>
    );
  }

  // Get property info from deck
  const property = deck.property;
  const propertyAddress = property?.address || deck.title;
  const propertyCity = property?.city || "Tel Aviv";

  return (
    <div className="min-h-screen w-full relative overflow-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/ben-yehuda-110/image-1 (1).png')`,
        }}
      />
      
      {/* Warm sand/orange filter overlay */}
      <div 
        className="fixed inset-0" 
        style={{ 
          backgroundColor: 'rgba(180, 140, 100, 0.85)',
          mixBlendMode: 'overlay'
        }}
      />

      {/* Logo - Fixed Bottom Right */}
      <img 
        src={cityMarketLogo} 
        alt="City Market Properties" 
        className="fixed bottom-4 right-4 h-10 md:h-14 w-auto z-50"
      />

      {/* All content above background */}
      <div className="relative z-10">
        {/* Language Toggle - Fixed Top Left */}
        <div className={`fixed top-4 ${isRTL ? 'right-4' : 'left-4'} z-50 flex gap-2`}>
          <Button
            size="sm"
            variant={language === 'en' ? 'default' : 'outline'}
            onClick={() => setLanguage('en')}
            className={`text-xs ${language === 'en' ? 'bg-[#f5c242] text-[#2d3b3a] hover:bg-[#f5c242]/80' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}`}
          >
            EN
          </Button>
          <Button
            size="sm"
            variant={language === 'he' ? 'default' : 'outline'}
            onClick={() => setLanguage('he')}
            className={`text-xs ${language === 'he' ? 'bg-[#f5c242] text-[#2d3b3a] hover:bg-[#f5c242]/80' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}`}
          >
            עב
          </Button>
        </div>

        {/* Back Button - Fixed Top Right */}
        <Link 
          to={`/offer/${slug}`}
          className={`fixed top-4 ${isRTL ? 'left-4' : 'right-4'} z-50 flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors px-4 py-2 rounded-full text-white text-sm`}
        >
          {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t.backToPresentation}
        </Link>

        {/* Main Content */}
        <div className="min-h-screen flex flex-col items-center justify-start px-4 md:px-8 pt-14 pb-20">
          {/* Title */}
          <h1 
            className="text-3xl md:text-5xl font-serif font-light text-white mb-2 text-center"
            style={{ textShadow: softShadow }}
          >
            {pricingData?.title || t.title}
          </h1>
          <p 
            className="text-white/80 text-sm md:text-lg mb-1 text-center"
            style={{ textShadow: softShadow }}
          >
            {pricingData?.subtitle || t.subtitle}
          </p>
          <p 
            className="text-[#f5c242] text-sm md:text-base mb-4 text-center"
            style={{ textShadow: softShadow }}
          >
            {propertyAddress}, {propertyCity}
          </p>

          {/* Decorative Line */}
          <div className="w-16 h-px bg-[#f5c242] mb-6" />

          {/* Two Pricing Options */}
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
            {/* Option A - Premium */}
            <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-5 md:p-6 text-center border border-[#f5c242]/30">
              <span 
                className="text-[#f5c242] text-sm md:text-base font-medium tracking-widest uppercase"
                style={{ textShadow: softShadow }}
              >
                {t.optionA}
              </span>
              <p 
                className="text-white text-3xl md:text-4xl font-bold mt-3 mb-3"
                style={{ textShadow: softShadow }}
              >
                {pricingData?.option_a_price || '₪4,250,000'}
              </p>
              <div className="w-12 h-px bg-[#f5c242]/50 mx-auto mb-3" />
              <p 
                className="text-white/80 text-sm md:text-base mb-4"
                style={{ textShadow: softShadow }}
              >
                {pricingData?.option_a_description || t.premiumDesc}
              </p>
              <div className="flex items-center justify-center gap-2 text-[#f5c242]">
                <Clock className="w-4 h-4" />
                <span className="text-sm md:text-base">
                  {pricingData?.option_a_months_min || 7}-{pricingData?.option_a_months_max || 11} {t.months}
                </span>
              </div>
              <p className="text-white/60 text-xs mt-1">{t.estimatedTime}</p>
            </div>

            {/* Option B - Competitive */}
            <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-5 md:p-6 text-center border border-[#f5c242]/30">
              <span 
                className="text-[#f5c242] text-sm md:text-base font-medium tracking-widest uppercase"
                style={{ textShadow: softShadow }}
              >
                {t.optionB}
              </span>
              <p 
                className="text-white text-3xl md:text-4xl font-bold mt-3 mb-3"
                style={{ textShadow: softShadow }}
              >
                {pricingData?.option_b_price || '₪3,950,000'}
              </p>
              <div className="w-12 h-px bg-[#f5c242]/50 mx-auto mb-3" />
              <p 
                className="text-white/80 text-sm md:text-base mb-4"
                style={{ textShadow: softShadow }}
              >
                {pricingData?.option_b_description || t.competitiveDesc}
              </p>
              <div className="flex items-center justify-center gap-2 text-[#f5c242]">
                <Clock className="w-4 h-4" />
                <span className="text-sm md:text-base">
                  {pricingData?.option_b_months_min || 3}-{pricingData?.option_b_months_max || 5} {t.months}
                </span>
              </div>
              <p className="text-white/60 text-xs mt-1">{t.estimatedTime}</p>
            </div>
          </div>

          {/* Property Links Section */}
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
            {/* Recently Sold */}
            <div className="bg-[#8b7765]/60 backdrop-blur-sm rounded-lg p-4 md:p-5">
              <h3 
                className="text-[#f5c242] text-sm md:text-base font-medium mb-3"
                style={{ textShadow: softShadow }}
              >
                {t.recentlySold}
              </h3>
              <div className="space-y-2">
                {recentlySoldProperties.map((prop, index) => {
                  const hasLink = prop.link && prop.link.trim() !== '';
                  const Wrapper = hasLink ? 'a' : 'div';
                  const wrapperProps = hasLink ? { 
                    href: prop.link, 
                    target: '_blank', 
                    rel: 'noopener noreferrer' 
                  } : {};
                  
                  return (
                    <Wrapper
                      key={index}
                      {...wrapperProps}
                      className={`flex items-center justify-between bg-white/10 ${hasLink ? 'hover:bg-white/20 cursor-pointer' : ''} transition-colors rounded-md px-3 py-2 group`}
                    >
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-white text-xs md:text-sm">{prop.address}</span>
                        <span className="text-white/60 text-xs">({formatSize(prop)})</span>
                      </div>
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {prop.pricePerSqm && (
                          <span className="text-white/50 text-xs">{prop.pricePerSqm}/מ״ר</span>
                        )}
                        <span className="text-[#f5c242] text-xs md:text-sm font-medium">{prop.price}</span>
                        {hasLink && <ExternalLink className="w-3 h-3 text-white/50 group-hover:text-white/80 transition-colors" />}
                      </div>
                    </Wrapper>
                  );
                })}
              </div>
            </div>

            {/* Currently For Sale */}
            <div className="bg-[#8b7765]/60 backdrop-blur-sm rounded-lg p-4 md:p-5">
              <h3 
                className="text-[#f5c242] text-sm md:text-base font-medium mb-3"
                style={{ textShadow: softShadow }}
              >
                {t.currentlyForSale}
              </h3>
              <div className="space-y-2">
                {currentlyForSaleProperties.map((prop, index) => {
                  const hasLink = prop.link && prop.link.trim() !== '';
                  const Wrapper = hasLink ? 'a' : 'div';
                  const wrapperProps = hasLink ? { 
                    href: prop.link, 
                    target: '_blank', 
                    rel: 'noopener noreferrer' 
                  } : {};
                  
                  return (
                    <Wrapper
                      key={index}
                      {...wrapperProps}
                      className={`flex items-center justify-between bg-white/10 ${hasLink ? 'hover:bg-white/20 cursor-pointer' : ''} transition-colors rounded-md px-3 py-2 group`}
                    >
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-white text-xs md:text-sm">{prop.address}</span>
                        <span className="text-white/60 text-xs">({formatSize(prop)})</span>
                      </div>
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {prop.pricePerSqm && (
                          <span className="text-white/50 text-xs">{prop.pricePerSqm}/מ״ר</span>
                        )}
                        <span className="text-[#f5c242] text-xs md:text-sm font-medium">{prop.price}</span>
                        {hasLink && <ExternalLink className="w-3 h-3 text-white/50 group-hover:text-white/80 transition-colors" />}
                      </div>
                    </Wrapper>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Continue to Step 2 */}
          <Link 
            to={`/offer/${slug}/exclusivity`}
            className="flex items-center gap-3 bg-[#f5c242] hover:bg-[#f5c242]/80 px-6 md:px-8 py-3 md:py-4 rounded-full transition-all group"
          >
            <span className="text-[#2d3b3a] text-sm md:text-base font-medium">
              {t.continueToStep2}: {t.exclusiveAgreement}
            </span>
            <ArrowRight className={`w-5 h-5 text-[#2d3b3a] group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DynamicPresentationPricingPage;
