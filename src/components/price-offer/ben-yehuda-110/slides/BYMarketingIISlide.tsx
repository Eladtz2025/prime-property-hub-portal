import cityMarketLogo from "@/assets/city-market-icon.png";
import { UserCheck, MessageSquare, Shield } from 'lucide-react';

interface BYMarketingIISlideProps {
  content?: {
    title?: string;
    details?: string[];
  };
}

const BYMarketingIISlide = ({ content }: BYMarketingIISlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  const ourApproach = [
    { icon: UserCheck, text: "Pre-screened buyers only" },
    { icon: MessageSquare, text: "Narrative control throughout" },
    { icon: Shield, text: "Strategic negotiation" }
  ];
  
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/ben-yehuda-110/WhatsApp Image 2026-01-12 at 18.21.59.jpeg')`,
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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-4 md:px-8 py-6 md:py-8" dir="ltr">
        {/* Large Logo */}
        <img 
          src={cityMarketLogo} 
          alt="City Market Properties" 
          className="h-10 md:h-16 w-auto opacity-90 mb-3 md:mb-4"
        />

        {/* Title */}
        <h2 
          className="text-2xl md:text-4xl lg:text-5xl font-serif font-light text-white mb-3 md:mb-6"
          style={{ textShadow: softShadow }}
        >
          Why City Market
        </h2>

        {/* Decorative Line */}
        <div className="w-12 md:w-16 h-px bg-[#f5c242] mb-3 md:mb-6" />

        {/* Opening Statement */}
        <div className="w-full max-w-3xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-3 md:p-5 mb-4 md:mb-6">
          <p 
            className="text-white text-sm md:text-lg font-semibold"
            style={{ textShadow: softShadow }}
          >
            Buyers at this level respond to clarity, control, and confidence.
          </p>
        </div>

        {/* Our Approach - Cards Grid */}
        <div className="w-full max-w-3xl grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
          {ourApproach.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div 
                key={index}
                className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-4 text-center"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#f5c242]/20 flex items-center justify-center mx-auto mb-2">
                  <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-[#f5c242]" />
                </div>
                <p className="text-white/90 text-xs md:text-sm font-light">{item.text}</p>
              </div>
            );
          })}
        </div>

        {/* Bottom Statement Box */}
        <div 
          className="w-full max-w-3xl rounded-xl p-3 md:p-5 mb-8 md:mb-12 border-2 border-[#f5c242]/50"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(139,119,101,0.9) 0%, rgba(139,119,101,0.7) 100%)'
          }}
        >
          <p 
            className="text-white text-lg md:text-2xl lg:text-3xl font-semibold"
            style={{ textShadow: softShadow }}
          >
            We manage buyer behavior, not just listings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BYMarketingIISlide;
