interface BYMarketingSlideProps {
  content?: {
    title?: string;
    strategies?: string[];
  };
}

const BYMarketingSlide = ({ content }: BYMarketingSlideProps) => {
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), 0 16px 60px rgba(0,0,0,0.4)';

  const visualStrategy = [
    "Professional photography and video",
    "Lifestyle-led storytelling (light, elevation, outdoor living)",
    "Construction framed as temporary friction / long-term upside"
  ];

  const targetedAudiences = [
    "Local lifestyle buyers",
    "Foreign residents & overseas buyers",
    "Investors focused on proven demand"
  ];

  const exposureStrategy = [
    "Curated launch before mass advertising",
    "Private networks and off-market reach",
    "Precision over saturation"
  ];
  
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/Ben Yehuda 110/IMG_5766.JPG')`,
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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-4 md:px-8 py-16 overflow-y-auto" dir="ltr">
        {/* Title */}
        <h2 
          className="text-3xl md:text-5xl font-serif font-light text-white mb-6 md:mb-8"
          style={{ textShadow: softShadow }}
        >
          POSITIONING & STRATEGY
        </h2>

        {/* Decorative Line */}
        <div className="w-16 h-px bg-white mb-6 md:mb-8" />

        {/* Positioning Quote */}
        <div className="w-full max-w-4xl bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-5 md:p-6 mb-4 md:mb-6">
          <p 
            className="text-white text-lg md:text-xl lg:text-2xl font-light italic"
            style={{ textShadow: softShadow }}
          >
            "This is not just an apartment — it is a coastal Old North lifestyle asset."
          </p>
        </div>

        {/* Three Column Grid */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {/* Visual & Narrative Strategy */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-5 text-left">
            <h3 
              className="text-base md:text-lg font-serif text-white mb-3"
              style={{ textShadow: softShadow }}
            >
              Visual & Narrative Strategy
            </h3>
            <ul className="space-y-2">
              {visualStrategy.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-white/60 mt-1 text-sm">•</span>
                  <span className="text-white/90 text-xs md:text-sm font-light">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Targeted Audiences */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-5 text-left">
            <h3 
              className="text-base md:text-lg font-serif text-white mb-3"
              style={{ textShadow: softShadow }}
            >
              Targeted Audiences
            </h3>
            <ul className="space-y-2">
              {targetedAudiences.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-white/60 mt-1 text-sm">•</span>
                  <span className="text-white/90 text-xs md:text-sm font-light">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Exposure Strategy */}
          <div className="bg-[#8b7765]/70 backdrop-blur-sm rounded-lg p-4 md:p-5 text-left">
            <h3 
              className="text-base md:text-lg font-serif text-white mb-3"
              style={{ textShadow: softShadow }}
            >
              Exposure Strategy
            </h3>
            <ul className="space-y-2">
              {exposureStrategy.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-white/60 mt-1 text-sm">•</span>
                  <span className="text-white/90 text-xs md:text-sm font-light">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BYMarketingSlide;
