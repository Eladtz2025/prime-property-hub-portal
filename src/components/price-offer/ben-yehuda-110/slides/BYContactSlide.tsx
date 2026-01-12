import cityMarketLogo from "@/assets/city-market-icon.png";
import { Phone, CheckCircle2, MessageCircle } from "lucide-react";

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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-start text-center px-4 md:px-8 pt-8 md:pt-12 pb-6 md:pb-8" dir="ltr">
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
        <div className="w-full max-w-3xl bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-6 mb-3 md:mb-4">
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {checklist.map((item, index) => (
              <div key={index} className="flex items-start gap-2 text-left">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-[#f5c242] flex-shrink-0 mt-0.5" />
                <span className="text-white/90 text-xs md:text-sm font-light">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action Box */}
        <div className="w-full max-w-3xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-3 md:p-5 mb-3 md:mb-4 border border-[#f5c242]/30">
          <p 
            className="text-white text-xs md:text-base font-light italic leading-relaxed"
            style={{ textShadow: softShadow }}
          >
            "Move forward with a focused strategy that protects value and attracts the right buyer."
          </p>
        </div>

        {/* Contact Info Box */}
        <div className="bg-[#8b7765]/60 backdrop-blur-sm rounded-lg p-4 md:p-6 flex flex-col items-center">
          {/* Large Logo */}
          <img 
            src={cityMarketLogo} 
            alt="City Market Properties" 
            className="h-10 md:h-16 w-auto opacity-90 mb-2 md:mb-3"
          />
          
          <p 
            className="text-sm md:text-base font-medium text-white mb-2 md:mb-3"
            style={{ textShadow: softShadow }}
          >
            City Market Properties
          </p>

          <p 
            className="text-white text-xs md:text-base font-light mb-3 md:mb-4"
            style={{ textShadow: softShadow }}
          >
            Tali Silberberg · Elad Tzabari
          </p>

          {/* Contact Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3">
            <a 
              href="tel:054-228-4477" 
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors px-4 md:px-6 py-2 md:py-2.5 rounded-full"
            >
              <Phone className="w-4 h-4 md:w-5 md:h-5 text-[#f5c242]" />
              <span className="text-white text-sm md:text-base font-medium">054-228-4477</span>
            </a>

            <a 
              href="https://wa.me/972542284477" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] transition-colors px-4 md:px-6 py-2 md:py-2.5 rounded-full"
            >
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
              <span className="text-white text-sm md:text-base font-medium">WhatsApp</span>
            </a>
          </div>

          <p 
            className="text-white/70 text-xs font-light tracking-wider mt-3 md:mt-4"
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
