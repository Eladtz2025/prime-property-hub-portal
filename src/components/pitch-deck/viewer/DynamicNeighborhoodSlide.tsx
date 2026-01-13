import { MapPin } from 'lucide-react';
import DynamicSlideWrapper from './DynamicSlideWrapper';

interface DynamicNeighborhoodSlideProps {
  data: Record<string, unknown>;
  backgroundImage?: string | null;
  overlayOpacity?: number;
  themeColor?: string;
  language?: 'he' | 'en';
}

const DynamicNeighborhoodSlide = ({ 
  data, 
  backgroundImage, 
  overlayOpacity,
  language = 'en'
}: DynamicNeighborhoodSlideProps) => {
  const title = (data?.title as string) || (language === 'he' ? 'השכונה' : 'The Neighborhood');
  const description = (data?.description as string) || '';
  const highlights = (data?.highlights as string[]) || [];

  return (
    <DynamicSlideWrapper backgroundImage={backgroundImage} overlayOpacity={overlayOpacity}>
      <div className="h-full w-full flex flex-col justify-center p-8 md:p-16" dir={language === 'he' ? 'rtl' : 'ltr'}>
        {/* Title */}
        <h2 
          className="text-3xl md:text-5xl font-bold text-white mb-8"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.7)' }}
        >
          {title}
        </h2>
        
        {/* Description */}
        {description && (
          <p 
            className="text-xl text-white/90 mb-8 max-w-2xl"
            style={{ textShadow: '0 2px 15px rgba(0,0,0,0.5)' }}
          >
            {description}
          </p>
        )}
        
        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-xl p-6 max-w-2xl">
            <ul className="space-y-3">
              {highlights.map((highlight, index) => (
                <li key={index} className="flex items-center gap-3 text-white">
                  <MapPin className="h-5 w-5 text-[#f5c242] flex-shrink-0" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DynamicSlideWrapper>
  );
};

export default DynamicNeighborhoodSlide;
