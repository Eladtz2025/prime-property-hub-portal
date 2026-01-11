import slideBg from "@/assets/light-pitch/slide-08-features.jpg";
import { Bed, Bath, Car, Maximize, Building2, Waves } from "lucide-react";

interface LightPropertyFeaturesSlideProps {
  rooms?: number;
  bathrooms?: number;
  parking?: boolean;
  size?: number;
  floor?: number;
  seaView?: boolean;
}

const LightPropertyFeaturesSlide = ({
  rooms = 4,
  bathrooms = 3,
  parking = true,
  size = 180,
  floor = 8,
  seaView = true,
}: LightPropertyFeaturesSlideProps) => {
  const features = [
    { icon: Bed, label: "Bedrooms", value: rooms.toString() },
    { icon: Bath, label: "Bathrooms", value: bathrooms.toString() },
    { icon: Maximize, label: "Size", value: `${size} sqm` },
    { icon: Building2, label: "Floor", value: floor.toString() },
    { icon: Car, label: "Parking", value: parking ? "Yes" : "No" },
    { icon: Waves, label: "Sea View", value: seaView ? "Yes" : "No" },
  ];

  return (
    <div 
      className="relative flex h-full w-full flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${slideBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Content */}
      <div className="relative z-10 px-4 md:px-8 max-w-4xl w-full">
        <h2 className="text-3xl md:text-4xl font-serif font-light text-white mb-8 text-center">
          Property Features
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-5 text-center"
            >
              <feature.icon className="w-7 h-7 text-[#f5c242] mx-auto mb-2" />
              <div className="text-xs text-white/60 uppercase tracking-wider mb-1">
                {feature.label}
              </div>
              <div className="text-lg font-medium text-white">
                {feature.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LightPropertyFeaturesSlide;
