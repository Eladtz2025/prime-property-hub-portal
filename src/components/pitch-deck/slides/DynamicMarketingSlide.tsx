import { MarketingSlideData } from '@/types/pitch-deck';
import { Camera, Users, Target, LucideIcon } from 'lucide-react';

interface DynamicMarketingSlideProps {
  data: MarketingSlideData;
  backgroundImage?: string;
  overlayOpacity?: number;
}

const iconMap: Record<string, LucideIcon> = {
  Camera, Users, Target
};

const DynamicMarketingSlide = ({ 
  data, 
  backgroundImage = '/images/ben-yehuda-110/IMG_5766.JPG',
  overlayOpacity = 0.85 
}: DynamicMarketingSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  const columns = [
    { 
      icon: Camera, 
      title: "Visual Strategy", 
      items: data.visual_strategy || ["Professional photography and video", "Lifestyle-led storytelling"] 
    },
    { 
      icon: Users, 
      title: "Target Audiences", 
      items: data.target_audiences || ["Local lifestyle buyers", "Foreign residents & overseas buyers"] 
    },
    { 
      icon: Target, 
      title: "Exposure Strategy", 
      items: data.exposure_strategy || ["Curated launch before mass advertising", "Private networks and off-market reach"] 
    }
  ];
  
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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-start pt-10 md:pt-14 text-center px-4 md:px-8 pb-20 md:pb-24 lg:pb-28" dir="ltr">
        {/* Title */}
        <h2 
          className="text-2xl md:text-4xl lg:text-5xl font-serif font-light text-white mb-3 md:mb-6"
          style={{ textShadow: softShadow }}
        >
          {data.title || 'Positioning & Strategy'}
        </h2>

        {/* Decorative Line */}
        <div className="w-12 md:w-16 h-px bg-[#f5c242] mb-3 md:mb-6" />

        {/* Positioning Quote */}
        {data.positioning_quote && (
          <div className="w-full max-w-5xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-3 md:p-5 mb-4 md:mb-6">
            <p 
              className="text-white text-sm md:text-lg lg:text-xl font-light italic"
              style={{ textShadow: softShadow }}
            >
              "{data.positioning_quote}"
            </p>
          </div>
        )}

        {/* Three Column Grid with Icons */}
        <div className="w-full max-w-5xl grid grid-cols-3 gap-2 md:gap-4">
          {columns.map((column, columnIndex) => {
            const IconComponent = column.icon;
            return (
              <div 
                key={columnIndex}
                className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-4 text-left"
              >
                {/* Large Icon */}
                <div className="flex justify-center mb-2 md:mb-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#f5c242]/20 flex items-center justify-center">
                    <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-[#f5c242]" />
                  </div>
                </div>
                
                <h3 
                  className="text-sm md:text-base font-serif text-white mb-2 text-center"
                  style={{ textShadow: softShadow }}
                >
                  {column.title}
                </h3>
                <ul className="space-y-1 md:space-y-2">
                  {column.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-1.5">
                      <span className="text-[#f5c242] mt-0.5 text-xs">•</span>
                      <span className="text-white/90 text-xs md:text-sm font-light">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DynamicMarketingSlide;
