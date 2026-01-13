import * as LucideIcons from 'lucide-react';
import DynamicSlideWrapper from './DynamicSlideWrapper';

interface Feature {
  icon?: string;
  title: string;
  description?: string;
}

interface DynamicFeaturesSlideProps {
  data: Record<string, unknown>;
  backgroundImage?: string | null;
  overlayOpacity?: number;
  themeColor?: string;
  language?: 'he' | 'en';
}

const DynamicFeaturesSlide = ({ 
  data, 
  backgroundImage, 
  overlayOpacity,
  language = 'en'
}: DynamicFeaturesSlideProps) => {
  const title = (data?.title as string) || (language === 'he' ? 'תכונות הנכס' : 'Property Features');
  const features = (data?.features as Feature[]) || [];

  const getIcon = (iconName?: string) => {
    if (!iconName) return LucideIcons.Star;
    const formattedName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
    return (LucideIcons as Record<string, unknown>)[formattedName] as React.ComponentType<{ className?: string }> || LucideIcons.Star;
  };

  return (
    <DynamicSlideWrapper backgroundImage={backgroundImage} overlayOpacity={overlayOpacity}>
      <div className="h-full w-full flex flex-col justify-center p-8 md:p-16" dir={language === 'he' ? 'rtl' : 'ltr'}>
        {/* Title */}
        <h2 
          className="text-3xl md:text-5xl font-bold text-white mb-12 text-center"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.7)' }}
        >
          {title}
        </h2>
        
        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const IconComponent = getIcon(feature.icon);
            return (
              <div 
                key={index}
                className="bg-[#8b7765]/70 backdrop-blur-sm rounded-xl p-6 text-center"
              >
                <IconComponent className="h-10 w-10 text-[#f5c242] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
                {feature.description && (
                  <p className="text-sm text-white/70">{feature.description}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DynamicSlideWrapper>
  );
};

export default DynamicFeaturesSlide;
