import { Check } from 'lucide-react';
import DynamicSlideWrapper from './DynamicSlideWrapper';

interface DynamicMarketingSlideProps {
  data: Record<string, unknown>;
  backgroundImage?: string | null;
  overlayOpacity?: number;
  themeColor?: string;
  language?: 'he' | 'en';
}

const DynamicMarketingSlide = ({ 
  data, 
  backgroundImage, 
  overlayOpacity,
  language = 'en'
}: DynamicMarketingSlideProps) => {
  const title = (data?.title as string) || (language === 'he' ? 'אסטרטגיית שיווק' : 'Marketing Strategy');
  const strategies = (data?.strategies as string[]) || (data?.channels as string[]) || [];

  return (
    <DynamicSlideWrapper backgroundImage={backgroundImage} overlayOpacity={overlayOpacity}>
      <div className="h-full w-full flex flex-col justify-center p-8 md:p-16" dir={language === 'he' ? 'rtl' : 'ltr'}>
        {/* Title */}
        <h2 
          className="text-3xl md:text-5xl font-bold text-white mb-12"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.7)' }}
        >
          {title}
        </h2>
        
        {/* Strategies List */}
        <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-xl p-8 max-w-2xl">
          <ul className="space-y-4">
            {strategies.map((strategy, index) => (
              <li key={index} className="flex items-center gap-4 text-white text-lg">
                <div className="h-8 w-8 rounded-full bg-[#f5c242] flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-[#2d3b3a]" />
                </div>
                <span>{strategy}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DynamicSlideWrapper>
  );
};

export default DynamicMarketingSlide;
