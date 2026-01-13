import { Link } from "react-router-dom";
import { ContactSlideData } from '@/types/pitch-deck';
import cityMarketLogo from "@/assets/city-market-icon.png";
import { Phone, CheckCircle2, MessageCircle, ArrowRight } from "lucide-react";

interface DynamicContactSlideProps {
  data: ContactSlideData;
  backgroundImage?: string;
  overlayOpacity?: number;
  slug?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  agentNames?: string;
}

const DynamicContactSlide = ({ 
  data, 
  backgroundImage = '/images/ben-yehuda-110/image-1 (1).png',
  overlayOpacity = 0.85,
  slug = '',
  contactPhone = '054-228-4477',
  contactWhatsapp = '972542284477',
  agentNames = 'Tali Silberberg · Elad Tzabari'
}: DynamicContactSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  const defaultChecklist = [
    "Exclusive sales representation",
    "Aligned pricing strategy",
    "Controlled, strategic exposure",
    "Ongoing updates & market feedback"
  ];

  const checklist = data.checklist?.length ? data.checklist : defaultChecklist;
  const step1Link = data.step1_link || (slug ? `/offer/${slug}/pricing` : '#');
  const step2Link = data.step2_link || (slug ? `/offer/${slug}/exclusivity` : '#');
  
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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-start text-center px-4 md:px-8 pt-6 md:pt-10 pb-4 md:pb-6" dir="ltr">
        {/* Title */}
        <h2 
          className="text-2xl md:text-4xl lg:text-5xl font-serif font-light text-white mb-3 md:mb-6"
          style={{ textShadow: softShadow }}
        >
          {data.title || 'Next Steps'}
        </h2>

        {/* Decorative Line */}
        <div className="w-12 md:w-16 h-px bg-[#f5c242] mb-6 md:mb-10" />

        {/* Steps Navigation */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-3 md:mb-4">
          {/* Step 1 */}
          <Link 
            to={step1Link}
            className="flex items-center gap-2 bg-[#f5c242] hover:bg-[#f5c242]/80 px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-all"
          >
            <span className="text-[#2d3b3a] text-xs md:text-sm font-medium">Step 1</span>
          </Link>
          
          {/* Arrow */}
          <div className="flex items-center">
            <div className="w-6 md:w-12 h-px bg-[#f5c242]" />
            <ArrowRight className="w-4 h-4 text-[#f5c242] -ml-1" />
          </div>
          
          {/* Step 2 */}
          <Link 
            to={step2Link}
            className="flex items-center gap-2 bg-[#f5c242] hover:bg-[#f5c242]/80 px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-all"
          >
            <span className="text-[#2d3b3a] text-xs md:text-sm font-medium">Step 2</span>
          </Link>
        </div>

        {/* Unified Checklist Box */}
        <div className="w-full max-w-3xl bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-5 mb-2 md:mb-3">
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {checklist.map((item, index) => (
              <div key={index} className="flex items-start gap-2 text-left">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-[#f5c242] flex-shrink-0 mt-0.5" />
                <span className="text-white/90 text-xs md:text-sm font-light">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quote Box */}
        {data.quote && (
          <div className="w-full max-w-3xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-2 md:p-4 mb-2 md:mb-3 border border-[#f5c242]/30">
            <p 
              className="text-white text-xs md:text-base font-light italic leading-relaxed"
              style={{ textShadow: softShadow }}
            >
              {data.quote}
            </p>
          </div>
        )}

        {/* Contact Info Box */}
        <div className="bg-[#8b7765]/60 backdrop-blur-sm rounded-lg p-3 md:p-4 flex flex-col items-center">
          {/* Large Logo */}
          <img 
            src={cityMarketLogo} 
            alt="City Market Properties" 
            className="h-8 md:h-12 w-auto opacity-90 mb-1 md:mb-2"
          />
          
          <p 
            className="text-xs md:text-sm font-medium text-white mb-1 md:mb-2"
            style={{ textShadow: softShadow }}
          >
            City Market Properties
          </p>

          <p 
            className="text-white text-xs md:text-sm font-light mb-2 md:mb-3"
            style={{ textShadow: softShadow }}
          >
            {agentNames}
          </p>

          {/* Contact Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <a 
              href={`tel:${contactPhone}`}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors px-3 md:px-5 py-1.5 md:py-2 rounded-full"
            >
              <Phone className="w-3 h-3 md:w-4 md:h-4 text-[#f5c242]" />
              <span className="text-white text-xs md:text-sm font-medium">{contactPhone}</span>
            </a>

            <a 
              href={`https://wa.me/${contactWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] transition-colors px-3 md:px-5 py-1.5 md:py-2 rounded-full"
            >
              <MessageCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
              <span className="text-white text-xs md:text-sm font-medium">WhatsApp</span>
            </a>
          </div>

          <p 
            className="text-white/70 text-[10px] md:text-xs font-light tracking-wider mt-2 md:mt-3"
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
