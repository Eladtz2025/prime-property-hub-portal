import type { DifferentiatorsSlideData } from '@/types/pitch-deck';
import cityMarketLogo from "@/assets/city-market-icon.png";
import { Globe, MessageCircle, Handshake, Network, LucideIcon } from 'lucide-react';

interface DynamicDifferentiatorsSlideProps {
  data: DifferentiatorsSlideData;
  backgroundImage?: string;
  overlayOpacity?: number;
}

const iconMap: Record<string, LucideIcon> = {
  Globe, MessageCircle, Handshake, Network
};

const DynamicDifferentiatorsSlide = ({ 
  data, 
  backgroundImage = '/images/ben-yehuda-110/WhatsApp Image 2026-01-12 at 18.21.59.jpeg',
  overlayOpacity = 0.85 
}: DynamicDifferentiatorsSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  const defaultDifferentiators = [
    { heading: 'Designed for an international audience', description: 'Specialized expertise catering to foreign buyers, relocation clients, and international investors', icon: 'Globe' },
    { heading: 'Native English-speaking representation', description: 'Clear, confident communication that builds trust and removes friction at every stage of the process', icon: 'MessageCircle' },
    { heading: 'End-to-end guidance', description: 'Comprehensive support through a trusted network of legal, tax, and transaction specialists—from initial interest through closing', icon: 'Handshake' },
    { heading: 'Global reach with local depth', description: 'Direct access to personal and professional networks both locally and internationally, connecting properties with a diverse, qualified client base—investors, end users, and relocating families', icon: 'Network' },
  ];

  const differentiators = data.differentiators?.length ? data.differentiators : defaultDifferentiators;
  
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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-4 md:px-8 pt-4 pb-20 md:pt-6 md:pb-24 lg:pb-28" dir="ltr">
        {/* Large Logo */}
        <img 
          src={cityMarketLogo} 
          alt="City Market Properties" 
          className="h-10 md:h-16 w-auto opacity-90 mb-3 md:mb-4"
        />

        {/* Title */}
        <h2 
          className="text-xl md:text-3xl lg:text-4xl font-serif font-light text-white mb-3 md:mb-6"
          style={{ textShadow: softShadow }}
        >
          {data.title || 'What Differentiates City Market'}
        </h2>

        {/* Decorative Line */}
        <div className="w-12 md:w-16 h-px bg-[#f5c242] mb-4 md:mb-6" />

        {/* Differentiators Grid - 2x2 */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
          {differentiators.map((item, index) => {
            const IconComponent = iconMap[item.icon] || Globe;
            return (
              <div 
                key={index}
                className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-5 text-left border-2 border-[#f5c242]/30 hover:border-[#f5c242]/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#f5c242]/20 flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-[#f5c242]" />
                  </div>
                  <div className="flex-1">
                    <h3 
                      className="text-white font-semibold text-sm md:text-base lg:text-lg mb-1 md:mb-2"
                      style={{ textShadow: softShadow }}
                    >
                      {item.heading}
                    </h3>
                    <p className="text-white/80 text-xs md:text-sm font-light leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DynamicDifferentiatorsSlide;
