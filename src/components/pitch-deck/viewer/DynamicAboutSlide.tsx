import DynamicSlideWrapper from './DynamicSlideWrapper';
import cityMarketLogo from "@/assets/city-market-icon.png";

interface Stat {
  value: string;
  label: string;
}

interface DynamicAboutSlideProps {
  data: Record<string, unknown>;
  backgroundImage?: string | null;
  overlayOpacity?: number;
  themeColor?: string;
  language?: 'he' | 'en';
}

const DynamicAboutSlide = ({ 
  data, 
  backgroundImage, 
  overlayOpacity,
  language = 'en'
}: DynamicAboutSlideProps) => {
  const title = (data?.title as string) || 'About Us';
  const description = (data?.description as string) || '';
  const stats = (data?.stats as Stat[]) || [];

  return (
    <DynamicSlideWrapper backgroundImage={backgroundImage} overlayOpacity={overlayOpacity}>
      <div className="h-full w-full flex flex-col justify-center items-center p-8 md:p-16" dir={language === 'he' ? 'rtl' : 'ltr'}>
        {/* Logo */}
        <img 
          src={cityMarketLogo} 
          alt="City Market Properties" 
          className="h-20 md:h-28 w-auto mb-8"
        />
        
        {/* Title */}
        <h2 
          className="text-3xl md:text-5xl font-bold text-white mb-6 text-center"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.7)' }}
        >
          {title}
        </h2>
        
        {/* Description */}
        {description && (
          <p 
            className="text-xl text-white/90 mb-12 text-center max-w-2xl"
            style={{ textShadow: '0 2px 15px rgba(0,0,0,0.5)' }}
          >
            {description}
          </p>
        )}
        
        {/* Stats */}
        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-8 max-w-3xl">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="bg-[#8b7765]/70 backdrop-blur-sm rounded-xl p-6 text-center"
              >
                <p className="text-4xl font-bold text-[#f5c242] mb-2">{stat.value}</p>
                <p className="text-white/80 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DynamicSlideWrapper>
  );
};

export default DynamicAboutSlide;
