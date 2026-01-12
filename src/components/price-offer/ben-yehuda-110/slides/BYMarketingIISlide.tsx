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
    { icon: MessageSquare, text: "Narrative control throughout the process" },
    { icon: Shield, text: "Strategic negotiation protecting price, terms, and timing" }
  ];
  
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/ben-yehuda-110/IMG_5295.jpeg')`,
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
        {/* Large Logo */}
        <img 
          src={cityMarketLogo} 
          alt="City Market Properties" 
          className="h-16 md:h-20 w-auto opacity-90 mb-6"
        />

        {/* Title */}
        <h2 
          className="text-3xl md:text-5xl font-serif font-light text-white mb-6 md:mb-8"
          style={{ textShadow: softShadow }}
        >
          WHY CITY MARKET
        </h2>

        {/* Decorative Line */}
        <div className="w-16 h-px bg-[#f5c242] mb-6 md:mb-8" />

        {/* Opening Statement */}
        <div className="w-full max-w-3xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-5 md:p-6 mb-6">
          <p 
            className="text-white text-lg md:text-xl font-light italic"
            style={{ textShadow: softShadow }}
          >
            "Buyers at this level respond to confidence and clarity."
          </p>
        </div>

        {/* Our Approach - Cards Grid */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {ourApproach.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div 
                key={index}
                className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-5 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-[#f5c242]/20 flex items-center justify-center mx-auto mb-3">
                  <IconComponent className="w-6 h-6 text-[#f5c242]" />
                </div>
                <p className="text-white/90 text-sm md:text-base font-light">{item.text}</p>
              </div>
            );
          })}
        </div>

        {/* Result Box - Spotlight Effect */}
        <div 
          className="w-full max-w-3xl rounded-xl p-6 md:p-10 border-2 border-[#f5c242]/50"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(139,119,101,0.9) 0%, rgba(139,119,101,0.7) 100%)'
          }}
        >
          <h3 
            className="text-base md:text-lg font-serif text-[#f5c242] mb-4"
            style={{ textShadow: softShadow }}
          >
            Result
          </h3>
          <p 
            className="text-white text-2xl md:text-3xl lg:text-4xl font-light italic"
            style={{ textShadow: softShadow }}
          >
            "We manage buyer behavior, not just listings."
          </p>
        </div>
      </div>
    </div>
  );
};

export default BYMarketingIISlide;
