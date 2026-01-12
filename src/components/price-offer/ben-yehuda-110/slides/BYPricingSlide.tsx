import { TrendingUp, Home, BarChart3 } from 'lucide-react';

interface BYPricingSlideProps {
  content?: {
    title?: string;
    priceInfo?: string;
  };
}

const BYPricingSlide = ({ content }: BYPricingSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  const strategicPositioning = [
    "Priced within the active market band",
    "Reflects current conditions — not peak-cycle pricing"
  ];

  const minPrice = 2.9;
  const maxPrice = 5.7;
  
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/ben-yehuda-110/IMG_5765.JPG')`,
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
        {/* Title */}
        <h2 
          className="text-2xl md:text-4xl lg:text-5xl font-serif font-light text-white mb-3 md:mb-6"
          style={{ textShadow: softShadow }}
        >
          Market Context
        </h2>

        {/* Decorative Line */}
        <div className="w-12 md:w-16 h-px bg-[#f5c242] mb-3 md:mb-6" />

        {/* Statistics Cards */}
        <div className="w-full max-w-4xl grid grid-cols-3 gap-2 md:gap-4 mb-3 md:mb-4">
          {/* Price per sqm */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-5 text-center">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-[#f5c242]/20 flex items-center justify-center mx-auto mb-2 md:mb-3">
              <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-[#f5c242]" />
            </div>
            <p 
              className="text-xl md:text-3xl font-bold text-[#f5c242] mb-1"
              style={{ textShadow: softShadow }}
            >
              ₪58K
            </p>
            <p className="text-white/80 text-xs font-light">Price per sqm</p>
          </div>

          {/* Sales Range */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-5 text-center">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-[#f5c242]/20 flex items-center justify-center mx-auto mb-2 md:mb-3">
              <BarChart3 className="w-4 h-4 md:w-6 md:h-6 text-[#f5c242]" />
            </div>
            <p 
              className="text-lg md:text-2xl font-bold text-[#f5c242] mb-1"
              style={{ textShadow: softShadow }}
            >
              ₪2.9M–5.7M
            </p>
            <p className="text-white/80 text-xs font-light">Sales Range</p>
          </div>

          {/* Average Deal Size */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-3 md:p-5 text-center">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-[#f5c242]/20 flex items-center justify-center mx-auto mb-2 md:mb-3">
              <Home className="w-4 h-4 md:w-6 md:h-6 text-[#f5c242]" />
            </div>
            <p 
              className="text-xl md:text-3xl font-bold text-[#f5c242] mb-1"
              style={{ textShadow: softShadow }}
            >
              62 sqm
            </p>
            <p className="text-white/80 text-xs font-light">Average Deal Size</p>
          </div>
        </div>

        {/* Visual Price Range Bar */}
        <div className="w-full max-w-3xl bg-[#8b7765]/60 backdrop-blur-sm rounded-lg p-3 md:p-4 mb-3 md:mb-4">
          <p className="text-white/80 text-xs mb-2 font-light">Market Price Range — Ben Yehuda Area 2024</p>
          <div className="relative h-6 md:h-8 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: '100%',
                background: 'linear-gradient(to right, rgba(245,194,66,0.4), rgba(245,194,66,0.8), rgba(245,194,66,1))'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-3 md:px-4">
              <span className="text-white font-medium text-xs md:text-sm">₪{minPrice}M</span>
              <span className="text-white font-medium text-xs md:text-sm">₪{maxPrice}M</span>
            </div>
          </div>
        </div>

        {/* Strategic Positioning */}
        <div className="w-full max-w-3xl bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-2 md:p-3 text-left mb-6 md:mb-8">
          <h3 
            className="text-sm md:text-lg font-serif text-white mb-2"
            style={{ textShadow: softShadow }}
          >
            Strategic Positioning
          </h3>
          <ul className="space-y-1">
            {strategicPositioning.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-[#f5c242] mt-0.5">•</span>
                <span className="text-white/90 text-xs md:text-sm font-light">{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
};

export default BYPricingSlide;
