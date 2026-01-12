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
    "Exclusive sales representation with City Market Properties",
    "Agreed pricing and positioning strategy",
    "Controlled, strategic exposure from day one",
    "Regular updates and market feedback",
    "Clear reporting on buyer interest and activity",
    "Begin preparation and targeted marketing"
  ];
  
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/Ben Yehuda 110/IMG_5758.JPG')`,
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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-4 md:px-8 py-16 overflow-y-auto" dir="ltr">
        {/* Title */}
        <h2 
          className="text-3xl md:text-5xl font-serif font-light text-white mb-6 md:mb-8"
          style={{ textShadow: softShadow }}
        >
          NEXT STEPS
        </h2>

        {/* Decorative Line */}
        <div className="w-16 h-px bg-[#f5c242] mb-6 md:mb-8" />

        {/* Unified Checklist Box */}
        <div className="w-full max-w-3xl bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-6 md:p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {checklist.map((item, index) => (
              <div key={index} className="flex items-start gap-3 text-left">
                <CheckCircle2 className="w-5 h-5 text-[#f5c242] flex-shrink-0 mt-0.5" />
                <span className="text-white/90 text-sm md:text-base font-light">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action Box */}
        <div className="w-full max-w-3xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-5 md:p-6 mb-8 border border-[#f5c242]/30">
          <p 
            className="text-white text-base md:text-lg lg:text-xl font-light italic leading-relaxed"
            style={{ textShadow: softShadow }}
          >
            "Move forward with a focused, professional strategy designed to protect value and attract the right buyer."
          </p>
        </div>

        {/* Large Logo */}
        <img 
          src={cityMarketLogo} 
          alt="City Market Properties" 
          className="h-16 md:h-20 w-auto opacity-90 mb-4"
        />
        
        <p 
          className="text-base md:text-lg font-medium text-white tracking-[0.2em] mb-4"
          style={{ textShadow: softShadow }}
        >
          CITY MARKET PROPERTIES
        </p>

        <p 
          className="text-white text-base md:text-lg font-light mb-5"
          style={{ textShadow: softShadow }}
        >
          Tali Silberberg · Elad Tzabari
        </p>

        {/* Contact Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a 
            href="tel:054-228-4477" 
            className="flex items-center gap-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors px-6 py-3 rounded-full"
          >
            <Phone className="w-5 h-5 text-[#f5c242]" />
            <span className="text-white text-base md:text-lg font-medium">054-228-4477</span>
          </a>
          
          <a 
            href="tel:054-228-4477" 
            className="flex items-center gap-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors px-6 py-3 rounded-full"
          >
            <Phone className="w-5 h-5 text-[#f5c242]" />
            <span className="text-white text-base md:text-lg font-medium">054-228-4477</span>
          </a>

          <a 
            href="https://wa.me/972542284477" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] transition-colors px-6 py-3 rounded-full"
          >
            <MessageCircle className="w-5 h-5 text-white" />
            <span className="text-white text-base md:text-lg font-medium">WhatsApp</span>
          </a>
        </div>

        <p 
          className="text-white/70 text-sm font-light tracking-wider mt-6"
          style={{ textShadow: softShadow }}
        >
          Licensed Brokerage | Israel
        </p>
      </div>
    </div>
  );
};

export default BYContactSlide;
