import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Clock, ExternalLink } from "lucide-react";
import cityMarketLogo from "@/assets/city-market-icon.png";

const PresentationPricingPage = () => {
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

  const recentlySoldProperties = [
    { address: "Ben Yehuda 98", price: "₪4.1M", size: "60 sqm" },
    { address: "Dizengoff 145", price: "₪3.8M", size: "55 sqm" },
    { address: "Ben Yehuda 122", price: "₪4.3M", size: "65 sqm" },
  ];

  const currentlyForSaleProperties = [
    { address: "Ben Yehuda 95", price: "₪4.4M", size: "62 sqm" },
    { address: "Dizengoff 130", price: "₪4.0M", size: "58 sqm" },
  ];

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
          to="/offer/ben-yehuda-110"
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
            {t.title}
          </h1>
          <p 
            className="text-white/80 text-sm md:text-lg mb-4 text-center"
            style={{ textShadow: softShadow }}
          >
            {t.subtitle}
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
                ₪4,250,000
              </p>
              <div className="w-12 h-px bg-[#f5c242]/50 mx-auto mb-3" />
              <p 
                className="text-white/80 text-sm md:text-base mb-4"
                style={{ textShadow: softShadow }}
              >
                {t.premiumDesc}
              </p>
              <div className="flex items-center justify-center gap-2 text-[#f5c242]">
                <Clock className="w-4 h-4" />
                <span className="text-sm md:text-base">
                  7-11 {t.months}
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
                ₪3,950,000
              </p>
              <div className="w-12 h-px bg-[#f5c242]/50 mx-auto mb-3" />
              <p 
                className="text-white/80 text-sm md:text-base mb-4"
                style={{ textShadow: softShadow }}
              >
                {t.competitiveDesc}
              </p>
              <div className="flex items-center justify-center gap-2 text-[#f5c242]">
                <Clock className="w-4 h-4" />
                <span className="text-sm md:text-base">
                  3-5 {t.months}
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
                {recentlySoldProperties.map((property, index) => (
                  <a
                    key={index}
                    href="#"
                    className="flex items-center justify-between bg-white/10 hover:bg-white/20 transition-colors rounded-md px-3 py-2 group"
                  >
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-white text-xs md:text-sm">{property.address}</span>
                      <span className="text-white/60 text-xs">({property.size})</span>
                    </div>
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[#f5c242] text-xs md:text-sm font-medium">{property.price}</span>
                      <ExternalLink className="w-3 h-3 text-white/50 group-hover:text-white/80 transition-colors" />
                    </div>
                  </a>
                ))}
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
                {currentlyForSaleProperties.map((property, index) => (
                  <a
                    key={index}
                    href="#"
                    className="flex items-center justify-between bg-white/10 hover:bg-white/20 transition-colors rounded-md px-3 py-2 group"
                  >
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-white text-xs md:text-sm">{property.address}</span>
                      <span className="text-white/60 text-xs">({property.size})</span>
                    </div>
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[#f5c242] text-xs md:text-sm font-medium">{property.price}</span>
                      <ExternalLink className="w-3 h-3 text-white/50 group-hover:text-white/80 transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Continue to Step 2 */}
          <Link 
            to="/offer/ben-yehuda-110/exclusivity"
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

export default PresentationPricingPage;
