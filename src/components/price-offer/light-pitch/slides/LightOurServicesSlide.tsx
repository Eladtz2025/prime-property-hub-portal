import slideBg from "@/assets/light-pitch/slide-04-services.jpg";
import { Target, TrendingUp, Megaphone } from "lucide-react";

const services = [
  {
    icon: Target,
    title: "Target Audience",
    description: "Identifying and reaching the right buyers for your property",
  },
  {
    icon: TrendingUp,
    title: "Market Positioning",
    description: "Strategic pricing and positioning in the current market",
  },
  {
    icon: Megaphone,
    title: "Marketing",
    description: "Professional photography, staging, and multi-channel promotion",
  },
];

const LightOurServicesSlide = () => {
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
          Our Services
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {services.map((service, index) => (
            <div 
              key={index}
              className="bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-6 text-center"
            >
              <service.icon className="w-10 h-10 text-[#f5c242] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">{service.title}</h3>
              <p className="text-sm text-white/70 font-light">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LightOurServicesSlide;
