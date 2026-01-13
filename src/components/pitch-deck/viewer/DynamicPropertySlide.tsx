import { Home, Maximize, Layers, Building2 } from 'lucide-react';
import DynamicSlideWrapper from './DynamicSlideWrapper';

interface DynamicPropertySlideProps {
  data: Record<string, unknown>;
  backgroundImage?: string | null;
  overlayOpacity?: number;
  themeColor?: string;
  language?: 'he' | 'en';
}

const DynamicPropertySlide = ({ 
  data, 
  backgroundImage, 
  overlayOpacity,
  language = 'en'
}: DynamicPropertySlideProps) => {
  const title = (data?.title as string) || 'Property Details';
  const address = (data?.address as string) || '';
  const price = (data?.price as string) || '';
  const size = (data?.size as string) || '';
  const rooms = (data?.rooms as string) || '';
  const floor = (data?.floor as string) || '';
  const description = (data?.description as string) || '';

  const isHebrew = language === 'he';

  return (
    <DynamicSlideWrapper backgroundImage={backgroundImage} overlayOpacity={overlayOpacity}>
      <div className="h-full w-full flex flex-col justify-center p-8 md:p-16" dir={isHebrew ? 'rtl' : 'ltr'}>
        {/* Title */}
        <h2 
          className="text-3xl md:text-5xl font-bold text-white mb-8"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.7)' }}
        >
          {title}
        </h2>
        
        {/* Address */}
        {address && (
          <p 
            className="text-xl md:text-2xl text-white/90 mb-8"
            style={{ textShadow: '0 2px 15px rgba(0,0,0,0.5)' }}
          >
            {address}
          </p>
        )}
        
        {/* Property Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {rooms && (
            <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-xl p-4 text-center">
              <Home className="h-8 w-8 text-[#f5c242] mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{rooms}</p>
              <p className="text-sm text-white/70">{isHebrew ? 'חדרים' : 'Rooms'}</p>
            </div>
          )}
          
          {size && (
            <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-xl p-4 text-center">
              <Maximize className="h-8 w-8 text-[#f5c242] mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{size}</p>
              <p className="text-sm text-white/70">{isHebrew ? 'מ"ר' : 'sqm'}</p>
            </div>
          )}
          
          {floor && (
            <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-xl p-4 text-center">
              <Layers className="h-8 w-8 text-[#f5c242] mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{floor}</p>
              <p className="text-sm text-white/70">{isHebrew ? 'קומה' : 'Floor'}</p>
            </div>
          )}
          
          {price && (
            <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-xl p-4 text-center">
              <Building2 className="h-8 w-8 text-[#f5c242] mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{price}</p>
              <p className="text-sm text-white/70">{isHebrew ? 'מחיר' : 'Price'}</p>
            </div>
          )}
        </div>
        
        {/* Description */}
        {description && (
          <p 
            className="text-lg text-white/80 max-w-2xl"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
          >
            {description}
          </p>
        )}
      </div>
    </DynamicSlideWrapper>
  );
};

export default DynamicPropertySlide;
