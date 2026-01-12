import { Home, Building2 } from 'lucide-react';

const BYPropertySlide = () => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';
  
  const apartmentDetails = [
    "Duplex spanning Floors 4 & 5",
    "Registered interior area: 53.23 sqm",
    "Registered roof attachment: 19.78 sqm",
    "Weighted area: approx. 69.9 sqm",
    "Two private outdoor spaces",
    "MAMAD (secure room)",
    "Elevator",
    "Full ownership, clear registration"
  ];

  const buildingDetails = [
    "Boutique residential building",
    "4 floors | 15 apartments",
    "Duplex units on top floors",
    "Residential, well-maintained atmosphere"
  ];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/Ben Yehuda 110/IMG_5760.JPG')`,
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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-6 md:px-12 py-16 overflow-y-auto">
        {/* Main Title */}
        <h1 
          className="text-2xl md:text-4xl lg:text-5xl font-serif font-light text-white mb-2"
          style={{ textShadow: softShadow }}
        >
          3-Room Duplex Apartment | Approx. 70 sqm
        </h1>

        {/* Subtitle */}
        <h2 
          className="text-lg md:text-xl lg:text-2xl font-light text-white/90 mb-6"
          style={{ textShadow: softShadow }}
        >
          Ben Yehuda 110, Apartment 14
        </h2>

        {/* Decorative Line */}
        <div className="w-20 h-px bg-white/60 mb-8" />

        {/* Two Column Layout */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* The Apartment */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-6 md:p-8 text-left">
            <div className="flex items-center gap-3 mb-5">
              <Home className="w-6 h-6 text-white/80" />
              <h3 
                className="text-lg md:text-xl font-serif font-medium text-white uppercase tracking-wider"
                style={{ textShadow: softShadow }}
              >
                The Apartment
              </h3>
            </div>
            <ul className="space-y-3">
              {apartmentDetails.map((detail, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-3 text-white/90 text-sm md:text-base font-light"
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                >
                  <span className="text-white/60 mt-1">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* The Building */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-6 md:p-8 text-left">
            <div className="flex items-center gap-3 mb-5">
              <Building2 className="w-6 h-6 text-white/80" />
              <h3 
                className="text-lg md:text-xl font-serif font-medium text-white uppercase tracking-wider"
                style={{ textShadow: softShadow }}
              >
                The Building
              </h3>
            </div>
            <ul className="space-y-3">
              {buildingDetails.map((detail, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-3 text-white/90 text-sm md:text-base font-light"
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                >
                  <span className="text-white/60 mt-1">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BYPropertySlide;
