import cityMarketLogo from "@/assets/city-market-icon.png";
import { Phone } from "lucide-react";

interface BYContactSlideProps {
  content?: {
    title?: string;
    contactInfo?: string;
  };
}

const BYContactSlide = ({ content }: BYContactSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  const proposedFramework = [
    "Exclusive sales representation with City Market Properties",
    "Agreed pricing and positioning strategy",
    "Controlled, strategic exposure from day one"
  ];

  const communication = [
    "Regular updates and market feedback",
    "Clear reporting on buyer interest and activity",
    "Ongoing pricing and strategy alignment as needed"
  ];

  const nextSteps = [
    "Confirm exclusivity agreement",
    "Finalize pricing and launch strategy",
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
        <div className="w-16 h-px bg-white mb-6 md:mb-8" />

        {/* Three Column Grid */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-4 md:mb-6">
          {/* Proposed Framework */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-5 text-left">
            <h3 
              className="text-base md:text-lg font-serif text-white mb-3"
              style={{ textShadow: softShadow }}
            >
              Proposed Framework
            </h3>
            <ul className="space-y-2">
              {proposedFramework.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-white/60 mt-1 text-sm">•</span>
                  <span className="text-white/90 text-xs md:text-sm font-light">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Communication */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-5 text-left">
            <h3 
              className="text-base md:text-lg font-serif text-white mb-3"
              style={{ textShadow: softShadow }}
            >
              Communication & Transparency
            </h3>
            <ul className="space-y-2">
              {communication.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-white/60 mt-1 text-sm">•</span>
                  <span className="text-white/90 text-xs md:text-sm font-light">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Immediate Next Steps */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-5 text-left">
            <h3 
              className="text-base md:text-lg font-serif text-white mb-3"
              style={{ textShadow: softShadow }}
            >
              Immediate Next Steps
            </h3>
            <ul className="space-y-2">
              {nextSteps.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-white/60 mt-1 text-sm">•</span>
                  <span className="text-white/90 text-xs md:text-sm font-light">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Call to Action Box */}
        <div className="w-full max-w-4xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-5 md:p-6 mb-6">
          <p 
            className="text-white text-base md:text-lg lg:text-xl font-light italic leading-relaxed"
            style={{ textShadow: softShadow }}
          >
            "Move forward with a focused, professional strategy designed to protect value and attract the right buyer."
          </p>
        </div>

        {/* Logo & Contact Info */}
        <div className="flex flex-col items-center">
          <img 
            src={cityMarketLogo} 
            alt="City Market Properties" 
            className="h-10 md:h-12 w-auto opacity-90 mb-3"
          />
          
          <p 
            className="text-sm md:text-base font-medium text-white tracking-[0.2em] mb-2"
            style={{ textShadow: softShadow }}
          >
            CITY MARKET PROPERTIES
          </p>

          <p 
            className="text-white/90 text-sm md:text-base font-light mb-3"
            style={{ textShadow: softShadow }}
          >
            Tali Silberberg · Elad Tzabari
          </p>

          <div className="flex items-center gap-4 mb-2">
            <a 
              href="tel:054-228-4477" 
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm md:text-base font-light">054-228-4477</span>
            </a>
            <span className="text-white/50">|</span>
            <a 
              href="tel:054-228-4477" 
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm md:text-base font-light">054-228-4477</span>
            </a>
          </div>

          <p 
            className="text-white/70 text-xs md:text-sm font-light tracking-wider"
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
