import slideBg from "@/assets/light-pitch/slide-12-lifestyle.jpg";
import { Coffee, ShoppingBag, Utensils, TreePalm } from "lucide-react";

const lifestyleItems = [
  { icon: Coffee, label: "Cafés & Bars" },
  { icon: ShoppingBag, label: "Shopping" },
  { icon: Utensils, label: "Restaurants" },
  { icon: TreePalm, label: "Beach Life" },
];

const LightNeighborhoodLifestyleSlide = () => {
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
        <h2 className="text-3xl md:text-4xl font-serif font-light text-white mb-4 text-center">
          Neighborhood Lifestyle
        </h2>
        
        <p className="text-center text-white/80 font-light mb-8 max-w-xl mx-auto">
          Experience the vibrant Mediterranean lifestyle just steps from your door
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {lifestyleItems.map((item, index) => (
            <div 
              key={index}
              className="bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-6 text-center"
            >
              <item.icon className="w-8 h-8 text-[#f5c242] mx-auto mb-3" />
              <span className="text-white font-light text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LightNeighborhoodLifestyleSlide;
