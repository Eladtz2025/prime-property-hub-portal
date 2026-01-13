import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, TrendingUp, MapPin, Home, BarChart3 } from "lucide-react";
import cityMarketLogo from "@/assets/city-market-icon.png";

const PresentationPricingPage = () => {
  const [language, setLanguage] = useState<'en' | 'he'>('en');
  
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  const translations = {
    en: {
      backToPresentation: "Back to Presentation",
      title: "Pricing Strategy",
      subtitle: "Market Analysis & Recommended Positioning",
      marketContext: "Market Context",
      avgPricePerSqm: "Avg. Price/sqm",
      transactionRange: "Transaction Range",
      avgSize: "Avg. Size",
      priceRange: "Price Range Analysis",
      lowEnd: "Low End",
      highEnd: "High End",
      recommended: "Recommended",
      strategicPosition: "Strategic Positioning",
      bullets: [
        "Positioned in the upper tier of comparable sales",
        "Price reflects premium for location & condition",
        "Room for negotiation while maintaining value",
        "Aligned with current market momentum"
      ],
      continueToStep2: "Continue to Step 2",
      exclusiveAgreement: "Exclusive Agreement"
    },
    he: {
      backToPresentation: "חזרה למצגת",
      title: "אסטרטגיית תמחור",
      subtitle: "ניתוח שוק ומיצוב מומלץ",
      marketContext: "הקשר שוק",
      avgPricePerSqm: "מחיר ממוצע למ״ר",
      transactionRange: "טווח עסקאות",
      avgSize: "גודל ממוצע",
      priceRange: "ניתוח טווח מחירים",
      lowEnd: "גבול תחתון",
      highEnd: "גבול עליון",
      recommended: "מומלץ",
      strategicPosition: "מיצוב אסטרטגי",
      bullets: [
        "ממוקם בשכבה העליונה של עסקאות דומות",
        "המחיר משקף פרמיה על מיקום ומצב",
        "מרווח למשא ומתן תוך שמירה על ערך",
        "מותאם למומנטום הנוכחי בשוק"
      ],
      continueToStep2: "המשך לשלב 2",
      exclusiveAgreement: "הסכם בלעדיות"
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

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
        <div className="min-h-screen flex flex-col items-center justify-start px-4 md:px-8 pt-20 pb-8">
          {/* Logo */}
          <img 
            src={cityMarketLogo} 
            alt="City Market Properties" 
            className="h-12 md:h-16 w-auto mb-4"
          />

          {/* Title */}
          <h1 
            className="text-3xl md:text-5xl font-serif font-light text-white mb-2 text-center"
            style={{ textShadow: softShadow }}
          >
            {t.title}
          </h1>
          <p 
            className="text-white/80 text-sm md:text-lg mb-6 text-center"
            style={{ textShadow: softShadow }}
          >
            {t.subtitle}
          </p>

          {/* Decorative Line */}
          <div className="w-16 h-px bg-[#f5c242] mb-8" />

          {/* Market Statistics */}
          <div className="w-full max-w-4xl mb-6">
            <h2 
              className="text-xl md:text-2xl font-serif text-white mb-4 text-center"
              style={{ textShadow: softShadow }}
            >
              {t.marketContext}
            </h2>
            <div className="grid grid-cols-3 gap-3 md:gap-6">
              <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-5 text-center">
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-[#f5c242] mx-auto mb-2" />
                <p className="text-[#f5c242] text-xl md:text-3xl font-bold">₪58K</p>
                <p className="text-white/70 text-xs md:text-sm">{t.avgPricePerSqm}</p>
              </div>
              <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-5 text-center">
                <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-[#f5c242] mx-auto mb-2" />
                <p className="text-[#f5c242] text-lg md:text-2xl font-bold">₪2.9M-5.7M</p>
                <p className="text-white/70 text-xs md:text-sm">{t.transactionRange}</p>
              </div>
              <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-5 text-center">
                <Home className="w-6 h-6 md:w-8 md:h-8 text-[#f5c242] mx-auto mb-2" />
                <p className="text-[#f5c242] text-xl md:text-3xl font-bold">62m²</p>
                <p className="text-white/70 text-xs md:text-sm">{t.avgSize}</p>
              </div>
            </div>
          </div>

          {/* Price Range Bar */}
          <div className="w-full max-w-4xl bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-6 mb-6">
            <h3 
              className="text-lg md:text-xl font-serif text-white mb-4 text-center"
              style={{ textShadow: softShadow }}
            >
              {t.priceRange}
            </h3>
            <div className="relative h-12 md:h-16 bg-gradient-to-r from-[#8b7765] via-[#f5c242] to-[#e85c3a] rounded-full overflow-hidden mb-4">
              {/* Recommended marker */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white"
                style={{ left: '65%' }}
              />
              <div 
                className="absolute -top-6 transform -translate-x-1/2 text-white text-xs font-medium"
                style={{ left: '65%', textShadow: softShadow }}
              >
                {t.recommended}
              </div>
            </div>
            <div className={`flex justify-between text-white/80 text-xs md:text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>₪2.9M ({t.lowEnd})</span>
              <span className="text-[#f5c242] font-bold">₪4.2M</span>
              <span>₪5.7M ({t.highEnd})</span>
            </div>
          </div>

          {/* Strategic Positioning */}
          <div className="w-full max-w-4xl bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-6 mb-8">
            <h3 
              className="text-lg md:text-xl font-serif text-white mb-4 flex items-center gap-2"
              style={{ textShadow: softShadow }}
            >
              <MapPin className="w-5 h-5 text-[#f5c242]" />
              {t.strategicPosition}
            </h3>
            <ul className={`space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.bullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-[#f5c242] mt-1">•</span>
                  <span className="text-white/90 text-sm md:text-base">{bullet}</span>
                </li>
              ))}
            </ul>
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
