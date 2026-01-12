import { Waves, MapPin, Coffee, ShoppingBag, TreePalm } from 'lucide-react';

const BYNeighborhoodSlide = () => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';
  
  const locationHighlights = [
    "Steps from the beach and promenade",
    "Fully walkable daily life",
    "Cafés, bakeries, galleries, and neighborhood services",
    "Established, proven residential area",
    "Coastal living without car dependency"
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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-6 md:px-12 py-16 overflow-y-auto" dir="ltr">
        {/* Title */}
        <h2 
          className="text-2xl md:text-4xl lg:text-5xl font-serif font-light text-white mb-6"
          style={{ textShadow: softShadow }}
        >
          Old North | Ben Yehuda · Dizengoff · Gordon
        </h2>

        {/* Decorative Line */}
        <div className="w-20 h-px bg-[#f5c242] mb-6" />

        {/* Beach Distance Banner */}
        <div className="bg-[#f5c242]/20 backdrop-blur-sm border border-[#f5c242]/40 rounded-xl px-8 py-4 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#f5c242] flex items-center justify-center">
            <Waves className="w-7 h-7 text-white" />
          </div>
          <div className="text-left">
            <span 
              className="text-4xl md:text-5xl font-bold text-[#f5c242]"
              style={{ textShadow: softShadow }}
            >
              3
            </span>
            <span 
              className="text-xl md:text-2xl font-light text-white ml-2"
              style={{ textShadow: softShadow }}
            >
              min to the beach
            </span>
          </div>
        </div>

        {/* Stylized Map */}
        <div className="w-full max-w-2xl bg-[#8b7765]/60 backdrop-blur-sm rounded-lg p-5 mb-6">
          <div className="relative h-32 md:h-40">
            {/* Map Lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 120">
              {/* Streets */}
              <line x1="50" y1="60" x2="350" y2="60" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="4,4" />
              <line x1="200" y1="20" x2="200" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="4,4" />
              
              {/* Location dots with labels */}
              {/* Ben Yehuda 110 - Center */}
              <circle cx="200" cy="60" r="8" fill="#f5c242" />
              <text x="200" y="85" textAnchor="middle" fill="white" fontSize="10" fontWeight="500">Ben Yehuda 110</text>
              
              {/* Gordon Beach */}
              <circle cx="80" cy="60" r="6" fill="rgba(255,255,255,0.8)" />
              <text x="80" y="45" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">Gordon Beach</text>
              
              {/* Dizengoff */}
              <circle cx="320" cy="60" r="6" fill="rgba(255,255,255,0.8)" />
              <text x="320" y="45" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">Dizengoff St.</text>
              
              {/* Distance annotations */}
              <text x="140" y="55" textAnchor="middle" fill="#f5c242" fontSize="8">3 min</text>
              <text x="260" y="55" textAnchor="middle" fill="#f5c242" fontSize="8">2 min</text>
            </svg>
          </div>
        </div>

        {/* Location Highlights */}
        <div className="w-full max-w-3xl bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-6 md:p-8 text-left mb-6">
          <h3 
            className="text-lg md:text-xl font-medium text-white mb-5 flex items-center gap-2"
            style={{ textShadow: softShadow }}
          >
            <MapPin className="w-5 h-5 text-[#f5c242]" />
            Location Highlights
          </h3>
          <ul className="space-y-3">
            {locationHighlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-3 text-white/90 text-base md:text-lg">
                <span className="text-[#f5c242] mt-1">•</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Appeals To */}
        <div className="w-full max-w-3xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-6 md:p-8">
          <h3 
            className="text-lg md:text-xl font-medium text-white mb-4"
            style={{ textShadow: softShadow }}
          >
            Appeals to
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {appealsTo.map((audience, index) => {
              const icons = [Coffee, ShoppingBag, TreePalm];
              const IconComponent = icons[index];
              return (
                <span 
                  key={index} 
                  className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm md:text-base font-light flex items-center gap-2"
                >
                  <IconComponent className="w-4 h-4 text-[#f5c242]" />
                  {audience}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BYNeighborhoodSlide;
