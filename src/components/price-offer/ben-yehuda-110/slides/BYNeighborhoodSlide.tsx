import { Waves, MapPin, Coffee, ShoppingBag, TreePalm } from 'lucide-react';

const BYNeighborhoodSlide = () => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';
  
  const locationHighlights = [
    "Steps from the beach and promenade",
    "Fully walkable daily life",
    "Cafés, bakeries, galleries, and neighborhood services"
  ];

  const appealsTo = [
    "Lifestyle buyers",
    "Foreign residents",
    "Long-term investors"
  ];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/ben-yehuda-110/IMG_5763.JPG')`,
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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-4 md:px-8 py-6 md:py-8" dir="ltr">
        {/* Title */}
        <h2 
          className="text-lg md:text-3xl lg:text-4xl font-serif font-light text-white mb-3 md:mb-4"
          style={{ textShadow: softShadow }}
        >
          Old North | Ben Yehuda · Dizengoff · Gordon
        </h2>

        {/* Decorative Line */}
        <div className="w-16 md:w-20 h-px bg-[#f5c242] mb-3 md:mb-4" />

        {/* Top Row: Beach Badge + Map */}
        <div className="w-full max-w-3xl flex flex-col md:flex-row gap-3 md:gap-4 mb-3 md:mb-4">
          {/* Beach Distance Banner - Left side */}
          <div className="bg-[#f5c242]/20 backdrop-blur-sm border border-[#f5c242]/40 rounded-xl px-4 md:px-6 py-2 md:py-3 flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#f5c242] flex items-center justify-center">
              <Waves className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="text-left">
              <span 
                className="text-2xl md:text-4xl font-bold text-[#f5c242]"
                style={{ textShadow: softShadow }}
              >
                3
              </span>
              <span 
                className="text-base md:text-xl font-light text-white ml-2"
                style={{ textShadow: softShadow }}
              >
                min to the beach
              </span>
            </div>
          </div>

          {/* Stylized Map - Right side, hidden on mobile */}
          <div className="hidden md:flex flex-1 bg-[#8b7765]/60 backdrop-blur-sm rounded-lg p-4 items-center justify-center">
            <div className="relative h-24 w-full">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 100">
                <line x1="50" y1="50" x2="350" y2="50" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="4,4" />
                <line x1="200" y1="15" x2="200" y2="85" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="4,4" />
                <circle cx="200" cy="50" r="8" fill="#f5c242" />
                <text x="200" y="75" textAnchor="middle" fill="white" fontSize="10" fontWeight="500">Ben Yehuda 110</text>
                <circle cx="80" cy="50" r="6" fill="rgba(255,255,255,0.8)" />
                <text x="80" y="35" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">Gordon Beach</text>
                <circle cx="320" cy="50" r="6" fill="rgba(255,255,255,0.8)" />
                <text x="320" y="35" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">Dizengoff St.</text>
                <text x="140" y="45" textAnchor="middle" fill="#f5c242" fontSize="8">3 min</text>
                <text x="260" y="45" textAnchor="middle" fill="#f5c242" fontSize="8">2 min</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Row: Location Highlights + Appeals To */}
        <div className="w-full max-w-3xl flex flex-col md:flex-row gap-3 md:gap-4">
          {/* Location Highlights - Left side */}
          <div className="flex-1 bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-5 text-left">
            <h3 
              className="text-sm md:text-lg font-medium text-white mb-2 md:mb-3 flex items-center gap-2"
              style={{ textShadow: softShadow }}
            >
              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-[#f5c242]" />
              Location Highlights
            </h3>
            <ul className="space-y-1.5 md:space-y-2">
              {locationHighlights.map((highlight, index) => (
                <li key={index} className="flex items-start gap-2 text-white/90 text-xs md:text-sm">
                  <span className="text-[#f5c242] mt-0.5">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Appeals To - Right side */}
          <div className="flex-1 bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-4 md:p-5">
            <h3 
              className="text-sm md:text-lg font-medium text-white mb-2 md:mb-3 text-center"
              style={{ textShadow: softShadow }}
            >
              Appeals to
            </h3>
            <div className="flex flex-col gap-2">
              {appealsTo.map((audience, index) => {
                const icons = [Coffee, ShoppingBag, TreePalm];
                const IconComponent = icons[index];
                return (
                  <span 
                    key={index} 
                    className="bg-white/20 backdrop-blur-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full text-white text-xs md:text-sm font-light flex items-center gap-2 justify-center"
                  >
                    <IconComponent className="w-3 h-3 md:w-4 md:h-4 text-[#f5c242]" />
                    {audience}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BYNeighborhoodSlide;
