import { TrendingUp } from 'lucide-react';
import DynamicSlideWrapper from './DynamicSlideWrapper';

interface Comparable {
  address: string;
  price: string;
}

interface DynamicPricingSlideProps {
  data: Record<string, unknown>;
  backgroundImage?: string | null;
  overlayOpacity?: number;
  themeColor?: string;
  language?: 'he' | 'en';
}

const DynamicPricingSlide = ({ 
  data, 
  backgroundImage, 
  overlayOpacity,
  language = 'en'
}: DynamicPricingSlideProps) => {
  const title = (data?.title as string) || (language === 'he' ? 'ניתוח שוק' : 'Market Analysis');
  const pricePerSqm = (data?.pricePerSqm as string) || '';
  const comparables = (data?.comparables as Comparable[]) || [];

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
        
        {/* Price per sqm */}
        {pricePerSqm && (
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-md">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-10 w-10 text-[#f5c242]" />
              <div>
                <p className="text-sm text-white/70">{language === 'he' ? 'מחיר למ"ר' : 'Price per sqm'}</p>
                <p className="text-3xl font-bold text-white">{pricePerSqm}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Comparables */}
        {comparables.length > 0 && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="text-xl font-semibold text-white mb-4">
              {language === 'he' ? 'השוואת מחירים' : 'Comparable Properties'}
            </h3>
            {comparables.map((comp, index) => (
              <div 
                key={index}
                className="bg-[#8b7765]/60 backdrop-blur-sm rounded-lg p-4 flex justify-between items-center"
              >
                <span className="text-white">{comp.address}</span>
                <span className="text-[#f5c242] font-semibold">{comp.price}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DynamicSlideWrapper>
  );
};

export default DynamicPricingSlide;
