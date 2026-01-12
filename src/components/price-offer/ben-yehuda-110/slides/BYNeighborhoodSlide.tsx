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
          backgroundImage: `url('/images/Ben Yehuda 110/IMG_5763.JPG')`,
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
        <div className="w-20 h-px bg-white/60 mb-8" />

        {/* Location Highlights */}
        <div className="w-full max-w-3xl bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-6 md:p-8 text-left mb-6">
          <h3 
            className="text-lg md:text-xl font-medium text-white mb-5"
            style={{ textShadow: softShadow }}
          >
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
            {appealsTo.map((audience, index) => (
              <span 
                key={index} 
                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm md:text-base font-light"
              >
                {audience}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BYNeighborhoodSlide;
