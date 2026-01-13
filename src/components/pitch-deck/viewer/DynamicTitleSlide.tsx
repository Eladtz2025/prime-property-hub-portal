import DynamicSlideWrapper from './DynamicSlideWrapper';
import cityMarketLogo from "@/assets/city-market-icon.png";

interface DynamicTitleSlideProps {
  data: Record<string, unknown>;
  backgroundImage?: string | null;
  overlayOpacity?: number;
  themeColor?: string;
  language?: 'he' | 'en';
}

const DynamicTitleSlide = ({ 
  data, 
  backgroundImage, 
  overlayOpacity,
  language = 'en'
}: DynamicTitleSlideProps) => {
  const title = (data?.title as string) || 'Presentation Title';
  const subtitle = (data?.subtitle as string) || '';

  return (
    <DynamicSlideWrapper backgroundImage={backgroundImage} overlayOpacity={overlayOpacity}>
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center" dir={language === 'he' ? 'rtl' : 'ltr'}>
        {/* Logo */}
        <img 
          src={cityMarketLogo} 
          alt="City Market Properties" 
          className="absolute top-8 left-8 h-16 md:h-20 w-auto"
        />
        
        {/* Title */}
        <h1 
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-wide"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.7), 0 2px 10px rgba(0,0,0,0.5)' }}
        >
          {title}
        </h1>
        
        {/* Subtitle */}
        {subtitle && (
          <p 
            className="text-xl md:text-2xl text-white/90 font-light tracking-widest"
            style={{ textShadow: '0 2px 15px rgba(0,0,0,0.5)' }}
          >
            {subtitle}
          </p>
        )}
        
        {/* Decorative line */}
        <div className="mt-8 w-32 h-1 bg-[#f5c242] rounded-full" />
      </div>
    </DynamicSlideWrapper>
  );
};

export default DynamicTitleSlide;
