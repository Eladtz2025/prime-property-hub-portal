import { PropertySlideData } from '@/types/pitch-deck';
import { Language, t as getT } from '@/lib/pitch-deck-translations';
import {
  LucideIcon,
  Square,
  Layers,
  ArrowUpDown,
  Compass,
  Building2,
  Shield,
  Lightbulb,
  Sparkles,
  Home,
  Sun,
  Wind,
  Car,
  Trees,
  Maximize,
  FileCheck
} from 'lucide-react';

interface DynamicPropertySlideProps {
  data: PropertySlideData & {
    // Old format fields
    address?: string;
    floor?: string | number;
    rooms?: string | number;
    size?: string;
    price?: string;
    description?: string;
  };
  language?: Language;
  backgroundImage?: string;
  overlayOpacity?: number;
}

const iconMap: Record<string, LucideIcon> = {
  Square,
  Layers,
  ArrowUpDown,
  Compass,
  Building2,
  Shield,
  Lightbulb,
  Sparkles,
  Home,
  sun: Sun,
  Sun,
  wind: Wind,
  Wind,
  car: Car,
  Car,
  trees: Trees,
  Trees,
  home: Home,
  shield: Shield,
  Maximize,
  FileCheck,
};

const DynamicPropertySlide = ({ 
  data, 
  language = 'en',
  backgroundImage = '/images/ben-yehuda-110/cleaned-property-image (2).png',
  overlayOpacity = 0.85 
}: DynamicPropertySlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';
  const t = getT(language);
  const isRTL = language === 'he';

  // Build apartment details from new or old format
  const apartmentDetails = data.apartment_details?.length 
    ? data.apartment_details 
    : [
        data.rooms && { icon: 'Layers', text: `${data.rooms} Rooms` },
        data.size && { icon: 'Square', text: data.size },
        data.floor && { icon: 'ArrowUpDown', text: `Floor ${data.floor}` },
        data.price && { icon: 'Sparkles', text: data.price },
      ].filter(Boolean) as Array<{ icon: string; text: string }>;

  // Building details from new format (old format didn't have this)
  const buildingDetails = data.building_details || [];

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
      <div className={`relative z-10 flex flex-1 flex-col items-center justify-center text-center px-4 md:px-8 py-4 md:py-6 ${isRTL ? 'font-hebrew' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Title */}
        <h2 
          className="text-xl md:text-3xl lg:text-4xl font-serif font-light text-white mb-2 md:mb-4"
          style={{ textShadow: softShadow }}
        >
          <span className="hidden md:block">{data.title || 'A Rare Opportunity in the Heart of the City'}</span>
          <span className="md:hidden">{data.title_mobile || data.title || 'A Rare Opportunity'}</span>
        </h2>

        {/* Decorative Line */}
        <div className="w-16 md:w-20 h-px bg-white/60 mb-4 md:mb-6" />

        {/* Two Column Layout */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          {/* The Apartment */}
          <div className={`bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h3 
              className="text-base md:text-lg font-medium text-white mb-3 md:mb-4"
              style={{ textShadow: softShadow }}
            >
              {t('theApartment')}
            </h3>
            <ul className="space-y-2 md:space-y-3">
              {apartmentDetails.map((item, index) => {
                const Icon = iconMap[item.icon] || Square;
                return (
                  <li key={index} className="flex items-center gap-2 md:gap-3 text-white/90 text-xs md:text-sm">
                    <Icon className="h-4 w-4 text-[#f5c242]" />
                    <span>{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* The Building */}
          {buildingDetails.length > 0 && (
            <div className={`bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-6 ${isRTL ? 'text-right' : 'text-left'}`}>
              <h3 
                className="text-base md:text-lg font-medium text-white mb-3 md:mb-4"
                style={{ textShadow: softShadow }}
              >
                {t('theBuilding')}
              </h3>
              <ul className="space-y-2 md:space-y-3">
                {buildingDetails.map((item, index) => {
                  const Icon = iconMap[item.icon] || Building2;
                  return (
                    <li key={index} className="flex items-center gap-2 md:gap-3 text-white/90 text-xs md:text-sm">
                      <Icon className="h-4 w-4 text-[#f5c242]" />
                      <span>{item.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicPropertySlide;
