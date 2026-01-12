import { Layers, Square, Home, Maximize, Sun, Shield, ArrowUpDown, FileCheck, Building2, Users, Sparkles } from 'lucide-react';

const BYPropertySlide = () => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';
  
  const apartmentDetails = [
    { icon: Layers, text: "Duplex spanning Floors 4 & 5" },
    { icon: Square, text: "Registered interior area: 53.23 sqm" },
    { icon: Home, text: "Registered roof attachment: 19.78 sqm" },
    { icon: Maximize, text: "Weighted area: approx. 69.9 sqm" },
    { icon: Sun, text: "Two private outdoor spaces" },
    { icon: Shield, text: "MAMAD (secure room)" },
    { icon: FileCheck, text: "Full ownership, clear registration" }
  ];

  const buildingDetails = [
    { icon: Building2, text: "Boutique residential building" },
    { icon: Layers, text: "4 floors | 15 apartments" },
    { icon: Users, text: "Duplex units on top floors" },
    { icon: ArrowUpDown, text: "Elevator" },
    { icon: Sparkles, text: "Well-maintained residential atmosphere" }
  ];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/ben-yehuda-110/IMG_5760.JPG')`,
        }}
      />
      
      {/* Warm sand/orange filter overlay */}
      <div 
        className="absolute inset-0" 
        style={{ 
          backgroundColor: 'rgba(180, 140, 100, 0.85)',
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-4 md:px-8 py-6 md:py-8">
        {/* Main Title */}
        <h1 
          className="text-xl md:text-3xl lg:text-4xl font-serif font-light text-white mb-3 md:mb-6"
          style={{ textShadow: softShadow }}
        >
          3-Room Duplex Apartment | Approx. 70 sqm
        </h1>

        {/* Decorative Line */}
        <div className="w-16 md:w-20 h-px bg-[#f5c242] mb-4 md:mb-6" />

        {/* Two Column Layout */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6" dir="ltr">
          {/* The Apartment */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-6 text-left">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#f5c242]/20 flex items-center justify-center">
                <Home className="w-4 h-4 md:w-5 md:h-5 text-[#f5c242]" />
              </div>
              <h3 
                className="text-base md:text-lg font-serif font-medium text-white uppercase tracking-wider"
                style={{ textShadow: softShadow }}
              >
                The Apartment
              </h3>
            </div>
            <ul className="space-y-1.5 md:space-y-2">
              {apartmentDetails.map((detail, index) => {
                const IconComponent = detail.icon;
                return (
                  <li 
                    key={index}
                    className="flex items-start gap-2 text-white/90 text-xs md:text-sm font-light"
                    style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                  >
                    <IconComponent className="w-3 h-3 md:w-4 md:h-4 text-[#f5c242] mt-0.5 flex-shrink-0" />
                    <span>{detail.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* The Building */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-6 text-left">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#f5c242]/20 flex items-center justify-center">
                <Building2 className="w-4 h-4 md:w-5 md:h-5 text-[#f5c242]" />
              </div>
              <h3 
                className="text-base md:text-lg font-serif font-medium text-white uppercase tracking-wider"
                style={{ textShadow: softShadow }}
              >
                The Building
              </h3>
            </div>
            <ul className="space-y-1.5 md:space-y-2">
              {buildingDetails.map((detail, index) => {
                const IconComponent = detail.icon;
                return (
                  <li 
                    key={index}
                    className="flex items-start gap-2 text-white/90 text-xs md:text-sm font-light"
                    style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                  >
                    <IconComponent className="w-3 h-3 md:w-4 md:h-4 text-[#f5c242] mt-0.5 flex-shrink-0" />
                    <span>{detail.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BYPropertySlide;
