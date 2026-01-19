import { NeighborhoodSlideData } from '@/types/pitch-deck';
import { Waves, MapPin, Coffee, ShoppingBag, TreePalm, LucideIcon } from 'lucide-react';

interface DynamicNeighborhoodSlideProps {
  data: NeighborhoodSlideData;
  backgroundImage?: string;
  overlayOpacity?: number;
}

const iconMap: Record<string, LucideIcon> = {
  Waves, MapPin, Coffee, ShoppingBag, TreePalm
};

const DynamicNeighborhoodSlide = ({ 
  data, 
  backgroundImage = '/images/ben-yehuda-110/IMG_5763.JPG',
  overlayOpacity = 0.85 
}: DynamicNeighborhoodSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';
  const defaultIcons = [Coffee, ShoppingBag, TreePalm];

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
          className="text-lg md:text-3xl lg:text-4xl font-serif font-light text-white mb-3 md:mb-4"
          style={{ textShadow: softShadow }}
        >
          {data.title || 'Neighborhood'}
        </h2>

        {/* Subtitle */}
        {data.subtitle && (
          <p className="text-sm md:text-base text-white/80 mb-2">{data.subtitle}</p>
        )}

        {/* Decorative Line */}
        <div className="w-16 md:w-20 h-px bg-[#f5c242] mb-3 md:mb-4" />

        {/* Desktop: Map Container with Beach Badge */}
        <div className="hidden md:flex w-full max-w-3xl mb-3 relative bg-[#8b7765]/60 backdrop-blur-sm rounded-lg p-4 items-center justify-center" style={{ minHeight: '100px' }}>
          {/* Beach Badge inside map - left side */}
          {data.beach_distance && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#f5c242]/25 backdrop-blur-sm border border-[#f5c242]/50 rounded-lg px-3 py-2 flex flex-col items-center">
              <Waves className="w-5 h-5 text-white mb-1" />
              <span className="text-2xl font-bold text-[#f5c242]" style={{ textShadow: softShadow }}>{data.beach_distance}</span>
              <span className="text-xs text-white/90">min to beach</span>
            </div>
          )}
          
          {/* SVG Map */}
          <svg className="w-full h-full" viewBox="0 0 420 100" style={{ maxWidth: '380px' }}>
            {/* Horizontal line */}
            <line x1="40" y1="50" x2="380" y2="50" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="5,5" />
            
            {/* Left landmark */}
            <circle cx="80" cy="50" r="6" fill="rgba(255,255,255,0.5)" />
            <text x="80" y="75" textAnchor="middle" fill="white" fontSize="10" fontWeight="300" style={{ textShadow: softShadow }}>
              {data.left_landmark || 'Gordon Beach'}
            </text>
            <text x="80" y="88" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8">
              {data.left_distance || '3 min'}
            </text>
            
            {/* Center - Property */}
            <circle cx="210" cy="50" r="8" fill="#f5c242" />
            <text x="210" y="75" textAnchor="middle" fill="#f5c242" fontSize="11" fontWeight="500" style={{ textShadow: softShadow }}>
              {data.property_name || data.title || 'Property'}
            </text>
            
            {/* Right landmark */}
            <circle cx="340" cy="50" r="6" fill="rgba(255,255,255,0.5)" />
            <text x="340" y="75" textAnchor="middle" fill="white" fontSize="10" fontWeight="300" style={{ textShadow: softShadow }}>
              {data.right_landmark || 'Dizengoff'}
            </text>
            <text x="340" y="88" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8">
              {data.right_distance || '5 min'}
            </text>
          </svg>
        </div>

        {/* Mobile: Beach Badge only */}
        {data.beach_distance && (
          <div className="md:hidden w-full max-w-3xl mb-3">
            <div className="bg-[#f5c242]/20 backdrop-blur-sm border border-[#f5c242]/40 rounded-xl px-4 py-2 flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-[#f5c242] flex items-center justify-center">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="text-2xl font-bold text-[#f5c242]" style={{ textShadow: softShadow }}>
                  {data.beach_distance}
                </span>
                <span className="text-base font-light text-white ml-2" style={{ textShadow: softShadow }}>
                  min to the beach
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Row: Location Highlights + Appeals To */}
        <div className="w-full max-w-3xl flex flex-col md:flex-row gap-3 md:gap-4">
          {/* Location Highlights */}
          {data.location_highlights && data.location_highlights.length > 0 && (
            <div className="flex-1 bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-5 text-left">
              <h3 
                className="text-sm md:text-lg font-medium text-white mb-2 md:mb-3 flex items-center gap-2"
                style={{ textShadow: softShadow }}
              >
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-[#f5c242]" />
                Location Highlights
              </h3>
              <ul className="space-y-1.5 md:space-y-2">
                {data.location_highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2 text-white/90 text-xs md:text-sm">
                    <span className="text-[#f5c242] mt-0.5">•</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Appeals To */}
          {data.appeals_to && data.appeals_to.length > 0 && (
            <div className="flex-1 bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-4 md:p-5">
              <h3 
                className="text-sm md:text-lg font-medium text-white mb-2 md:mb-3 text-center"
                style={{ textShadow: softShadow }}
              >
                Appeals to
              </h3>
              <div className="flex flex-col gap-2">
                {data.appeals_to.map((audience, index) => {
                  const IconComponent = defaultIcons[index % defaultIcons.length];
                  return (
                    <span 
                      key={index} 
                      className="bg-white/20 backdrop-blur-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full text-white text-xs md:text-sm font-light flex items-center gap-2 justify-center"
                    >
                      <IconComponent className="w-3 h-3 md:w-4 md:h-4 text-[#f5c242]" />
                      {audience}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicNeighborhoodSlide;
