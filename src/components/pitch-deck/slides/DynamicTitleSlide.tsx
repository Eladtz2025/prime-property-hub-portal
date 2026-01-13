import { TitleSlideData } from '@/types/pitch-deck';

interface DynamicTitleSlideProps {
  data: TitleSlideData;
  backgroundImage?: string;
  overlayOpacity?: number;
}

const DynamicTitleSlide = ({ 
  data, 
  backgroundImage = '/images/ben-yehuda-110/cleaned-property-image (2).png',
  overlayOpacity = 0.85 
}: DynamicTitleSlideProps) => {
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
      
      {/* Content - centered */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-6 md:px-8">
        {/* Decorative Line */}
        <div className="w-16 md:w-24 h-px bg-white mb-4 md:mb-6" />

        {/* Main Title */}
        <h1 
          className="text-3xl md:text-5xl lg:text-7xl font-serif font-light text-white mb-2 tracking-wide"
          style={{ textShadow: softShadow }}
        >
          {data.main_title || 'Property Title'}
        </h1>

        {/* Decorative Line */}
        <div className="w-16 md:w-24 h-px bg-white mb-4 md:mb-6" />

        {/* Company Name */}
        <p 
          className="text-xs md:text-sm lg:text-base font-medium text-white tracking-[0.3em]"
          style={{ textShadow: softShadow }}
        >
          {data.subtitle || 'CITY MARKET PROPERTIES'}
        </p>
      </div>
    </div>
  );
};

export default DynamicTitleSlide;
