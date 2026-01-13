import { Link } from "react-router-dom";
import cityMarketLogo from "@/assets/city-market-icon.png";
import { Phone, CheckCircle2, MessageCircle, ArrowRight } from "lucide-react";

interface BYContactSlideProps {
  content?: {
    title?: string;
    contactInfo?: string;
  };
}

const BYContactSlide = ({ content }: BYContactSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  const checklist = [
    "Exclusive sales representation",
    "Aligned pricing strategy",
    "Controlled, strategic exposure",
    "Ongoing updates & market feedback"
  ];
  
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/ben-yehuda-110/image-1 (1).png')`,
        }}
      />
      
      {/* Warm sand/orange filter overlay */}
      <div 
        className="absolute inset-0" 
        style={{ 
          backgroundColor: 'rgba(180, 140, 100, 0.85)',
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
          Next Steps
        </h2>

        {/* Decorative Line */}
        <div className="w-12 md:w-16 h-px bg-[#f5c242] mb-3 md:mb-6" />

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

        {/* Call to Action Box - Now Clickable */}
        <Link 
          to="/offer/ben-yehuda-110/exclusivity"
          className="w-full max-w-3xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-2 md:p-4 mb-2 md:mb-3 border border-[#f5c242]/30 hover:bg-[#8b7765]/90 hover:border-[#f5c242]/50 transition-all cursor-pointer block group"
        >
          <p 
            className="text-white text-xs md:text-base font-light italic leading-relaxed"
            style={{ textShadow: softShadow }}
          >
            Move forward with a focused strategy that protects value and attracts the right buyer.
          </p>
          <p className="text-[#f5c242] text-xs mt-2 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            Click to proceed with exclusive listing
            <ArrowRight className="h-3 w-3" />
          </p>
        </Link>

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
            Tali Silberberg · Elad Tzabari
          </p>

          {/* Contact Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <a 
              href="tel:054-228-4477" 
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors px-3 md:px-5 py-1.5 md:py-2 rounded-full"
            >
              <Phone className="w-3 h-3 md:w-4 md:h-4 text-[#f5c242]" />
              <span className="text-white text-xs md:text-sm font-medium">054-228-4477</span>
            </a>

            <a 
              href="https://wa.me/972542284477" 
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

export default BYContactSlide;
