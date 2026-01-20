import { PricingSlideData } from '@/types/pitch-deck';
import { TrendingUp, Home, BarChart3 } from 'lucide-react';

interface DynamicPricingSlideProps {
  data: PricingSlideData;
  backgroundImage?: string;
  overlayOpacity?: number;
}

const DynamicPricingSlide = ({ 
  data, 
  backgroundImage = '/images/ben-yehuda-110/IMG_5765.JPG',
  overlayOpacity = 0.85 
}: DynamicPricingSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  return (
    <div className="relative flex h-full w-full flex-col">
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
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-4 md:px-8 lg:px-10 xl:px-12 py-3 md:py-4 lg:py-3 xl:py-6" dir="ltr">
          {/* Title */}
          <h2 
            className="text-2xl md:text-4xl lg:text-3xl xl:text-5xl font-serif font-light text-white mb-2 md:mb-4 lg:mb-2 xl:mb-6"
            style={{ textShadow: softShadow }}
          >
            {data.title || 'Market Context'}
          </h2>

          {/* Decorative Line */}
          <div className="w-12 md:w-16 h-px bg-[#f5c242] mb-2 md:mb-4 lg:mb-2 xl:mb-6" />

          {/* Statistics Cards */}
          <div className="w-[90%] max-w-2xl grid grid-cols-3 gap-2 md:gap-3 lg:gap-2 xl:gap-4 mb-2 md:mb-3 lg:mb-2 xl:mb-4">
            {/* Price per sqm */}
            <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-2 md:p-4 lg:p-3 xl:p-5 text-center">
              <div className="w-6 h-6 md:w-10 md:h-10 lg:w-8 lg:h-8 xl:w-12 xl:h-12 rounded-full bg-[#f5c242]/20 flex items-center justify-center mx-auto mb-1 md:mb-2 lg:mb-1 xl:mb-3">
                <TrendingUp className="w-3 h-3 md:w-5 md:h-5 lg:w-4 lg:h-4 xl:w-6 xl:h-6 text-[#f5c242]" />
              </div>
              <p 
                className="text-base md:text-2xl lg:text-xl xl:text-3xl font-bold text-[#f5c242] mb-1 whitespace-nowrap"
                style={{ textShadow: softShadow }}
              >
                {data.price_per_sqm || '₪0'}
              </p>
              <p className="text-white/80 text-[10px] md:text-xs font-light">Price per sqm</p>
            </div>

            {/* Sales Range */}
            <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-2 md:p-4 lg:p-3 xl:p-5 text-center">
              <div className="w-6 h-6 md:w-10 md:h-10 lg:w-8 lg:h-8 xl:w-12 xl:h-12 rounded-full bg-[#f5c242]/20 flex items-center justify-center mx-auto mb-1 md:mb-2 lg:mb-1 xl:mb-3">
                <BarChart3 className="w-3 h-3 md:w-5 md:h-5 lg:w-4 lg:h-4 xl:w-6 xl:h-6 text-[#f5c242]" />
              </div>
              <p 
                className="text-sm md:text-xl lg:text-lg xl:text-2xl font-bold text-[#f5c242] mb-1 whitespace-nowrap"
                style={{ textShadow: softShadow }}
              >
                {data.sales_range || '₪0M–0M'}
              </p>
              <p className="text-white/80 text-[10px] md:text-xs font-light">Sales Range</p>
            </div>

            {/* Average Deal Size */}
            <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-2 md:p-4 lg:p-3 xl:p-5 text-center">
              <div className="w-6 h-6 md:w-10 md:h-10 lg:w-8 lg:h-8 xl:w-12 xl:h-12 rounded-full bg-[#f5c242]/20 flex items-center justify-center mx-auto mb-1 md:mb-2 lg:mb-1 xl:mb-3">
                <Home className="w-3 h-3 md:w-5 md:h-5 lg:w-4 lg:h-4 xl:w-6 xl:h-6 text-[#f5c242]" />
              </div>
              <p 
                className="text-base md:text-2xl lg:text-xl xl:text-3xl font-bold text-[#f5c242] mb-1 whitespace-nowrap"
                style={{ textShadow: softShadow }}
              >
                {data.avg_deal_size || '0 sqm'}
              </p>
              <p className="text-white/80 text-[10px] md:text-xs font-light">Average Deal Size</p>
            </div>
          </div>

          {/* Visual Price Range Bar */}
          {data.min_price && data.max_price && (
            <div className="w-[90%] max-w-2xl bg-[#8b7765]/60 backdrop-blur-sm rounded-lg p-2 md:p-3 lg:p-2 xl:p-4 mb-2 md:mb-3 lg:mb-2 xl:mb-4">
              <p className="text-white/80 text-[10px] md:text-xs mb-1 md:mb-2 lg:mb-1 xl:mb-2 font-light">Market Price Range</p>
              <div className="relative h-5 md:h-6 lg:h-5 xl:h-8 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(to right, rgba(245,194,66,0.4), rgba(245,194,66,0.8), rgba(245,194,66,1))'
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-2 md:px-3 lg:px-2 xl:px-4">
                  <span className="text-white font-medium text-[10px] md:text-xs lg:text-[10px] xl:text-sm">₪{data.min_price}M</span>
                  <span className="text-white font-medium text-[10px] md:text-xs lg:text-[10px] xl:text-sm">₪{data.max_price}M</span>
                </div>
              </div>
            </div>
          )}

          {/* Strategic Positioning */}
          {data.strategic_points && data.strategic_points.length > 0 && (
            <div className="w-[90%] max-w-2xl bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-2 md:p-3 lg:p-2 xl:p-3 text-left mb-4 md:mb-6 lg:mb-3 xl:mb-8">
              <h3 
                className="text-sm md:text-lg lg:text-base xl:text-lg font-serif text-white mb-1 md:mb-2 lg:mb-1 xl:mb-2"
                style={{ textShadow: softShadow }}
              >
                Strategic Positioning
              </h3>
              <ul className="space-y-0.5 lg:space-y-0 xl:space-y-1">
                {data.strategic_points.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-[#f5c242] mt-0.5">•</span>
                    <span className="text-white/90 text-xs md:text-sm lg:text-xs xl:text-sm font-light">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
    </div>
  );
};

export default DynamicPricingSlide;
