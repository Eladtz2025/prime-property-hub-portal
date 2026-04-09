import { Link } from "react-router-dom";
import { ContactSlideData } from '@/types/pitch-deck';
import { Language, t as getT } from '@/lib/pitch-deck-translations';
import cityMarketLogo from "@/assets/city-market-icon.png";
import { Phone, CheckCircle2, MessageCircle, ArrowRight } from "lucide-react";

interface DynamicContactSlideProps {
  data: ContactSlideData;
  language?: Language;
  backgroundImage?: string;
  overlayOpacity?: number;
  slug?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  agentNames?: string;
}

const DynamicContactSlide = ({ 
  data, 
  language = 'en',
  backgroundImage = '/images/ben-yehuda-110/image-1 (1).png',
  overlayOpacity = 0.85,
  slug = '',
  contactPhone = '054-550-3055',
  contactWhatsapp = '972545503055',
  agentNames = 'Elad Tzabari · Tali Silberberg'
}: DynamicContactSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';
  const t = getT(language);
  const isRTL = language === 'he';

  const defaultChecklist = [
    "Exclusive sales representation",
    "Aligned pricing strategy",
    "Controlled, strategic exposure",
    "Ongoing updates & market feedback"
  ];

  const checklist = data.checklist?.length ? data.checklist : defaultChecklist;
  // Always use dynamic slug-based links (ignore any hardcoded values in database)
  const step1Link = slug ? `/offer/${slug}/pricing` : '#';
  const step2Link = slug ? `/offer/${slug}/exclusivity` : '#';
  
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      />
      
      {/* Warm sand/orange filter overlay */}
      <div 
        className="absolute inset-0" 
        style={{ 
          backgroundColor: `rgba(180, 140, 100, ${overlayOpacity})`,
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-4 md:px-8 py-4 md:py-6" dir="ltr">
        {/* Title */}
        <h2 
          className="text-2xl md:text-4xl lg:text-3xl 2xl:text-5xl font-serif font-light text-white mb-3 md:mb-6 lg:mb-3 2xl:mb-6"
          style={{ textShadow: softShadow }}
        >
          {data.title || 'Next Steps'}
        </h2>

        {/* Decorative Line */}
        <div className="w-12 md:w-16 h-px bg-[#f5c242] mb-6 md:mb-10 lg:mb-4 2xl:mb-10" />

        {/* Steps Navigation */}
        <div className="flex items-center justify-center gap-2 md:gap-4 lg:gap-2 2xl:gap-4 mb-3 md:mb-4 lg:mb-2 2xl:mb-4">
          {/* Step 1 */}
          <Link 
            to={step1Link}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="flex items-center gap-2 bg-[#f5c242] group-hover:bg-[#f5c242]/80 px-3 md:px-4 lg:px-3 2xl:px-4 py-1.5 md:py-2 lg:py-1.5 2xl:py-2 rounded-full transition-all">
              <span className="text-[#2d3b3a] text-xs md:text-sm lg:text-xs 2xl:text-sm font-medium">Step 1</span>
            </div>
            <span className="text-white/70 text-[10px] md:text-xs lg:text-[10px] 2xl:text-xs">Pricing Strategies</span>
          </Link>
          
          {/* Arrow */}
          <div className="flex items-center mt-[-18px] md:mt-[-20px] lg:mt-[-16px] 2xl:mt-[-20px]">
            <div className="w-6 md:w-12 lg:w-8 2xl:w-12 h-px bg-[#f5c242]" />
            <ArrowRight className="w-4 h-4 lg:w-3 lg:h-3 2xl:w-4 2xl:h-4 text-[#f5c242] -ml-1" />
          </div>
          
          {/* Step 2 */}
          <Link 
            to={step2Link}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="flex items-center gap-2 bg-[#f5c242] group-hover:bg-[#f5c242]/80 px-3 md:px-4 lg:px-3 2xl:px-4 py-1.5 md:py-2 lg:py-1.5 2xl:py-2 rounded-full transition-all">
              <span className="text-[#2d3b3a] text-xs md:text-sm lg:text-xs 2xl:text-sm font-medium">Step 2</span>
            </div>
            <span className="text-white/70 text-[10px] md:text-xs lg:text-[10px] 2xl:text-xs">Exclusivity Agreement</span>
          </Link>
        </div>

        {/* Unified Checklist Box */}
        <div className="w-full max-w-3xl bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-5 lg:p-3 2xl:p-5 mb-2 md:mb-3">
          <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-2 2xl:gap-3">
            {checklist.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4 2xl:w-5 2xl:h-5 text-[#f5c242] flex-shrink-0 mt-0.5" />
                <span className="text-white/90 text-xs md:text-sm lg:text-xs 2xl:text-sm font-light text-left">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quote Box */}
        {data.quote && (
          <div className="w-full max-w-3xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-2 md:p-4 lg:p-2 2xl:p-4 mb-2 md:mb-3 border border-[#f5c242]/30">
            <p 
              className="text-white text-xs md:text-base lg:text-xs 2xl:text-base font-light italic leading-relaxed"
              style={{ textShadow: softShadow }}
            >
              {data.quote}
            </p>
          </div>
        )}

        {/* Contact Info Box */}
        <div className="bg-[#8b7765]/60 backdrop-blur-sm rounded-lg p-3 md:p-4 lg:p-2 2xl:p-4 flex flex-col items-center">
          {/* Large Logo */}
          <img 
            src={cityMarketLogo} 
            alt="City Market Properties" 
            className="h-8 md:h-12 lg:h-8 2xl:h-12 w-auto opacity-90 mb-1 md:mb-2 lg:mb-1 2xl:mb-2"
          />
          
          <p 
            className="text-xs md:text-sm lg:text-xs 2xl:text-sm font-medium text-white mb-1 md:mb-2 lg:mb-1 2xl:mb-2"
            style={{ textShadow: softShadow }}
          >
            City Market Properties
          </p>

          <p 
            className="text-white text-xs md:text-sm lg:text-xs 2xl:text-sm font-light mb-2 md:mb-3 lg:mb-1 2xl:mb-3"
            style={{ textShadow: softShadow }}
          >
            {agentNames}
          </p>

          {/* Contact Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2 lg:gap-1 2xl:gap-2">
            <a 
              href={`tel:${contactPhone}`}
              className="flex items-center gap-2 lg:gap-1 2xl:gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors px-3 md:px-5 lg:px-3 2xl:px-5 py-1.5 md:py-2 lg:py-1 2xl:py-2 rounded-full"
            >
              <Phone className="w-3 h-3 md:w-4 md:h-4 lg:w-3 lg:h-3 2xl:w-4 2xl:h-4 text-[#f5c242]" />
              <span className="text-white text-xs md:text-sm lg:text-xs 2xl:text-sm font-medium">{contactPhone}</span>
            </a>

            <a 
              href={`https://wa.me/${contactWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 lg:gap-1 2xl:gap-2 bg-[#25D366] hover:bg-[#20bd5a] transition-colors px-3 md:px-5 lg:px-3 2xl:px-5 py-1.5 md:py-2 lg:py-1 2xl:py-2 rounded-full"
            >
              <MessageCircle className="w-3 h-3 md:w-4 md:h-4 lg:w-3 lg:h-3 2xl:w-4 2xl:h-4 text-white" />
              <span className="text-white text-xs md:text-sm lg:text-xs 2xl:text-sm font-medium">WhatsApp</span>
            </a>
          </div>

          <p 
            className="text-white/70 text-[10px] md:text-xs lg:text-[10px] 2xl:text-xs font-light tracking-wider mt-2 md:mt-3 lg:mt-1 2xl:mt-3"
            style={{ textShadow: softShadow }}
          >
            Licensed Brokerage | Israel
          </p>
        </div>
      </div>
    </div>
  );
};

export default DynamicContactSlide;
