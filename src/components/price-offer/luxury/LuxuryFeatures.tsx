import { Check, Home, MapPin, Building, Car, Wind, Shield, Sparkles, TreePine } from "lucide-react";

interface Feature {
  icon?: string;
  title: string;
  description?: string;
}

interface LuxuryFeaturesProps {
  features: Feature[];
  title?: string;
}

const iconMap: Record<string, React.ElementType> = {
  home: Home,
  location: MapPin,
  building: Building,
  parking: Car,
  aircon: Wind,
  security: Shield,
  luxury: Sparkles,
  nature: TreePine,
  default: Check,
};

const LuxuryFeatures = ({ features, title }: LuxuryFeaturesProps) => {
  if (!features || features.length === 0) return null;

  return (
    <div className="w-full">
      {title && (
        <h2 className="mb-16 text-center font-serif text-3xl font-light text-gray-900 md:text-4xl">
          {title}
        </h2>
      )}

      <div className={`grid gap-8 ${
        features.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : 
        features.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      }`}>
        {features.map((feature, index) => {
          const IconComponent = iconMap[feature.icon || 'default'] || iconMap.default;
          
          return (
            <div 
              key={index} 
              className="group flex flex-col items-center text-center"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 transition-all duration-300 group-hover:border-gray-900 group-hover:bg-gray-900">
                <IconComponent className="h-7 w-7 text-gray-600 transition-colors group-hover:text-white" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                {feature.title}
              </h3>
              {feature.description && (
                <p className="text-sm font-light leading-relaxed text-gray-500">
                  {feature.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LuxuryFeatures;
