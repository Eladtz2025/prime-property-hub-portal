import { FeaturesSlideData } from '@/types/pitch-deck';

interface DynamicFeaturesSlideProps {
  data: FeaturesSlideData;
  backgroundImage?: string;
  overlayOpacity?: number;
}

const DynamicFeaturesSlide = ({ 
  data, 
  backgroundImage = '/images/ben-yehuda-110/cleaned-property-image (4).png',
  overlayOpacity = 0.85 
}: DynamicFeaturesSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-4 md:px-8 py-6 md:py-8" dir="ltr">
        {/* Title */}
        <h2 
          className="text-xl md:text-3xl lg:text-4xl font-serif font-light text-white mb-3 md:mb-6"
          style={{ textShadow: softShadow }}
        >
          {data.title || 'Unique Features & Positioning'}
        </h2>

        {/* Decorative Line */}
        <div className="w-16 md:w-20 h-px bg-white/60 mb-4 md:mb-6" />

        {/* Two Column Layout for Features */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-4 md:mb-6">
          {/* Key Features */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-6 text-left">
            <h3 
              className="text-base md:text-lg font-medium text-white mb-3 md:mb-4"
              style={{ textShadow: softShadow }}
            >
              Key Features
            </h3>
            <ul className="space-y-2 md:space-y-3">
              {(data.key_features || []).map((feature, index) => (
                <li key={index} className="flex items-start gap-2 md:gap-3 text-white/90 text-xs md:text-sm">
                  <span className="text-[#f5c242] mt-0.5">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Value Elements */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-6 text-left">
            <h3 
              className="text-base md:text-lg font-medium text-white mb-3 md:mb-4"
              style={{ textShadow: softShadow }}
            >
              Value Elements
            </h3>
            <ul className="space-y-2 md:space-y-3">
              {(data.value_elements || []).map((item, index) => (
                <li key={index} className="flex items-start gap-2 md:gap-3 text-white/90 text-xs md:text-sm">
                  <span className="text-[#f5c242] mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quote - Full Width */}
        {data.quote && (
          <div className="w-full max-w-4xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-4 md:p-6 text-center">
            <p 
              className="text-white text-xs md:text-sm font-light italic"
              style={{ textShadow: softShadow }}
            >
              "{data.quote}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicFeaturesSlide;
