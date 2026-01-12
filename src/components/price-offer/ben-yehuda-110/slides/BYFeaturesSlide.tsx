const BYFeaturesSlide = () => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';
  
  const keyFeatures = [
    "True duplex separation between private and living spaces",
    "Private roof terrace with legal registration",
    "Elevated position above street level",
    "Strong natural light and open flow"
  ];

  const rareCombination = [
    "Outdoor space",
    "Secure room",
    "Elevator",
    "Central coastal location"
  ];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/Ben Yehuda 110/IMG_5762.jpeg')`,
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
          UNIQUE FEATURES & POSITIONING
        </h2>

        {/* Decorative Line */}
        <div className="w-20 h-px bg-white/60 mb-8" />

        {/* Two Column Layout for Features */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Key Features */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-6 text-left">
            <h3 
              className="text-lg md:text-xl font-medium text-white mb-4"
              style={{ textShadow: softShadow }}
            >
              Key Features
            </h3>
            <ul className="space-y-3">
              {keyFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-white/90 text-sm md:text-base">
                  <span className="text-[#f5c242] mt-1">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Rare Combination */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-6 text-left">
            <h3 
              className="text-lg md:text-xl font-medium text-white mb-4"
              style={{ textShadow: softShadow }}
            >
              Rare Combination
            </h3>
            <ul className="space-y-3">
              {rareCombination.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-white/90 text-sm md:text-base">
                  <span className="text-[#f5c242] mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Positioning - Full Width */}
        <div className="w-full max-w-4xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-6 md:p-8">
          <h3 
            className="text-lg md:text-xl font-medium text-white mb-3"
            style={{ textShadow: softShadow }}
          >
            Positioning
          </h3>
          <p 
            className="text-white text-lg md:text-xl lg:text-2xl font-light italic"
            style={{ textShadow: softShadow }}
          >
            "A lifestyle-driven urban asset — not a standard apartment."
          </p>
        </div>
      </div>
    </div>
  );
};

export default BYFeaturesSlide;
