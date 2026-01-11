import slideBg from "@/assets/light-pitch/slide-07-details.jpg";
import { MapPin, DollarSign, Maximize } from "lucide-react";

interface LightPropertyDetailsSlideProps {
  location?: string;
  price?: string;
  size?: string;
}

const LightPropertyDetailsSlide = ({
  location = "Ben Yehuda Street, Tel Aviv",
  price = "$2,500,000",
  size = "180 sqm",
}: LightPropertyDetailsSlideProps) => {
  const details = [
    { icon: MapPin, label: "Location", value: location },
    { icon: DollarSign, label: "Price", value: price },
    { icon: Maximize, label: "Size", value: size },
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
          Property Details
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {details.map((detail, index) => (
            <div 
              key={index}
              className="bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-6 text-center"
            >
              <detail.icon className="w-8 h-8 text-[#f5c242] mx-auto mb-3" />
              <div className="text-sm text-white/60 uppercase tracking-wider mb-2">
                {detail.label}
              </div>
              <div className="text-xl font-medium text-white">
                {detail.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LightPropertyDetailsSlide;
